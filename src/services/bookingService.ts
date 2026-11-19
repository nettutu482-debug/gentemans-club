import {
  AdminBookingItem,
  AdminUser,
  BlockedSlotItem,
  BookingStatus,
  ConfirmedBooking,
  TimeSlot,
} from '../types/barbershop';

const SESSION_BOOKINGS_KEY = 'gentlemans_club_client_receipts_v1';

export function getNextDays(
  count = 14
): {
  date: string;
  weekdayShort: string;
  dayNum: string;
  monthShort: string;
  isToday: boolean;
}[] {
  const result: {
    date: string;
    weekdayShort: string;
    dayNum: string;
    monthShort: string;
    isToday: boolean;
  }[] = [];
  const weekdayFormatter = new Intl.DateTimeFormat('uk-UA', { weekday: 'short' });
  const monthFormatter = new Intl.DateTimeFormat('uk-UA', { month: 'short' });
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const rawWeekday = weekdayFormatter.format(d).replace('.', '');
    const weekdayShort = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1);
    const monthShort = monthFormatter.format(d).replace('.', '');

    result.push({
      date: dateStr,
      weekdayShort: i === 0 ? 'Сьогодні' : weekdayShort,
      dayNum: dd,
      monthShort,
      isToday: i === 0,
    });
  }
  return result;
}

export function formatReadableDateUk(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

export function formatUkrainianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  let national = digits;
  if (national.startsWith('380')) {
    national = national.slice(3);
  } else if (national.startsWith('0')) {
    national = national.slice(1);
  }
  national = national.slice(0, 9);

  if (national.length === 0) return '+380 ';
  const p1 = national.slice(0, 2);
  const p2 = national.slice(2, 5);
  const p3 = national.slice(5, 7);
  const p4 = national.slice(7, 9);

  let formatted = `+380 ${p1}`;
  if (p2) formatted += ` ${p2}`;
  if (p3) formatted += ` ${p3}`;
  if (p4) formatted += ` ${p4}`;
  return formatted;
}

export function isValidUkrainianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('380');
}

function getStoredSessionReceipts(): ConfirmedBooking[] {
  try {
    const raw = window.sessionStorage.getItem(SESSION_BOOKINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessionReceipt(booking: ConfirmedBooking): void {
  try {
    const existing = getStoredSessionReceipts();
    window.sessionStorage.setItem(
      SESSION_BOOKINGS_KEY,
      JSON.stringify([booking, ...existing].slice(0, 10))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function getSessionReceipts(): ConfirmedBooking[] {
  return getStoredSessionReceipts();
}

const ADMIN_TOKEN_KEY = 'gentlemans_club_admin_token_v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getStoredAdminToken(): string | null {
  try {
    return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredAdminToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    // Ignore storage restriction errors
  }
}

function buildAdminHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extra,
  };
  const token = getStoredAdminToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401) {
    setStoredAdminToken(null);
  }
  if (!res.ok) {
    throw new ApiError(data.error || 'Помилка запиту до сервера.', res.status);
  }
  return data;
}

// --- PUBLIC BOOKING API ---

export async function getAvailableSlots(params: {
  serviceId: string;
  barberId: string;
  date: string;
}): Promise<TimeSlot[]> {
  const qs = new URLSearchParams({
    serviceId: params.serviceId,
    barberId: params.barberId,
    date: params.date,
  });
  const res = await fetch(`/api/slots?${qs.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonOrThrow<{ slots: TimeSlot[] }>(res);
  return data.slots;
}

export async function createBooking(input: {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  notes: string;
}): Promise<ConfirmedBooking> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });
  const data = await parseJsonOrThrow<{ booking: ConfirmedBooking }>(res);
  saveSessionReceipt(data.booking);
  return data.booking;
}

// --- ADMIN API ---

export async function getAdminSession(): Promise<{
  authenticated: boolean;
  user: AdminUser | null;
}> {
  const res = await fetch('/api/admin/session', {
    method: 'GET',
    credentials: 'include',
    headers: buildAdminHeaders(),
  });
  const data = await parseJsonOrThrow<{ authenticated: boolean; user: AdminUser | null }>(res);
  if (!data.authenticated) {
    setStoredAdminToken(null);
  }
  return data;
}

export async function loginAdmin(credentials: {
  username: string;
  password: string;
}): Promise<{ authenticated: boolean; user: AdminUser; token?: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  const data = await parseJsonOrThrow<{
    authenticated: boolean;
    user: AdminUser;
    token?: string;
  }>(res);
  if (data.token) {
    setStoredAdminToken(data.token);
  }
  return data;
}

export async function logoutAdmin(): Promise<void> {
  setStoredAdminToken(null);
  await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
}

export async function fetchAdminBookings(filters: {
  date?: string;
  barberId?: string;
  status?: string;
}): Promise<AdminBookingItem[]> {
  const qs = new URLSearchParams();
  if (filters.date) qs.set('date', filters.date);
  if (filters.barberId) qs.set('barberId', filters.barberId);
  if (filters.status) qs.set('status', filters.status);

  const res = await fetch(`/api/admin/bookings?${qs.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: buildAdminHeaders(),
  });
  const data = await parseJsonOrThrow<{ bookings: AdminBookingItem[] }>(res);
  return data.bookings;
}

export async function updateAdminBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  const res = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: buildAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status }),
  });
  await parseJsonOrThrow<{ booking: { id: string; status: BookingStatus } }>(res);
}

export async function fetchBlockedSlots(filters: {
  date?: string;
  barberId?: string;
}): Promise<BlockedSlotItem[]> {
  const qs = new URLSearchParams();
  if (filters.date) qs.set('date', filters.date);
  if (filters.barberId) qs.set('barberId', filters.barberId);

  const res = await fetch(`/api/admin/blocks?${qs.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: buildAdminHeaders(),
  });
  const data = await parseJsonOrThrow<{ blocks: BlockedSlotItem[] }>(res);
  return data.blocks;
}

export async function createBlockedSlot(input: {
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}): Promise<BlockedSlotItem> {
  const res = await fetch('/api/admin/blocks', {
    method: 'POST',
    credentials: 'include',
    headers: buildAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
  const data = await parseJsonOrThrow<{ block: BlockedSlotItem }>(res);
  return data.block;
}

export async function deleteBlockedSlot(blockId: string): Promise<void> {
  const res = await fetch(`/api/admin/blocks/${encodeURIComponent(blockId)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: buildAdminHeaders(),
  });
  await parseJsonOrThrow<{ deleted: boolean }>(res);
}
