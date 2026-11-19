import React, { useMemo, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SERVICES } from '../data/catalog';
import { ServiceCategory } from '../types/barbershop';

const CATEGORIES: { id: ServiceCategory; label: string }[] = [
  { id: 'all', label: 'Усі послуги' },
  { id: 'haircuts', label: 'Стрижки' },
  { id: 'beard', label: 'Борода та гоління' },
  { id: 'complex', label: 'Комплекси' },
  { id: 'care', label: 'Догляд' },
];

export const ServicesPage: React.FC = () => {
  const { navigate } = useApp();
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('all');

  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return SERVICES;
    return SERVICES.filter((service) => service.category === activeCategory);
  }, [activeCategory]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.1em] text-[#C8A45D]">
          Прайс-лист клубу · Демонстраційний каталог
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[#F5F2EB] sm:text-5xl">
          Послуги та тривалість процедур
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#9C968C]">
          Кожна процедура включає консультацію, миття голови або підготовку шкіри та фінальний стайлінг. Оберіть послугу, щоб одразу перейти до вибору майстра та вільного часу.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Фільтр категорій послуг"
        className="mt-10 flex flex-wrap gap-2 border-b border-[#F5F2EB]/10 pb-6"
      >
        {CATEGORIES.map((category) => {
          const isSelected = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveCategory(category.id)}
              className={`min-h-[40px] rounded-md px-4 py-2 text-xs font-medium transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A45D] ${
                isSelected
                  ? 'bg-[#C8A45D] text-[#0A0A0B] font-semibold'
                  : 'border border-[#F5F2EB]/12 bg-[#141417] text-[#F5F2EB]/80 hover:border-[#C8A45D]/50 hover:text-[#F5F2EB]'
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Services List */}
      <div className="mt-8 grid grid-cols-1 gap-5">
        {filteredServices.map((service) => (
          <article
            key={service.id}
            className="flex flex-col justify-between gap-6 rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-6 sm:p-7 lg:flex-row lg:items-center"
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-xs tabular-nums text-[#C8A45D]">
                  {service.number}.
                </span>
                <h2 className="font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl">
                  {service.title}
                </h2>
              </div>

              <p className="mt-1.5 text-xs text-[#9C968C]">
                {service.categoryLabel} ·{' '}
                <span className="font-mono tabular-nums">{service.durationMin} хв</span>
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#F5F2EB]/80">
                {service.shortDescription}
              </p>

              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {service.includedSteps.map((step) => (
                  <li
                    key={step}
                    className="flex items-center gap-2 text-xs text-[#9C968C]"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#C8A45D]" aria-hidden="true" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-row items-center justify-between gap-6 border-t border-[#F5F2EB]/10 pt-5 lg:w-56 lg:flex-col lg:items-end lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
              <div className="lg:text-right">
                <p className="text-xs text-[#9C968C]">Вартість</p>
                <p className="mt-0.5 font-mono text-2xl font-medium tabular-nums text-[#F5F2EB]">
                  {service.priceUah} грн
                </p>
                <p className="font-mono text-xs tabular-nums text-[#9C968C]">
                  Тривалість: {service.durationMin} хв
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/booking', { serviceId: service.id })}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md bg-[#C8A45D] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] transition-colors duration-200 hover:bg-[#D8B878] whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB]"
              >
                <span>Обрати для запису</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
