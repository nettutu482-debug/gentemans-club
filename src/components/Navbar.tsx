import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { RoutePath } from '../types/barbershop';

const NAV_LINKS: { label: string; path: RoutePath }[] = [
  { label: 'Головна', path: '/' },
  { label: 'Послуги', path: '/services' },
  { label: 'Команда', path: '/barbers' },
  { label: 'Галерея', path: '/gallery' },
  { label: 'Контакти', path: '/contacts' },
];

export const Navbar: React.FC = () => {
  const { currentPath, navigate } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleLinkClick = (e: React.MouseEvent, path: RoutePath) => {
    e.preventDefault();
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#F5F2EB]/10 bg-[#0A0A0B]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Clean wordmark */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="font-display text-xl font-semibold tracking-[0.06em] text-[#F5F2EB] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A45D]"
        >
          GENTLEMAN’S CLUB
        </a>

        {/* Zone 2: 5 concise single-line links */}
        <nav aria-label="Головна навігація" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleLinkClick(e, item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1 text-sm font-medium transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A45D] ${
                  isActive
                    ? 'text-[#C8A45D]'
                    : 'text-[#F5F2EB]/80 hover:text-[#F5F2EB]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-px bg-[#C8A45D]"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA + mobile drawer button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/booking')}
            className="hidden sm:inline-flex items-center justify-center rounded-md bg-[#C8A45D] px-4 py-2 text-xs font-semibold tracking-[0.03em] text-[#0A0A0B] transition-colors duration-200 hover:bg-[#D8B878] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB]"
          >
            Записатися
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Закрити меню' : 'Відкрити меню'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#F5F2EB]/15 text-[#F5F2EB] transition-colors hover:border-[#C8A45D]/60 md:hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A45D]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-[#F5F2EB]/10 bg-[#141417] px-4 py-5 md:hidden"
          >
            <nav aria-label="Мобільна навігація" className="flex flex-col gap-1">
              {NAV_LINKS.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={(e) => handleLinkClick(e, item.path)}
                    className={`flex min-h-[44px] items-center justify-between rounded-md px-3 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-[#C8A45D]/12 text-[#C8A45D]'
                        : 'text-[#F5F2EB]/85 hover:bg-[#F5F2EB]/5 hover:text-[#F5F2EB]'
                    }`}
                  >
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-[#F5F2EB]/10">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  navigate('/booking');
                }}
                className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#C8A45D] px-5 py-2.5 text-sm font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] cursor-pointer"
              >
                Записатися онлайн
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
