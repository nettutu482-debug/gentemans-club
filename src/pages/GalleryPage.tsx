import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ResilientImage } from '../components/ResilientImage';
import { useApp } from '../context/AppContext';
import { GALLERY_ITEMS } from '../data/catalog';
import { GalleryCategory } from '../types/barbershop';

const GALLERY_FILTERS: { id: GalleryCategory; label: string }[] = [
  { id: 'all', label: 'Усі світлини' },
  { id: 'haircuts', label: 'Стрижки' },
  { id: 'beard', label: 'Борода' },
  { id: 'interior', label: 'Інтер’єр' },
];

export const GalleryPage: React.FC = () => {
  const { navigate } = useApp();
  const [filter, setFilter] = useState<GalleryCategory>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visibleItems = useMemo(() => {
    if (filter === 'all') return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((item) => item.category === filter);
  }, [filter]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % visibleItems.length
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + visibleItems.length) % visibleItems.length
        );
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, visibleItems.length]);

  const activeItem =
    lightboxIndex !== null ? visibleItems[lightboxIndex] ?? null : null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.1em] text-[#C8A45D]">
            Візуальне портфоліо
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-[#F5F2EB] sm:text-5xl">
            Галерея робіт та інтер’єру
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#9C968C]">
            Деталі стрижок, ритуалів догляду за бородою та атмосфери нашого простору. Натисніть на будь-яку світлину для перегляду у повному розмірі.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/booking')}
          className="inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-md bg-[#C8A45D] px-5 py-2.5 text-xs font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] whitespace-nowrap cursor-pointer"
        >
          Записатися на візит
        </button>
      </div>

      {/* Filter Bar */}
      <div
        role="tablist"
        aria-label="Фільтр галереї"
        className="mt-10 flex flex-wrap gap-2 border-b border-[#F5F2EB]/10 pb-6"
      >
        {GALLERY_FILTERS.map((tab) => {
          const isSelected = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setFilter(tab.id);
                setLightboxIndex(null);
              }}
              className={`min-h-[40px] rounded-md px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#C8A45D] text-[#0A0A0B] font-semibold'
                  : 'border border-[#F5F2EB]/12 bg-[#141417] text-[#F5F2EB]/80 hover:border-[#C8A45D]/50 hover:text-[#F5F2EB]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bento / Editorial Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item, idx) => {
          const spanClasses =
            filter === 'all' && item.featuredSpan
              ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2 aspect-[16/10] lg:aspect-auto lg:min-h-[460px]'
              : 'aspect-[4/3]';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className={`group relative overflow-hidden rounded-xl border border-[#F5F2EB]/10 bg-[#141417] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A45D] ${spanClasses}`}
            >
              <ResilientImage
                src={item.image}
                alt={item.title}
                fallbackTitle={item.title}
                loading={idx < 2 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/90 via-[#0A0A0B]/25 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs text-[#C8A45D]">
                  {item.categoryLabel}
                  {item.barberName ? ` · ${item.barberName}` : ''}
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-[#F5F2EB] sm:text-2xl">
                  {item.title}
                </h2>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeItem && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0B]/92 p-4 backdrop-blur-md"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activeItem.title}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#F5F2EB]/15 bg-[#141417]"
            >
              <div className="flex items-center justify-between border-b border-[#F5F2EB]/10 px-5 py-3.5">
                <p className="text-xs text-[#9C968C]">
                  {activeItem.categoryLabel}
                  {activeItem.barberName ? ` · Майстер: ${activeItem.barberName}` : ''}
                </p>
                <button
                  type="button"
                  aria-label="Закрити перегляд"
                  onClick={() => setLightboxIndex(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#F5F2EB]/15 text-[#F5F2EB] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative aspect-[16/10] w-full bg-[#0A0A0B]">
                <ResilientImage
                  src={activeItem.image}
                  alt={activeItem.title}
                  className="h-full w-full object-contain"
                />

                {visibleItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Попередня світлина"
                      onClick={() =>
                        setLightboxIndex(
                          (lightboxIndex - 1 + visibleItems.length) %
                            visibleItems.length
                        )
                      }
                      className="absolute top-1/2 left-3 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#F5F2EB]/20 bg-[#0A0A0B]/75 text-[#F5F2EB] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      aria-label="Наступна світлина"
                      onClick={() =>
                        setLightboxIndex((lightboxIndex + 1) % visibleItems.length)
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#F5F2EB]/20 bg-[#0A0A0B]/75 text-[#F5F2EB] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-[#F5F2EB]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-[#F5F2EB]">
                    {activeItem.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#9C968C]">
                    {activeItem.caption}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLightboxIndex(null);
                    navigate('/booking');
                  }}
                  className="inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-md bg-[#C8A45D] px-5 py-2 text-xs font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] whitespace-nowrap cursor-pointer"
                >
                  Записатися
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
