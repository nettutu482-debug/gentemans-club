import React, { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ResilientImage } from '../components/ResilientImage';
import { useApp } from '../context/AppContext';
import { BARBERS, SERVICES } from '../data/catalog';
import { BarberProfile } from '../types/barbershop';

export const BarbersPage: React.FC = () => {
  const { navigate } = useApp();
  const [selectedBarber, setSelectedBarber] = useState<BarberProfile | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBarber(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.1em] text-[#C8A45D]">
          Команда клубу · Демонстраційні профілі
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[#F5F2EB] sm:text-5xl">
          Майстри, яким довіряють стиль
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#9C968C]">
          Оберіть барбера за спеціалізацією та досвідом. Кожен майстер проводить детальну консультацію перед початком роботи.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        {BARBERS.map((barber) => (
          <article
            key={barber.id}
            className="group flex flex-col overflow-hidden rounded-xl border border-[#F5F2EB]/10 bg-[#141417] sm:flex-row"
          >
            <div className="aspect-[3/4] w-full shrink-0 overflow-hidden bg-[#1C1C21] sm:w-52 md:w-56">
              <ResilientImage
                src={barber.image}
                alt={barber.name}
                fallbackTitle={barber.name}
                className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl">
                  {barber.name}
                </h2>
                <p className="mt-1 text-xs text-[#C8A45D]">
                  {barber.role}
                </p>
                <p className="mt-1 font-mono text-xs tabular-nums text-[#9C968C]">
                  Досвід: {barber.experienceYears} років · Графік: {barber.workingDays}
                </p>

                <p className="mt-4 text-sm leading-relaxed text-[#F5F2EB]/80">
                  {barber.shortBio}
                </p>

                <p className="mt-4 text-xs text-[#9C968C]">
                  {barber.specialties.join(' · ')}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-[#F5F2EB]/10">
                <button
                  type="button"
                  onClick={() => navigate('/booking', { barberId: barber.id })}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md bg-[#C8A45D] px-4 py-2 text-xs font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] whitespace-nowrap cursor-pointer"
                >
                  <span>Записатися</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBarber(barber)}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-[#F5F2EB]/15 px-4 py-2 text-xs font-medium text-[#F5F2EB] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] whitespace-nowrap cursor-pointer"
                >
                  Профіль
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Barber Detail Modal */}
      <AnimatePresence>
        {selectedBarber && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedBarber(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0B]/85 p-4 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="barber-modal-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#F5F2EB]/15 bg-[#141417]"
            >
              <button
                type="button"
                aria-label="Закрити профіль"
                onClick={() => setSelectedBarber(null)}
                className="absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B]/70 text-[#F5F2EB] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-5">
                <div className="aspect-[3/4] sm:col-span-2 bg-[#1C1C21]">
                  <ResilientImage
                    src={selectedBarber.image}
                    alt={selectedBarber.name}
                    fallbackTitle={selectedBarber.name}
                    className="h-full w-full object-cover object-top"
                  />
                </div>

                <div className="flex flex-col justify-between p-6 sm:col-span-3 sm:p-7">
                  <div>
                    <h3
                      id="barber-modal-title"
                      className="font-display text-3xl font-semibold text-[#F5F2EB]"
                    >
                      {selectedBarber.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#C8A45D]">
                      {selectedBarber.role}
                    </p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-[#9C968C]">
                      {selectedBarber.experienceYears} років досвіду · {selectedBarber.workingDays}
                    </p>

                    <p className="mt-5 text-sm leading-relaxed text-[#F5F2EB]/85">
                      {selectedBarber.fullBio}
                    </p>

                    <div className="mt-5 border-t border-[#F5F2EB]/10 pt-4">
                      <p className="text-xs font-medium text-[#C8A45D]">
                        Доступні процедури у майстра
                      </p>
                      <ul className="mt-2.5 space-y-1.5">
                        {SERVICES.filter((s) =>
                          selectedBarber.serviceIds.includes(s.id)
                        ).map((srv) => (
                          <li
                            key={srv.id}
                            className="flex items-center justify-between text-xs text-[#F5F2EB]/80"
                          >
                            <span>{srv.title}</span>
                            <span className="font-mono tabular-nums text-[#9C968C]">
                              {srv.priceUah} грн
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F5F2EB]/10">
                    <button
                      type="button"
                      onClick={() => {
                        const id = selectedBarber.id;
                        setSelectedBarber(null);
                        navigate('/booking', { barberId: id });
                      }}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[#C8A45D] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] cursor-pointer"
                    >
                      <span>Записатися до {selectedBarber.name.split(' ')[0]}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
