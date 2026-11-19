import { BarberProfile, GalleryItem, ServiceItem } from '../types/barbershop';
import { MEDIA_ASSETS } from './media';

export const DEMO_BUSINESS_INFO = {
  brandName: 'GENTLEMAN’S CLUB',
  demoNotice: 'Демонстраційні дані для перевірки інтерфейсу. Перед комерційним запуском замінюються на реальні реквізити закладу.',
  addressLabel: 'Демонстраційна адреса: вул. Центральна, 1 (приклад)',
  cityLabel: 'Центральний район · Демо-локація',
  parkingNote: 'Приклад опису проїзду: зручний заїзд із боку центрального проспекту та гостьова зона паркування.',
  phoneDisplay: '+380 (00) 000-00-00 (демо)',
  phoneRaw: '+380000000000',
  emailDisplay: 'club@example.com (демо)',
  instagramDisplay: '@gentlemans.club.demo',
  workingHoursShort: 'Щодня 10:00 – 21:00',
  workingHoursList: [
    { day: 'Понеділок', hours: '10:00 – 21:00' },
    { day: 'Вівторок', hours: '10:00 – 21:00' },
    { day: 'Середа', hours: '10:00 – 21:00' },
    { day: 'Четвер', hours: '10:00 – 21:00' },
    { day: 'П’ятниця', hours: '10:00 – 21:00' },
    { day: 'Субота', hours: '10:00 – 21:00' },
    { day: 'Неділя', hours: '10:00 – 20:00' },
  ],
} as const;

export const CLUB_STANDARDS = [
  {
    number: '01',
    title: 'Індивідуальний підбір форми',
    description:
      'Стрижка проєктується під структуру волосся, геометрію обличчя та звичний ритм укладки без нав’язаних шаблонів.',
  },
  {
    number: '02',
    title: 'Стерильність медичного рівня',
    description:
      'Кожен інструмент проходить багатоетапну дезінфекцію та термічну обробку, а леза для гоління відкриваються індивідуально.',
  },
  {
    number: '03',
    title: 'Пунктуальність та повага до часу',
    description:
      'Майстер приймає точно за зарезервованим часом. У вартість візиту входить миття голови, тонізація та фінальний стайлінг.',
  },
  {
    number: '04',
    title: 'Атмосфера приватного клубу',
    description:
      'Спокійне освітлення, преміальна чоловіча косметика, кава або крафтовий напій у лаунж-зоні до та після процедури.',
  },
] as const;

export const SERVICES: ServiceItem[] = [
  {
    id: 'srv-classic-cut',
    number: '01',
    title: 'Чоловіча стрижка',
    category: 'haircuts',
    categoryLabel: 'Стрижки',
    priceUah: 850,
    durationMin: 60,
    shortDescription:
      'Класична або сучасна форма ножицями та машинкою з точним зведенням переходів та фінальною укладкою.',
    includedSteps: ['Консультація майстра', 'Дворазове миття та масаж голови', 'Точна стрижка', 'Укладка преміальним стайлінгом'],
    featured: true,
  },
  {
    id: 'srv-fade-crop',
    number: '02',
    title: 'Стрижка Skin Fade / Crop',
    category: 'haircuts',
    categoryLabel: 'Стрижки',
    priceUah: 900,
    durationMin: 60,
    shortDescription:
      'Бездоганно чистий димчастий перехід від нуля із текстурованою верхньою зоною під індивідуальний силует.',
    includedSteps: ['Детальний фейд шейвером', 'Текстурування ножицями', 'Очищення контурів', 'Матове фінішне укладання'],
    featured: false,
  },
  {
    id: 'srv-scissor-long',
    number: '03',
    title: 'Стрижка подовженого волосся',
    category: 'haircuts',
    categoryLabel: 'Стрижки',
    priceUah: 950,
    durationMin: 60,
    shortDescription:
      'Архітектурна робота виключно ножицями для середнього та довгого волосся зі збереженням природного об’єму.',
    includedSteps: ['Аналіз напрямку росту', 'Стрижка технікою прямого зрізу', 'Легке пропрацювання текстури', 'Захисна укладка феном'],
    featured: false,
  },
  {
    id: 'srv-beard-sculpt',
    number: '04',
    title: 'Моделювання бороди та вусів',
    category: 'beard',
    categoryLabel: 'Борода та гоління',
    priceUah: 650,
    durationMin: 45,
    shortDescription:
      'Формування чіткої геометрії бороди, розпарювання гарячим рушником та окантовка небезпечною бритвою.',
    includedSteps: ['Підбір пропорцій під овал обличчя', 'Компрес із гарячим рушником', 'Контуринг шаветкою', 'Бальзам та олія для бороди'],
    featured: true,
  },
  {
    id: 'srv-royal-shave',
    number: '05',
    title: 'Королівське гоління',
    category: 'beard',
    categoryLabel: 'Борода та гоління',
    priceUah: 800,
    durationMin: 45,
    shortDescription:
      'Традиційний ритуал вологого гоління у два проходи з ефірними оліями, гарячими та крижаним рушниками.',
    includedSteps: ['Олія для пом’якшення щетини', 'Гарячий компрес з евкаліптом', 'Збита в чаші піна', 'Заспокійливий холодний фініш'],
    featured: true,
  },
  {
    id: 'srv-complex-club',
    number: '06',
    title: 'Комплекс «Gentleman’s Signature»',
    category: 'complex',
    categoryLabel: 'Комплекси',
    priceUah: 1350,
    durationMin: 90,
    shortDescription:
      'Повний цикл догляду: авторська чоловіча стрижка та моделювання бороди з розпарюванням і тонізацією.',
    includedSteps: ['Чоловіча стрижка будь-якої складності', 'Моделювання бороди з гарячим рушником', 'Окантовка небезпечною бритвою', 'Комплексний стайлінг і догляд'],
    featured: true,
  },
  {
    id: 'srv-complex-father-son',
    number: '07',
    title: 'Комплекс «Батько та син»',
    category: 'complex',
    categoryLabel: 'Комплекси',
    priceUah: 1450,
    durationMin: 90,
    shortDescription:
      'Спільний візит для батька та сина (до 12 років) з комфортною атмосферою та підбором стильних стрижок.',
    includedSteps: ['Стрижка для батька', 'Підліткова або дитяча стрижка', 'Миття та укладка для обох', 'Напої у лаунж-зоні'],
    featured: false,
  },
  {
    id: 'srv-grey-camo',
    number: '08',
    title: 'Камуфлювання сивини',
    category: 'care',
    categoryLabel: 'Догляд',
    priceUah: 700,
    durationMin: 30,
    shortDescription:
      'Делікатне тонування волосся або бороди безаміачним засобом, що природно змивається без ефекту відрослих коренів.',
    includedSteps: ['Підбір природного відтінку', 'Тонування за 10 хвилин', 'Закріплююче миття шампунем', 'Сушка та укладка'],
    featured: false,
  },
  {
    id: 'srv-black-mask',
    number: '09',
    title: 'Очищення обличчя та чорна маска',
    category: 'care',
    categoryLabel: 'Догляд',
    priceUah: 550,
    durationMin: 30,
    shortDescription:
      'Відновлювальна процедура для шкіри обличчя з розпарюванням, детокс-маскою та зволожуючою сироваткою.',
    includedSteps: ['Розпарювання гарячим рушником', 'Нанесення вугільної маски-плівки', 'Тонізація шкіри', 'Заспокійливий крем'],
    featured: false,
  },
];

export const BARBERS: BarberProfile[] = [
  {
    id: 'brb-oleksandr',
    name: 'Олександр Кравчук',
    role: 'Засновник · Мастер-барбер (Демо-профіль)',
    experienceYears: 9,
    image: MEDIA_ASSETS.barberOleksandr,
    shortBio:
      'Спеціалізується на класичних ножичних формах, архітектурі подовжених стрижок та бездоганному діловому образі.',
    fullBio:
      'У професії понад дев’ять років. Проходив профільне навчання з британської школи чоловічої стрижки. Приділяє особливу увагу геометрії силуету, щоб стрижка зберігала охайну форму навіть через три тижні після візиту.',
    specialties: ['Класика ножицями', 'Середня довжина', 'Діловий стиль'],
    workingDays: 'Вт – Сб',
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
    id: 'brb-dmytro',
    name: 'Дмитро Мельник',
    role: 'Топ-барбер (Демо-профіль)',
    experienceYears: 6,
    image: MEDIA_ASSETS.barberDmytro,
    shortBio:
      'Експерт із сучасних коротких форм, техніки Skin Fade, текстурних кропів та чіткої роботи з геометрією.',
    fullBio:
      'Працює на стику класичної точності та сучасного міського мінімалізму. Виконує чисті димчасті переходи та текстуровані стрижки, які не потребують складного ранкового укладання.',
    specialties: ['Skin Fade', 'Textured Crop', 'Динамічні переходи'],
    workingDays: 'Пн – Пт, Нд',
    serviceIds: [
      'srv-classic-cut',
      'srv-fade-crop',
      'srv-beard-sculpt',
      'srv-complex-club',
      'srv-black-mask',
    ],
  },
  {
    id: 'brb-artem',
    name: 'Артем Савченко',
    role: 'Майстер королівського гоління (Демо-профіль)',
    experienceYears: 7,
    image: MEDIA_ASSETS.barberArtem,
    shortBio:
      'Провідний спеціаліст із моделювання густої бороди, традиційного гоління небезпечною бритвою та догляду за шкірою.',
    fullBio:
      'Перетворює стандартну корекцію бороди на повноцінний ритуал відпочинку. Допомагає підібрати форму бороди під особливості росту щетини та консультує щодо домашнього догляду.',
    specialties: ['Моделювання бороди', 'Королівське гоління', 'Догляд за шкірою'],
    workingDays: 'Ср – Нд',
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
    id: 'brb-maksym',
    name: 'Максим Бондар',
    role: 'Старший барбер (Демо-профіль)',
    experienceYears: 5,
    image: MEDIA_ASSETS.barberMaksym,
    shortBio:
      'Поєднує сучасні стрижки з делікатним доглядом за бородою, камуфлюванням сивини та підбором стайлінгу.',
    fullBio:
      'Уважний до дрібниць майстер, який завжди починає візит із чесної діагностики типу волосся. Знаходить баланс між строгістю класики та невимушеною природною текстурою.',
    specialties: ['Універсальні стрижки', 'Фейд та борода', 'Камуфлювання сивини'],
    workingDays: 'Пн – Сб',
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

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Головна зала клубу',
    category: 'interior',
    categoryLabel: 'Інтер’єр',
    caption: 'Графітові стінові панелі, вінтажні шкіряні крісла та м’яке латунне освітлення.',
    image: MEDIA_ASSETS.heroInterior,
    featuredSpan: true,
  },
  {
    id: 'gal-2',
    title: 'Класичний боковий проділ',
    category: 'haircuts',
    categoryLabel: 'Стрижки',
    caption: 'Точна робота ножицями та гребінцем із природним атласним фінішем.',
    barberName: 'Олександр Кравчук',
    image: MEDIA_ASSETS.workClassicHaircut,
  },
  {
    id: 'gal-3',
    title: 'Ритуал гарячого рушника',
    category: 'beard',
    categoryLabel: 'Борода',
    caption: 'Традиційна підготовка шкіри парою перед окантовкою небезпечною бритвою.',
    barberName: 'Артем Савченко',
    image: MEDIA_ASSETS.workBeardShave,
  },
  {
    id: 'gal-4',
    title: 'Інструменти та догляд',
    category: 'interior',
    categoryLabel: 'Інтер’єр',
    caption: 'Японська сталь, латунний помазок та аптекарські олії на чорному граніті.',
    image: MEDIA_ASSETS.loungeDetail,
  },
  {
    id: 'gal-5',
    title: 'Текстурний силует',
    category: 'haircuts',
    categoryLabel: 'Стрижки',
    caption: 'Сучасне поєднання коротких скронь із виразною текстурою зверху.',
    barberName: 'Дмитро Мельник',
    image: MEDIA_ASSETS.barberDmytro,
  },
  {
    id: 'gal-6',
    title: 'Архітектура густої бороди',
    category: 'beard',
    categoryLabel: 'Борода',
    caption: 'Чіткі лінії щік та збалансований об’єм під класичний образ.',
    barberName: 'Артем Савченко',
    image: MEDIA_ASSETS.barberArtem,
  },
];
