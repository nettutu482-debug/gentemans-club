import React from 'react';
import { DEMO_BUSINESS_INFO } from '../data/catalog';
import { useApp } from '../context/AppContext';
import { RoutePath } from '../types/barbershop';

const FOOTER_LINKS: { label: string; path: RoutePath }[] = [
  { label: 'Головна', path: '/' },
  { label: 'Послуги та ціни', path: '/services' },
  { label: 'Команда барберів', path: '/barbers' },
  { label: 'Галерея робіт', path: '/gallery' },
  { label: 'Онлайн-запис', path: '/booking' },
  { label: 'Контакти', path: '/contacts' },
  { label: 'Кабінет адміністратора', path: '/admin' },
];

export const Footer: React.FC = () => {
  const { navigate } = useApp();

  return (
    <footer className="border-t border-[#F5F2EB]/10 bg-[#0A0A0B]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl font-semibold tracking-[0.05em] text-[#F5F2EB]">
              GENTLEMAN’S CLUB
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#9C968C]">
              Сучасний чоловічий простір класичних стрижок, моделювання бороди та бездоганного сервісу.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.06em] text-[#C8A45D]">
              Навігація
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.path}>
                  <a
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.path);
                    }}
                    className="text-sm text-[#F5F2EB]/75 transition-colors hover:text-[#C8A45D]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.06em] text-[#C8A45D]">
              Контакти (Демо-дані)
            </p>
            <div className="mt-4 space-y-2 text-sm text-[#F5F2EB]/80">
              <p>{DEMO_BUSINESS_INFO.addressLabel}</p>
              <p className="font-mono tabular-nums text-[#F5F2EB]">
                {DEMO_BUSINESS_INFO.phoneDisplay}
              </p>
              <p className="text-[#9C968C]">{DEMO_BUSINESS_INFO.workingHoursShort}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#F5F2EB]/10 pt-6 text-xs text-[#9C968C] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GENTLEMAN’S CLUB. Демонстраційна платформа онлайн-запису.</p>
          <p>{DEMO_BUSINESS_INFO.demoNotice}</p>
        </div>
      </div>
    </footer>
  );
};
