import React from 'react';
import { ArrowRight, Clock, Copy, Mail, MapPin, Phone } from 'lucide-react';
import { ResilientImage } from '../components/ResilientImage';
import { useApp } from '../context/AppContext';
import { DEMO_BUSINESS_INFO } from '../data/catalog';
import { MEDIA_ASSETS } from '../data/media';

export const ContactsPage: React.FC = () => {
  const { navigate, showToast } = useApp();

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} скопійовано`);
    } catch {
      showToast(`Значення: ${value}`);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.1em] text-[#C8A45D]">
          Контактна інформація · Демонстраційний макет
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[#F5F2EB] sm:text-5xl">
          Адреса та графік роботи
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#9C968C] sm:text-base">
          {DEMO_BUSINESS_INFO.demoNotice}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Direct Contacts + Schedule */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-6 sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-[#F5F2EB]">
              Реквізити клубу (Демо-дані)
            </h2>

            <div className="mt-6 space-y-5 divide-y divide-[#F5F2EB]/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A45D]" />
                  <div>
                    <p className="text-xs text-[#9C968C]">Адреса закладу</p>
                    <p className="mt-1 text-sm font-medium text-[#F5F2EB]">
                      {DEMO_BUSINESS_INFO.addressLabel}
                    </p>
                    <p className="mt-1 text-xs text-[#9C968C]">
                      {DEMO_BUSINESS_INFO.parkingNote}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Скопіювати адресу"
                  onClick={() =>
                    handleCopy(DEMO_BUSINESS_INFO.addressLabel, 'Демо-адресу')
                  }
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#F5F2EB]/12 text-[#9C968C] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4 pt-5">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A45D]" />
                  <div>
                    <p className="text-xs text-[#9C968C]">Телефон адміністратора</p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-[#F5F2EB]">
                      {DEMO_BUSINESS_INFO.phoneDisplay}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Скопіювати телефон"
                  onClick={() =>
                    handleCopy(DEMO_BUSINESS_INFO.phoneRaw, 'Демо-номер')
                  }
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#F5F2EB]/12 text-[#9C968C] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4 pt-5">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A45D]" />
                  <div>
                    <p className="text-xs text-[#9C968C]">Електронна пошта та соцмережі</p>
                    <p className="mt-1 text-sm text-[#F5F2EB]">
                      {DEMO_BUSINESS_INFO.emailDisplay}
                    </p>
                    <p className="mt-0.5 text-xs text-[#9C968C]">
                      Instagram: {DEMO_BUSINESS_INFO.instagramDisplay}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-6 sm:p-7">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-[#C8A45D]" />
              <h2 className="font-display text-2xl font-semibold text-[#F5F2EB]">
                Графік роботи
              </h2>
            </div>

            <dl className="mt-5 divide-y divide-[#F5F2EB]/10 text-sm">
              {DEMO_BUSINESS_INFO.workingHoursList.map((row) => (
                <div
                  key={row.day}
                  className="flex items-center justify-between py-2.5"
                >
                  <dt className="text-[#F5F2EB]/85">{row.day}</dt>
                  <dd className="font-mono text-xs tabular-nums text-[#C8A45D]">
                    {row.hours}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right: Atmosphere Card + Schematic Location Placeholder + CTA */}
        <div className="flex flex-col justify-between gap-6 lg:col-span-6">
          <div className="overflow-hidden rounded-xl border border-[#F5F2EB]/10 bg-[#141417]">
            <div className="aspect-[16/10] bg-[#1C1C21]">
              <ResilientImage
                src={MEDIA_ASSETS.heroInterior}
                alt="Зала барбершопу GENTLEMAN’S CLUB"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-7">
              <p className="text-xs font-medium text-[#C8A45D]">
                Інтерактивна карта (місце для підключення після введення реальної адреси)
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[#F5F2EB]">
                Зручний онлайн-запис без очікування на лінії
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#9C968C]">
                На етапі комерційного запуску тут розміщується вбудована карта з реальними координатами вашого закладу та маршрутом проїзду.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[#C8A45D] px-6 py-2.5 text-sm font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] sm:w-auto cursor-pointer"
                >
                  <span>Перейти до онлайн-запису</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
