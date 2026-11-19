import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'gentlemans_club.db');
const dbPath = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : DEFAULT_DB_PATH;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath, { timeout: 5000 });

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function runInTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // Ignore rollback errors if connection already rolled back
    }
    throw err;
  }
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('haircuts', 'beard', 'complex', 'care')),
      category_label TEXT NOT NULL,
      price_uah INTEGER NOT NULL,
      duration_min INTEGER NOT NULL,
      short_description TEXT NOT NULL,
      included_steps_json TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS barbers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      short_bio TEXT NOT NULL,
      full_bio TEXT NOT NULL,
      specialties_json TEXT NOT NULL,
      working_days TEXT NOT NULL,
      working_weekdays_json TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS barber_services (
      barber_id TEXT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
      service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      PRIMARY KEY (barber_id, service_id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_code TEXT NOT NULL UNIQUE,
      service_id TEXT NOT NULL REFERENCES services(id),
      barber_id TEXT NOT NULL REFERENCES barbers(id),
      booking_date TEXT NOT NULL,
      start_min INTEGER NOT NULL,
      end_min INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('confirmed', 'completed', 'cancelled')) DEFAULT 'confirmed',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_barber_date
      ON bookings(barber_id, booking_date, status);

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id TEXT PRIMARY KEY,
      barber_id TEXT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
      block_date TEXT NOT NULL,
      start_min INTEGER NOT NULL,
      end_min INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT 'Перерва / Неробочий час',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_blocked_barber_date
      ON blocked_slots(barber_id, block_date);

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  seedInitialData();
}

function seedInitialData(): void {
  const servicesCount = db
    .prepare('SELECT COUNT(*) as cnt FROM services')
    .get() as { cnt: number };

  if (servicesCount.cnt === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (
        id, number, title, category, category_label, price_uah,
        duration_min, short_description, included_steps_json, featured, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const seedServices = [
      [
        'srv-classic-cut',
        '01',
        'Чоловіча стрижка',
        'haircuts',
        'Стрижки',
        850,
        60,
        'Класична або сучасна форма ножицями та машинкою з точним зведенням переходів та фінальною укладкою.',
        JSON.stringify([
          'Консультація майстра',
          'Дворазове миття та масаж голови',
          'Точна стрижка',
          'Укладка преміальним стайлінгом',
        ]),
        1,
      ],
      [
        'srv-fade-crop',
        '02',
        'Стрижка Skin Fade / Crop',
        'haircuts',
        'Стрижки',
        900,
        60,
        'Бездоганно чистий димчастий перехід від нуля із текстурованою верхньою зоною під індивідуальний силует.',
        JSON.stringify([
          'Детальний фейд шейвером',
          'Текстурування ножицями',
          'Очищення контурів',
          'Матове фінішне укладання',
        ]),
        0,
      ],
      [
        'srv-scissor-long',
        '03',
        'Стрижка подовженого волосся',
        'haircuts',
        'Стрижки',
        950,
        60,
        'Архітектурна робота виключно ножицями для середнього та довгого волосся зі збереженням природного об’єму.',
        JSON.stringify([
          'Аналіз напрямку росту',
          'Стрижка технікою прямого зрізу',
          'Легке пропрацювання текстури',
          'Захисна укладка феном',
        ]),
        0,
      ],
      [
        'srv-beard-sculpt',
        '04',
        'Моделювання бороди та вусів',
        'beard',
        'Борода та гоління',
        650,
        45,
        'Формування чіткої геометрії бороди, розпарювання гарячим рушником та окантовка небезпечною бритвою.',
        JSON.stringify([
          'Підбір пропорцій під овал обличчя',
          'Компрес із гарячим рушником',
          'Контуринг шаветкою',
          'Бальзам та олія для бороди',
        ]),
        1,
      ],
      [
        'srv-royal-shave',
        '05',
        'Королівське гоління',
        'beard',
        'Борода та гоління',
        800,
        45,
        'Традиційний ритуал вологого гоління у два проходи з ефірними оліями, гарячими та крижаним рушниками.',
        JSON.stringify([
          'Олія для пом’якшення щетини',
          'Гарячий компрес з евкаліптом',
          'Збита в чаші піна',
          'Заспокійливий холодний фініш',
        ]),
        1,
      ],
      [
        'srv-complex-club',
        '06',
        'Комплекс «Gentleman’s Signature»',
        'complex',
        'Комплекси',
        1350,
        90,
        'Повний цикл догляду: авторська чоловіча стрижка та моделювання бороди з розпарюванням і тонізацією.',
        JSON.stringify([
          'Чоловіча стрижка будь-якої складності',
          'Моделювання бороди з гарячим рушником',
          'Окантовка небезпечною бритвою',
          'Комплексний стайлінг і догляд',
        ]),
        1,
      ],
      [
        'srv-complex-father-son',
        '07',
        'Комплекс «Батько та син»',
        'complex',
        'Комплекси',
        1450,
        90,
        'Спільний візит для батька та сина (до 12 років) з комфортною атмосферою та підбором стильних стрижок.',
        JSON.stringify([
          'Стрижка для батька',
          'Підліткова або дитяча стрижка',
          'Миття та укладка для обох',
          'Напої у лаунж-зоні',
        ]),
        0,
      ],
      [
        'srv-grey-camo',
        '08',
        'Камуфлювання сивини',
        'care',
        'Догляд',
        700,
        30,
        'Делікатне тонування волосся або бороди безаміачним засобом, що природно змивається без ефекту відрослих коренів.',
        JSON.stringify([
          'Підбір природного відтінку',
          'Тонування за 10 хвилин',
          'Закріплююче миття шампунем',
          'Сушка та укладка',
        ]),
        0,
      ],
      [
        'srv-black-mask',
        '09',
        'Очищення обличчя та чорна маска',
        'care',
        'Догляд',
        550,
        30,
        'Відновлювальна процедура для шкіри обличчя з розпарюванням, детокс-маскою та зволожуючою сироваткою.',
        JSON.stringify([
          'Розпарювання гарячим рушником',
          'Нанесення вугільної маски-плівки',
          'Тонізація шкіри',
          'Заспокійливий крем',
        ]),
        0,
      ],
    ];

    for (const row of seedServices) {
      insertService.run(...row);
    }
  }

  const barbersCount = db
    .prepare('SELECT COUNT(*) as cnt FROM barbers')
    .get() as { cnt: number };

  if (barbersCount.cnt === 0) {
    const insertBarber = db.prepare(`
      INSERT INTO barbers (
        id, name, role, experience_years, short_bio, full_bio,
        specialties_json, working_days, working_weekdays_json, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const insertBarberService = db.prepare(
      'INSERT OR IGNORE INTO barber_services (barber_id, service_id) VALUES (?, ?)'
    );

    const seedBarbers: Array<{
      row: [string, string, string, number, string, string, string, string, string];
      serviceIds: string[];
    }> = [
      {
        row: [
          'brb-oleksandr',
          'Олександр Кравчук',
          'Засновник · Мастер-барбер (Демо-профіль)',
          9,
          'Спеціалізується на класичних ножичних формах, архітектурі подовжених стрижок та бездоганному діловому образі.',
          'У професії понад дев’ять років. Проходив профільне навчання з британської школи чоловічої стрижки. Приділяє особливу увагу геометрії силуету, щоб стрижка зберігала охайну форму навіть через три тижні після візиту.',
          JSON.stringify(['Класика ножицями', 'Середня довжина', 'Діловий стиль']),
          'Вт – Сб',
          JSON.stringify([2, 3, 4, 5, 6]),
        ],
        serviceIds: [
          'srv-classic-cut',
          'srv-scissor-long',
          'srv-beard-sculpt',
          'srv-complex-club',
          'srv-complex-father-son',
          'srv-grey-camo',
        ],
      },
      {
        row: [
          'brb-dmytro',
          'Дмитро Мельник',
          'Топ-барбер (Демо-профіль)',
          6,
          'Експерт із сучасних коротких форм, техніки Skin Fade, текстурних кропів та чіткої роботи з геометрією.',
          'Працює на стику класичної точності та сучасного міського мінімалізму. Виконує чисті димчасті переходи та текстуровані стрижки, які не потребують складного ранкового укладання.',
          JSON.stringify(['Skin Fade', 'Textured Crop', 'Динамічні переходи']),
          'Пн – Пт, Нд',
          JSON.stringify([0, 1, 2, 3, 4, 5]),
        ],
        serviceIds: [
          'srv-classic-cut',
          'srv-fade-crop',
          'srv-beard-sculpt',
          'srv-complex-club',
          'srv-black-mask',
        ],
      },
      {
        row: [
          'brb-artem',
          'Артем Савченко',
          'Майстер королівського гоління (Демо-профіль)',
          7,
          'Провідний спеціаліст із моделювання густої бороди, традиційного гоління небезпечною бритвою та догляду за шкірою.',
          'Перетворює стандартну корекцію бороди на повноцінний ритуал відпочинку. Допомагає підібрати форму бороди під особливості росту щетини та консультує щодо домашнього догляду.',
          JSON.stringify(['Моделювання бороди', 'Королівське гоління', 'Догляд за шкірою']),
          'Ср – Нд',
          JSON.stringify([0, 3, 4, 5, 6]),
        ],
        serviceIds: [
          'srv-classic-cut',
          'srv-beard-sculpt',
          'srv-royal-shave',
          'srv-complex-club',
          'srv-grey-camo',
          'srv-black-mask',
        ],
      },
      {
        row: [
          'brb-maksym',
          'Максим Бондар',
          'Старший барбер (Демо-профіль)',
          5,
          'Поєднує сучасні стрижки з делікатним доглядом за бородою, камуфлюванням сивини та підбором стайлінгу.',
          'Уважний до дрібниць майстер, який завжди починає візит із чесної діагностики типу волосся. Знаходить баланс між строгістю класики та невимушеною природною текстурою.',
          JSON.stringify(['Універсальні стрижки', 'Фейд та борода', 'Камуфлювання сивини']),
          'Пн – Сб',
          JSON.stringify([1, 2, 3, 4, 5, 6]),
        ],
        serviceIds: [
          'srv-classic-cut',
          'srv-fade-crop',
          'srv-scissor-long',
          'srv-beard-sculpt',
          'srv-complex-club',
          'srv-complex-father-son',
          'srv-grey-camo',
          'srv-black-mask',
        ],
      },
    ];

    for (const item of seedBarbers) {
      insertBarber.run(...item.row);
      for (const srvId of item.serviceIds) {
        insertBarberService.run(item.row[0], srvId);
      }
    }
  }

  // Ensure admin user exists based on env config (or demo admin for evaluation)
  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Gentlemans2026!';
  const existingAdmin = db
    .prepare('SELECT id FROM admin_users WHERE username = ?')
    .get(adminUsername) as { id: string } | undefined;

  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, display_name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'adm-primary',
      adminUsername,
      hashPassword(adminPassword),
      'Адміністратор клубу',
      new Date().toISOString()
    );
  }
}
