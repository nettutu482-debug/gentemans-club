import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ResilientImage } from '../components/ResilientImage';
import { useApp } from '../context/AppContext';
import {
  BARBERS,
  CLUB_STANDARDS,
  DEMO_BUSINESS_INFO,
  SERVICES,
} from '../data/catalog';
import { MEDIA_ASSETS } from '../data/media';

export const HomePage: React.FC = () => {
  const { navigate } = useApp();
  const featuredServices = SERVICES.filter((s) => s.featured);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#F5F2EB]/10">
        <div className="relative min-h-[78vh] lg:min-h-[84vh] flex items-end lg:items-center">
          <div className="absolute inset-0">
            <ResilientImage
              src={MEDIA_ASSETS.heroInterior}
              alt="Інтер’єр барбершопу GENTLEMAN’S CLUB"
              fallbackTitle="GENTLEMAN’S CLUB"
              className="h-full w-full object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B]/95 via-[#0A0A0B]/70 to-[#0A0A0B]/30"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-[#0A0A0B]/40"
            />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              <p className="text-xs font-medium tracking-[0.12em] text-[#C8A45D]">
                Преміальний чоловічий барбершоп
              </p>

              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.01em] text-[#F5F2EB] sm:text-5xl lg:text-6xl">
                Мистецтво чоловічої стрижки та бездоганного стилю
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#F5F2EB]/80 sm:text-lg">
                Класичні та сучасні техніки, королівське гоління гарячим рушником і спокійна клубна атмосфера. Оберіть майстра та зручний час за одну хвилину.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-md bg-[#C8A45D] px-6 py-3 text-sm font-semibold text-[#0A0A0B] transition-colors duration-200 hover:bg-[#D8B878] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB]"
                >
                  <span>Записатися онлайн</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/services')}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-md border border-[#F5F2EB]/20 bg-[#0A0A0B]/40 px-5 py-3 text-sm font-medium text-[#F5F2EB] transition-colors duration-200 hover:border-[#C8A45D] hover:text-[#C8A45D] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A45D]"
                >
                  Переглянути послуги
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Key Info Strip */}
        <div className="border-t border-[#F5F2EB]/10 bg-[#141417]/80">
          <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-[#F5F2EB]/10 px-4 sm:grid-cols-2 sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:divide-x lg:px-8">
            <div className="py-5 lg:pr-6">
              <p className="text-xs text-[#9C968C]">Графік роботи</p>
              <p className="mt-1 font-mono text-sm font-medium tabular-nums text-[#F5F2EB]">
                {DEMO_BUSINESS_INFO.workingHoursShort}
              </p>
            </div>
            <div className="py-5 lg:px-6">
              <p className="text-xs text-[#9C968C]">Локація (Демо-дані)</p>
              <p className="mt-1 text-sm font-medium text-[#F5F2EB]">
                {DEMO_BUSINESS_INFO.cityLabel}
              </p>
            </div>
            <div className="py-5 lg:px-6">
              <p className="text-xs text-[#9C968C]">Стрижка та догляд</p>
              <p className="mt-1 font-mono text-sm font-medium tabular-nums text-[#F5F2EB]">
                45 – 90 хв · від 550 грн
              </p>
            </div>
            <div className="py-5 lg:pl-6">
              <p className="text-xs text-[#9C968C]">Запис до майстра</p>
              <p className="mt-1 text-sm font-medium text-[#C8A45D]">
                Миттєвий вибір вільного часу
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy & Standards Split */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <p className="text-xs font-medium tracking-[0.1em] text-[#C8A45D]">
                Філософія клубу
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-[#F5F2EB] sm:text-4xl">
                Точність ремесла, тиша та увага до кожної деталі
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#9C968C]">
                GENTLEMAN’S CLUB створено для чоловіків, які цінують власний час і не йдуть на компроміси в якості догляду.
              </p>
            </div>

            <div className="mt-8 divide-y divide-[#F5F2EB]/10 border-t border-[#F5F2EB]/10">
              {CLUB_STANDARDS.map((item) => (
                <div key={item.number} className="py-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tabular-nums text-[#C8A45D]">
                      {item.number}.
                    </span>
                    <h3 className="font-sans text-base font-semibold text-[#F5F2EB]">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 pl-7 text-sm leading-relaxed text-[#9C968C]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[340px] overflow-hidden rounded-xl border border-[#F5F2EB]/10 bg-[#141417]">
              <ResilientImage
                src={MEDIA_ASSETS.loungeDetail}
                alt="Інструменти та засоби догляду в GENTLEMAN’S CLUB"
                fallbackTitle="Стандарти догляду"
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0A0A0B]/90 to-transparent"
              />
              <p className="absolute bottom-5 left-5 right-5 text-xs text-[#F5F2EB]/85">
                Японська сталь, преміальні бальзами та індивідуальна підготовка інструменту перед кожним гостем.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Preview */}
      <section className="border-y border-[#F5F2EB]/10 bg-[#141417]/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.1em] text-[#C8A45D]">
                Обрані процедури
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F5F2EB] sm:text-4xl">
                Послуги та вартість
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('/services')}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#C8A45D] transition-colors hover:text-[#D8B878] whitespace-nowrap cursor-pointer"
            >
              <span>Весь прайс-лист</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-10 divide-y divide-[#F5F2EB]/10 border-y border-[#F5F2EB]/10">
            {featuredServices.map((service) => (
              <div
                key={service.id}
                className="group flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="max-w-xl">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tabular-nums text-[#C8A45D]">
                      {service.number}.
                    </span>
                    <h3 className="font-display text-2xl font-semibold text-[#F5F2EB]">
                      {service.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 pl-7 text-sm leading-relaxed text-[#9C968C]">
                    {service.shortDescription}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-6 pl-7 sm:justify-end sm:pl-0">
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-lg font-medium tabular-nums text-[#F5F2EB]">
                      {service.priceUah} грн
                    </p>
                    <p className="font-mono text-xs tabular-nums text-[#9C968C]">
                      {service.durationMin} хв
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/booking', { serviceId: service.id })}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-[#C8A45D]/50 px-4 py-2 text-xs font-semibold text-[#C8A45D] transition-colors duration-200 hover:bg-[#C8A45D] hover:text-[#0A0A0B] whitespace-nowrap cursor-pointer"
                  >
                    Обрати
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Preview */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.1em] text-[#C8A45D]">
              Майстри клубу
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#F5F2EB] sm:text-4xl">
              Команда барберів
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/barbers')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#C8A45D] transition-colors hover:text-[#D8B878] whitespace-nowrap cursor-pointer"
          >
            <span>Усі майстри</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BARBERS.map((barber) => (
            <article
              key={barber.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#F5F2EB]/10 bg-[#141417]"
            >
              <div className="aspect-[3/4] overflow-hidden bg-[#1C1C21]">
                <ResilientImage
                  src={barber.image}
                  alt={barber.name}
                  fallbackTitle={barber.name}
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-[#F5F2EB]">
                    {barber.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#9C968C]">
                    {barber.role} · {barber.experienceYears} р. досвіду
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#F5F2EB]/10">
                  <button
                    type="button"
                    onClick={() => navigate('/booking', { barberId: barber.id })}
                    className="inline-flex min-h-[40px] w-full items-center justify-center rounded-md border border-[#F5F2EB]/15 px-4 py-2 text-xs font-medium text-[#F5F2EB] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] cursor-pointer"
                  >
                    Записатися до майстра
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Gallery Teaser & Final CTA */}
      <section className="border-t border-[#F5F2EB]/10 bg-[#141417]/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="grid grid-cols-2 gap-4 lg:col-span-6">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[#F5F2EB]/10">
                <ResilientImage
                  src={MEDIA_ASSETS.workClassicHaircut}
                  alt="Приклад чоловічої стрижки"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[#F5F2EB]/10">
                <ResilientImage
                  src={MEDIA_ASSETS.workBeardShave}
                  alt="Моделювання бороди та гоління"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 lg:pl-6">
              <p className="text-xs font-medium tracking-[0.1em] text-[#C8A45D]">
                Атмосфера та результати
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F5F2EB] sm:text-4xl">
                Подивіться роботи майстрів і оберіть свій час
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#9C968C] sm:text-base">
                У галереї зібрані приклади класичних стрижок, оформлення бороди та деталі інтер’єру нашого простору.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#C8A45D] px-6 py-2.5 text-sm font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] whitespace-nowrap cursor-pointer"
                >
                  Записатися зараз
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/gallery')}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#F5F2EB]/15 px-5 py-2.5 text-sm font-medium text-[#F5F2EB] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] whitespace-nowrap cursor-pointer"
                >
                  Відкрити галерею
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
