import crypto from 'node:crypto';
import { db, runInTransaction } from './db.ts';

const OPEN_MINUTES = 10 * 60;
const STEP_MINUTES = 30;

export interface PublicSlotDTO {
  time: string;
  available: boolean;
  reason?: string;
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function getClosingMinutes(dateStr: string): number {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.getDay() === 0 ? 20 * 60 : 21 * 60;
}

function getWeekdayIndex(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00`).getDay();
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMinutes(timeStr: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr);
  if (!match) {
    throw new ValidationError('Некоректний формат часу. Очікується ГГ:ХХ.');
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function validateDateString(dateStr: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new ValidationError('Некоректний формат дати.');
  }
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('Невірна календарна дата.');
  }
}

function getKyivNowParts(): { todayStr: string; nowMinutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const todayStr = `${map.year}-${map.month}-${map.day}`;
  const hour = Number(map.hour === '24' ? '0' : map.hour);
  const minute = Number(map.minute);
  return { todayStr, nowMinutes: hour * 60 + minute };
}

function getMinimumStartMinutesForDate(dateStr: string): number {
  const { todayStr, nowMinutes } = getKyivNowParts();
  if (dateStr < todayStr) return 24 * 60 + 1; // Past date: nothing available
  if (dateStr > todayStr) return OPEN_MINUTES;

  const buffered = nowMinutes + 30;
  return Math.max(OPEN_MINUTES, Math.ceil(buffered / STEP_MINUTES) * STEP_MINUTES);
}

interface BarberRow {
  id: string;
  name: string;
  role: string;
  experience_years: number;
  short_bio: string;
  full_bio: string;
  specialties_json: string;
  working_days: string;
  working_weekdays_json: string;
}

interface ServiceRow {
  id: string;
  number: string;
  title: string;
  category: string;
  category_label: string;
  price_uah: number;
  duration_min: number;
  short_description: string;
  included_steps_json: string;
  featured: number;
}

export function getPublicCatalog() {
  const services = (
    db
      .prepare('SELECT * FROM services WHERE active = 1 ORDER BY number ASC')
      .all() as unknown as ServiceRow[]
  ).map((row) => ({
    id: row.id,
    number: row.number,
    title: row.title,
    category: row.category,
    categoryLabel: row.category_label,
    priceUah: row.price_uah,
    durationMin: row.duration_min,
    shortDescription: row.short_description,
    includedSteps: JSON.parse(row.included_steps_json) as string[],
    featured: Boolean(row.featured),
  }));

  const barbersRaw = db
    .prepare('SELECT * FROM barbers WHERE active = 1')
    .all() as unknown as BarberRow[];

  const linksStmt = db.prepare(
    'SELECT service_id FROM barber_services WHERE barber_id = ?'
  );

  const barbers = barbersRaw.map((row) => {
    const linked = linksStmt.all(row.id) as unknown as { service_id: string }[];
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      experienceYears: row.experience_years,
      shortBio: row.short_bio,
      fullBio: row.full_bio,
      specialties: JSON.parse(row.specialties_json) as string[],
      workingDays: row.working_days,
      workingWeekdays: JSON.parse(row.working_weekdays_json) as number[],
      serviceIds: linked.map((l) => l.service_id),
    };
  });

  return { services, barbers };
}

function getEligibleBarbersForService(serviceId: string, requestedBarberId: string): BarberRow[] {
  if (requestedBarberId === 'any') {
    return db
      .prepare(`
        SELECT b.* FROM barbers b
        INNER JOIN barber_services bs ON bs.barber_id = b.id
        WHERE b.active = 1 AND bs.service_id = ?
      `)
      .all(serviceId) as unknown as BarberRow[];
  }

  return db
    .prepare(`
      SELECT b.* FROM barbers b
      INNER JOIN barber_services bs ON bs.barber_id = b.id
      WHERE b.active = 1 AND b.id = ? AND bs.service_id = ?
    `)
    .all(requestedBarberId, serviceId) as unknown as BarberRow[];
}

function isBarberAvailableForInterval(
  barber: BarberRow,
  dateStr: string,
  startMin: number,
  endMin: number
): { ok: boolean; reason?: string } {
  const closing = getClosingMinutes(dateStr);
  if (startMin < OPEN_MINUTES || endMin > closing) {
    return { ok: false, reason: 'Поза робочими годинами' };
  }

  const weekday = getWeekdayIndex(dateStr);
  const workingWeekdays = JSON.parse(barber.working_weekdays_json) as number[];
  if (!workingWeekdays.includes(weekday)) {
    return { ok: false, reason: 'Вихідний день майстра' };
  }

  const overlappingBooking = db
    .prepare(`
      SELECT id FROM bookings
      WHERE barber_id = ?
        AND booking_date = ?
        AND status != 'cancelled'
        AND start_min < ?
        AND end_min > ?
      LIMIT 1
    `)
    .get(barber.id, dateStr, endMin, startMin);

  if (overlappingBooking) {
    return { ok: false, reason: 'Зайнято' };
  }

  const overlappingBlock = db
    .prepare(`
      SELECT id FROM blocked_slots
      WHERE barber_id = ?
        AND block_date = ?
        AND start_min < ?
        AND end_min > ?
      LIMIT 1
    `)
    .get(barber.id, dateStr, endMin, startMin);

  if (overlappingBlock) {
    return { ok: false, reason: 'Перерва майстра' };
  }

  return { ok: true };
}

// Privacy-preserving public slot availability (NO personal data returned)
export function getPublicAvailableSlots(params: {
  serviceId: string;
  barberId: string;
  date: string;
}): PublicSlotDTO[] {
  validateDateString(params.date);

  const service = db
    .prepare('SELECT id, duration_min FROM services WHERE id = ? AND active = 1')
    .get(params.serviceId) as { id: string; duration_min: number } | undefined;

  if (!service) {
    throw new ValidationError('Обрану послугу не знайдено.');
  }

  const eligibleBarbers = getEligibleBarbersForService(
    params.serviceId,
    params.barberId
  );
  const closing = getClosingMinutes(params.date);
  const minToday = getMinimumStartMinutesForDate(params.date);
  const duration = service.duration_min;

  const slots: PublicSlotDTO[] = [];

  for (let start = OPEN_MINUTES; start + duration <= closing; start += STEP_MINUTES) {
    const timeStr = minutesToTime(start);

    if (start < minToday) {
      slots.push({ time: timeStr, available: false, reason: 'Недоступно' });
      continue;
    }

    if (eligibleBarbers.length === 0) {
      slots.push({ time: timeStr, available: false, reason: 'Немає майстра' });
      continue;
    }

    let freeFound = false;
    let lastReason = 'Зайнято';

    for (const barber of eligibleBarbers) {
      const check = isBarberAvailableForInterval(
        barber,
        params.date,
        start,
        start + duration
      );
      if (check.ok) {
        freeFound = true;
        break;
      } else if (check.reason) {
        lastReason = check.reason;
      }
    }

    slots.push({
      time: timeStr,
      available: freeFound,
      reason: freeFound ? undefined : lastReason,
    });
  }

  return slots;
}

export function createTransactionalBooking(input: {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  notes?: string;
}) {
  validateDateString(input.date);
  const startMin = timeToMinutes(input.time);

  const cleanName = (input.clientName || '').trim();
  if (cleanName.length < 2 || cleanName.length > 80) {
    throw new ValidationError('Введіть коректне ім’я (від 2 до 80 символів).');
  }

  const phoneDigits = (input.clientPhone || '').replace(/\D/g, '');
  if (phoneDigits.length !== 12 || !phoneDigits.startsWith('380')) {
    throw new ValidationError(
      'Введіть коректний український номер телефону (+380 XX XXX XX XX).'
    );
  }
  const cleanPhone = `+380 ${phoneDigits.slice(3, 5)} ${phoneDigits.slice(5, 8)} ${phoneDigits.slice(8, 10)} ${phoneDigits.slice(10, 12)}`;
  const cleanNotes = (input.notes || '').trim().slice(0, 300);

  return runInTransaction(() => {
    const service = db
      .prepare('SELECT * FROM services WHERE id = ? AND active = 1')
      .get(input.serviceId) as ServiceRow | undefined;

    if (!service) {
      throw new ValidationError('Обрану послугу не знайдено.');
    }

    const endMin = startMin + service.duration_min;
    const minStart = getMinimumStartMinutesForDate(input.date);

    if (startMin < minStart) {
      throw new ConflictError('Цей час уже минув або недоступний для запису.');
    }

    const eligibleBarbers = getEligibleBarbersForService(
      service.id,
      input.barberId
    );
    if (eligibleBarbers.length === 0) {
      throw new ValidationError('Обраний барбер не виконує цю процедуру.');
    }

    let chosenBarber: BarberRow | null = null;
    for (const barber of eligibleBarbers) {
      const check = isBarberAvailableForInterval(
        barber,
        input.date,
        startMin,
        endMin
      );
      if (check.ok) {
        chosenBarber = barber;
        break;
      }
    }

    if (!chosenBarber) {
      throw new ConflictError(
        'На жаль, цей часовий слот уже зайнято або заблоковано. Будь ласка, оберіть інший час.'
      );
    }

    const id = `bk_${crypto.randomUUID()}`;
    const bookingCode = `GC-${crypto.randomInt(1000, 9999)}`;
    const startTime = minutesToTime(startMin);
    const endTime = minutesToTime(endMin);
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO bookings (
        id, booking_code, service_id, barber_id, booking_date,
        start_min, end_min, start_time, end_time,
        client_name, client_phone, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
    `).run(
      id,
      bookingCode,
      service.id,
      chosenBarber.id,
      input.date,
      startMin,
      endMin,
      startTime,
      endTime,
      cleanName,
      cleanPhone,
      cleanNotes,
      createdAt
    );

    return {
      id,
      bookingCode,
      serviceId: service.id,
      serviceTitle: service.title,
      priceUah: service.price_uah,
      durationMin: service.duration_min,
      barberId: chosenBarber.id,
      barberName: chosenBarber.name,
      date: input.date,
      startTime,
      endTime,
      clientName: cleanName,
      clientPhone: cleanPhone,
      notes: cleanNotes,
      status: 'confirmed' as const,
      createdAt,
    };
  });
}

// --- ADMIN REPOSITORY METHODS ---

export function listAdminBookings(filters: {
  date?: string;
  barberId?: string;
  status?: string;
}) {
  const clauses: string[] = [];
  const args: string[] = [];

  if (filters.date && filters.date !== 'all') {
    validateDateString(filters.date);
    clauses.push('b.booking_date = ?');
    args.push(filters.date);
  }
  if (filters.barberId && filters.barberId !== 'all') {
    clauses.push('b.barber_id = ?');
    args.push(filters.barberId);
  }
  if (filters.status && filters.status !== 'all') {
    clauses.push('b.status = ?');
    args.push(filters.status);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = db
    .prepare(`
      SELECT
        b.id,
        b.booking_code,
        b.service_id,
        s.title AS service_title,
        s.price_uah,
        s.duration_min,
        b.barber_id,
        br.name AS barber_name,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.client_name,
        b.client_phone,
        b.notes,
        b.status,
        b.created_at
      FROM bookings b
      INNER JOIN services s ON s.id = b.service_id
      INNER JOIN barbers br ON br.id = b.barber_id
      ${whereSql}
      ORDER BY b.booking_date ASC, b.start_min ASC
    `)
    .all(...args) as Array<{
      id: string;
      booking_code: string;
      service_id: string;
      service_title: string;
      price_uah: number;
      duration_min: number;
      barber_id: string;
      barber_name: string;
      booking_date: string;
      start_time: string;
      end_time: string;
      client_name: string;
      client_phone: string;
      notes: string;
      status: 'confirmed' | 'completed' | 'cancelled';
      created_at: string;
    }>;

  return rows.map((r) => ({
    id: r.id,
    bookingCode: r.booking_code,
    serviceId: r.service_id,
    serviceTitle: r.service_title,
    priceUah: r.price_uah,
    durationMin: r.duration_min,
    barberId: r.barber_id,
    barberName: r.barber_name,
    date: r.booking_date,
    startTime: r.start_time,
    endTime: r.end_time,
    clientName: r.client_name,
    clientPhone: r.client_phone,
    notes: r.notes,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export function updateBookingStatus(
  bookingId: string,
  newStatus: 'confirmed' | 'completed' | 'cancelled'
) {
  if (!['confirmed', 'completed', 'cancelled'].includes(newStatus)) {
    throw new ValidationError('Неприпустимий статус запису.');
  }

  return runInTransaction(() => {
    const existing = db
      .prepare('SELECT * FROM bookings WHERE id = ?')
      .get(bookingId) as
      | {
          id: string;
          barber_id: string;
          booking_date: string;
          start_min: number;
          end_min: number;
          status: string;
        }
      | undefined;

    if (!existing) {
      throw new ValidationError('Запис не знайдено.');
    }

    // If restoring a cancelled booking, verify no overlap was created in the meantime
    if (existing.status === 'cancelled' && newStatus !== 'cancelled') {
      const overlap = db
        .prepare(`
          SELECT id FROM bookings
          WHERE barber_id = ?
            AND booking_date = ?
            AND id != ?
            AND status != 'cancelled'
            AND start_min < ?
            AND end_min > ?
          LIMIT 1
        `)
        .get(
          existing.barber_id,
          existing.booking_date,
          existing.id,
          existing.end_min,
          existing.start_min
        );

      if (overlap) {
        throw new ConflictError(
          'Неможливо відновити запис: цей час уже зайнятий іншим візитом.'
        );
      }
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(
      newStatus,
      bookingId
    );

    return { id: bookingId, status: newStatus };
  });
}

export function listBlockedSlots(filters: { date?: string; barberId?: string }) {
  const clauses: string[] = [];
  const args: string[] = [];

  if (filters.date && filters.date !== 'all') {
    validateDateString(filters.date);
    clauses.push('bl.block_date = ?');
    args.push(filters.date);
  }
  if (filters.barberId && filters.barberId !== 'all') {
    clauses.push('bl.barber_id = ?');
    args.push(filters.barberId);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = db
    .prepare(`
      SELECT
        bl.id,
        bl.barber_id,
        br.name AS barber_name,
        bl.block_date,
        bl.start_time,
        bl.end_time,
        bl.reason,
        bl.created_at
      FROM blocked_slots bl
      INNER JOIN barbers br ON br.id = bl.barber_id
      ${whereSql}
      ORDER BY bl.block_date ASC, bl.start_min ASC
    `)
    .all(...args) as Array<{
      id: string;
      barber_id: string;
      barber_name: string;
      block_date: string;
      start_time: string;
      end_time: string;
      reason: string;
      created_at: string;
    }>;

  return rows.map((r) => ({
    id: r.id,
    barberId: r.barber_id,
    barberName: r.barber_name,
    date: r.block_date,
    startTime: r.start_time,
    endTime: r.end_time,
    reason: r.reason,
    createdAt: r.created_at,
  }));
}

export function createBlockedSlot(input: {
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}) {
  validateDateString(input.date);
  const startMin = timeToMinutes(input.startTime);
  const endMin = timeToMinutes(input.endTime);

  if (endMin <= startMin) {
    throw new ValidationError('Час завершення повинен бути пізнішим за час початку.');
  }

  const cleanReason = (input.reason || 'Перерва / Неробочий час')
    .trim()
    .slice(0, 120);

  return runInTransaction(() => {
    const barber = db
      .prepare('SELECT id, name FROM barbers WHERE id = ? AND active = 1')
      .get(input.barberId) as { id: string; name: string } | undefined;

    if (!barber) {
      throw new ValidationError('Обраного барбера не знайдено.');
    }

    const activeBooking = db
      .prepare(`
        SELECT booking_code, start_time, end_time FROM bookings
        WHERE barber_id = ?
          AND booking_date = ?
          AND status = 'confirmed'
          AND start_min < ?
          AND end_min > ?
        LIMIT 1
      `)
      .get(barber.id, input.date, endMin, startMin) as
      | { booking_code: string; start_time: string; end_time: string }
      | undefined;

    if (activeBooking) {
      throw new ConflictError(
        `На цей час є підтверджений запис (${activeBooking.booking_code}, ${activeBooking.start_time}–${activeBooking.end_time}). Спочатку скасуйте його.`
      );
    }

    const id = `blk_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO blocked_slots (
        id, barber_id, block_date, start_min, end_min, start_time, end_time, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      barber.id,
      input.date,
      startMin,
      endMin,
      input.startTime,
      input.endTime,
      cleanReason,
      createdAt
    );

    return {
      id,
      barberId: barber.id,
      barberName: barber.name,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      reason: cleanReason,
      createdAt,
    };
  });
}

export function deleteBlockedSlot(blockId: string): void {
  const info = db
    .prepare('DELETE FROM blocked_slots WHERE id = ?')
    .run(blockId);
  if (info.changes === 0) {
    throw new ValidationError('Блокування не знайдено.');
  }
}
