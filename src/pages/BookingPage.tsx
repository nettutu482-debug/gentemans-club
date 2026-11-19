import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ResilientImage } from '../components/ResilientImage';
import { useApp } from '../context/AppContext';
import { BARBERS, SERVICES } from '../data/catalog';
import {
  createBooking,
  formatReadableDateUk,
  formatUkrainianPhone,
  getAvailableSlots,
  getNextDays,
  getSessionReceipts,
  isValidUkrainianPhone,
} from '../services/bookingService';
import { ConfirmedBooking, ServiceCategory, TimeSlot } from '../types/barbershop';

const BOOKING_STEPS = [
  { num: 1, label: 'Послуга' },
  { num: 2, label: 'Барбер' },
  { num: 3, label: 'Дата і час' },
  { num: 4, label: 'Контакти' },
  { num: 5, label: 'Підтвердження' },
] as const;

const SERVICE_FILTER_TABS: { id: ServiceCategory; label: string }[] = [
  { id: 'all', label: 'Усі' },
  { id: 'haircuts', label: 'Стрижки' },
  { id: 'beard', label: 'Борода' },
  { id: 'complex', label: 'Комплекси' },
  { id: 'care', label: 'Догляд' },
];

export const BookingPage: React.FC = () => {
  const {
    preselectedServiceId,
    preselectedBarberId,
    clearBookingPrefill,
    showToast,
  } = useApp();

  const days = useMemo(() => getNextDays(14), []);

  const [step, setStep] = useState<number>(1);
  const [serviceFilter, setServiceFilter] = useState<ServiceCategory>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>(days[0].date);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('+380 ');
  const [notes, setNotes] = useState<string>('');

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] =
    useState<ConfirmedBooking | null>(null);
  const [sessionBookings, setSessionBookings] = useState<ConfirmedBooking[]>(() =>
    getSessionReceipts()
  );

  // Sync incoming pre-fill choices from Services or Barbers pages
  useEffect(() => {
    if (!preselectedServiceId && !preselectedBarberId) return;

    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
      setStep(preselectedBarberId ? 3 : 2);
    } else if (preselectedBarberId) {
      setSelectedBarberId(preselectedBarberId);
      setStep(1);
    }

    if (preselectedBarberId) {
      setSelectedBarberId(preselectedBarberId);
    }

    setSelectedTime(null);
    setConfirmedBooking(null);
    clearBookingPrefill();
  }, [preselectedServiceId, preselectedBarberId, clearBookingPrefill]);

  const selectedService = useMemo(
    () => SERVICES.find((s) => s.id === selectedServiceId) ?? null,
    [selectedServiceId]
  );

  const eligibleBarbers = useMemo(() => {
    if (!selectedServiceId) return BARBERS;
    return BARBERS.filter((b) => b.serviceIds.includes(selectedServiceId));
  }, [selectedServiceId]);

  const selectedBarber = useMemo(() => {
    if (selectedBarberId === 'any') return null;
    return BARBERS.find((b) => b.id === selectedBarberId) ?? null;
  }, [selectedBarberId]);

  // Ensure selected barber can perform selected service
  useEffect(() => {
    if (!selectedServiceId || selectedBarberId === 'any') return;
    const isCompatible = eligibleBarbers.some((b) => b.id === selectedBarberId);
    if (!isCompatible) {
      setSelectedBarberId('any');
    }
  }, [selectedServiceId, selectedBarberId, eligibleBarbers]);

  const loadSlots = async (
    serviceId: string,
    barberId: string,
    date: string
  ) => {
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const loaded = await getAvailableSlots({ serviceId, barberId, date });
      setSlots(loaded);
      setSelectedTime((prevTime) =>
        prevTime && loaded.some((s) => s.time === prevTime && s.available)
          ? prevTime
          : null
      );
    } catch (err) {
      setSlots([]);
      setSlotsError(
        err instanceof Error ? err.message : 'Не вдалося завантажити слоти.'
      );
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedServiceId) {
      setSlots([]);
      return;
    }
    loadSlots(selectedServiceId, selectedBarberId, selectedDate);
  }, [selectedServiceId, selectedBarberId, selectedDate]);

  const filteredServices = useMemo(() => {
    if (serviceFilter === 'all') return SERVICES;
    return SERVICES.filter((s) => s.category === serviceFilter);
  }, [serviceFilter]);

  const availableSlotCount = useMemo(
    () => slots.filter((s) => s.available).length,
    [slots]
  );

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedTime(null);
    setFormError(null);
    setStep(2);
  };

  const handleSelectBarber = (barberId: string) => {
    setSelectedBarberId(barberId);
    setSelectedTime(null);
    setFormError(null);
    setStep(3);
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedServiceId || !selectedTime) {
      setFormError('Оберіть послугу та вільний час візиту.');
      return;
    }

    const trimmedName = clientName.trim();
    if (trimmedName.length < 2) {
      setFormError('Введіть ваше ім’я (щонайменше 2 символи).');
      return;
    }

    if (!isValidUkrainianPhone(clientPhone)) {
      setFormError(
        'Введіть коректний український номер телефону у форматі +380 XX XXX XX XX.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await createBooking({
        serviceId: selectedServiceId,
        barberId: selectedBarberId,
        date: selectedDate,
        time: selectedTime,
        clientName: trimmedName,
        clientPhone,
        notes,
      });

      setConfirmedBooking(created);
      setSessionBookings(getSessionReceipts());
      setStep(5);
      showToast(`Запис ${created.bookingCode} підтверджено`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не вдалося оформити запис.';
      setFormError(message);
      if (selectedServiceId) {
        loadSlots(selectedServiceId, selectedBarberId, selectedDate);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewBooking = () => {
    setConfirmedBooking(null);
    setSelectedServiceId(null);
    setSelectedBarberId('any');
    setSelectedDate(days[0].date);
    setSelectedTime(null);
    setNotes('');
    setFormError(null);
    setStep(1);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.1em] text-[#C8A45D]">
          Онлайн-бронювання · Миттєва перевірка вільного часу
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-[#F5F2EB] sm:text-5xl">
          Запис на візит
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#9C968C] sm:text-base">
          Оберіть процедуру, майстра та зручний вільний час. Ваш запис миттєво фіксується в базі даних клубу.
        </p>
      </div>

      {/* Stepper Bar */}
      <nav
        aria-label="Кроки онлайн-запису"
        className="mt-8 grid grid-cols-2 gap-2 border-y border-[#F5F2EB]/10 py-4 sm:grid-cols-5"
      >
        {BOOKING_STEPS.map((item) => {
          const isCurrent = step === item.num;
          const isCompleted = step > item.num;
          const canJump =
            step < 5 &&
            (item.num === 1 ||
              (item.num === 2 && Boolean(selectedServiceId)) ||
              (item.num === 3 && Boolean(selectedServiceId)) ||
              (item.num === 4 && Boolean(selectedServiceId && selectedTime)));

          return (
            <button
              key={item.num}
              type="button"
              disabled={!canJump}
              onClick={() => canJump && setStep(item.num)}
              className={`flex min-h-[42px] items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors ${
                isCurrent
                  ? 'border border-[#C8A45D]/70 bg-[#C8A45D]/12 text-[#F5F2EB] font-semibold'
                  : isCompleted
                    ? 'border border-[#F5F2EB]/15 bg-[#141417] text-[#C8A45D] hover:border-[#C8A45D]/50 cursor-pointer'
                    : 'border border-transparent text-[#9C968C]/70 cursor-default'
              }`}
            >
              <span className="font-mono text-[11px] tabular-nums">
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : `0${item.num}`}
              </span>
              <span className="whitespace-nowrap truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content + Summary Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Active Step Workspace */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: SERVICE SELECTION */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl">
                    01. Оберіть послугу
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {SERVICE_FILTER_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setServiceFilter(tab.id)}
                        className={`min-h-[34px] rounded-md px-3 py-1.5 text-xs transition-colors whitespace-nowrap cursor-pointer ${
                          serviceFilter === tab.id
                            ? 'bg-[#C8A45D] text-[#0A0A0B] font-semibold'
                            : 'border border-[#F5F2EB]/12 bg-[#141417] text-[#9C968C] hover:text-[#F5F2EB]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedBarber && (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-[#C8A45D]/35 bg-[#C8A45D]/8 px-4 py-3 text-xs text-[#F5F2EB]">
                    <span>
                      Попередньо обраний майстер:{' '}
                      <strong className="text-[#C8A45D]">{selectedBarber.name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBarberId('any')}
                      className="text-[#9C968C] underline hover:text-[#F5F2EB] cursor-pointer"
                    >
                      Скинути
                    </button>
                  </div>
                )}

                <div className="mt-5 space-y-3">
                  {filteredServices.map((srv) => {
                    const isSelected = selectedServiceId === srv.id;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => handleSelectService(srv.id)}
                        className={`flex w-full flex-col justify-between gap-3 rounded-xl border p-5 text-left transition-colors sm:flex-row sm:items-center cursor-pointer ${
                          isSelected
                            ? 'border-[#C8A45D] bg-[#1C1C21]'
                            : 'border-[#F5F2EB]/10 bg-[#141417] hover:border-[#C8A45D]/45'
                        }`}
                      >
                        <div>
                          <div className="flex items-baseline gap-2.5">
                            <span className="font-mono text-xs tabular-nums text-[#C8A45D]">
                              {srv.number}.
                            </span>
                            <span className="font-display text-xl font-semibold text-[#F5F2EB]">
                              {srv.title}
                            </span>
                          </div>
                          <p className="mt-1 pl-6 text-xs text-[#9C968C]">
                            {srv.shortDescription}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 pl-6 sm:shrink-0 sm:flex-col sm:items-end sm:pl-0">
                          <span className="font-mono text-base font-medium tabular-nums text-[#F5F2EB]">
                            {srv.priceUah} грн
                          </span>
                          <span className="font-mono text-xs tabular-nums text-[#9C968C]">
                            {srv.durationMin} хв
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: BARBER SELECTION */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl">
                    02. Оберіть барбера
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#9C968C] hover:text-[#F5F2EB] cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Назад</span>
                  </button>
                </div>

                {/* Any Available Barber Option */}
                <button
                  type="button"
                  onClick={() => handleSelectBarber('any')}
                  className={`mt-5 flex w-full items-center justify-between rounded-xl border p-5 text-left transition-colors cursor-pointer ${
                    selectedBarberId === 'any'
                      ? 'border-[#C8A45D] bg-[#1C1C21]'
                      : 'border-[#F5F2EB]/10 bg-[#141417] hover:border-[#C8A45D]/45'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#C8A45D]/40 bg-[#C8A45D]/10 text-[#C8A45D]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-xl font-semibold text-[#F5F2EB]">
                        Будь-який вільний майстер
                      </p>
                      <p className="mt-0.5 text-xs text-[#9C968C]">
                        Покажемо максимум доступного часу серед усіх вільних барберів
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#C8A45D]" />
                </button>

                {/* Specific Barbers */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {eligibleBarbers.map((barber) => {
                    const isSelected = selectedBarberId === barber.id;
                    return (
                      <button
                        key={barber.id}
                        type="button"
                        onClick={() => handleSelectBarber(barber.id)}
                        className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-[#C8A45D] bg-[#1C1C21]'
                            : 'border-[#F5F2EB]/10 bg-[#141417] hover:border-[#C8A45D]/45'
                        }`}
                      >
                        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#0A0A0B]">
                          <ResilientImage
                            src={barber.image}
                            alt={barber.name}
                            className="h-full w-full object-cover object-top"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-xl font-semibold text-[#F5F2EB] truncate">
                            {barber.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[#C8A45D] truncate">
                            {barber.role}
                          </p>
                          <p className="mt-1 font-mono text-xs tabular-nums text-[#9C968C]">
                            Досвід: {barber.experienceYears} р. · {barber.workingDays}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: DATE & TIME */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl">
                    03. Оберіть дату та вільний час
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#9C968C] hover:text-[#F5F2EB] cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Назад</span>
                  </button>
                </div>

                {/* Date Picker Grid */}
                <div className="mt-5">
                  <p className="mb-3 flex items-center gap-2 text-xs font-medium text-[#9C968C]">
                    <Calendar className="h-3.5 w-3.5 text-[#C8A45D]" />
                    <span>Доступні дати (найближчі 14 днів)</span>
                  </p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {days.map((day) => {
                      const isSelected = selectedDate === day.date;
                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => {
                            setSelectedDate(day.date);
                            setSelectedTime(null);
                          }}
                          className={`flex min-h-[68px] flex-col items-center justify-center rounded-lg border p-2 text-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-[#C8A45D] bg-[#C8A45D] text-[#0A0A0B]'
                              : 'border-[#F5F2EB]/10 bg-[#141417] text-[#F5F2EB] hover:border-[#C8A45D]/50'
                          }`}
                        >
                          <span
                            className={`text-[11px] ${
                              isSelected ? 'text-[#0A0A0B]/80 font-medium' : 'text-[#9C968C]'
                            }`}
                          >
                            {day.weekdayShort}
                          </span>
                          <span className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
                            {day.dayNum}
                          </span>
                          <span
                            className={`text-[10px] ${
                              isSelected ? 'text-[#0A0A0B]/80' : 'text-[#9C968C]'
                            }`}
                          >
                            {day.monthShort}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div className="mt-8">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-xs font-medium text-[#9C968C]">
                      <Clock className="h-3.5 w-3.5 text-[#C8A45D]" />
                      <span>
                        Час візиту ({formatReadableDateUk(selectedDate)})
                      </span>
                    </p>
                    <p className="text-xs text-[#9C968C]">
                      Вільні: активні · Зайняті або вихідні: закреслені
                    </p>
                  </div>

                  {slotsError && (
                    <div
                      role="alert"
                      className="mb-4 rounded-lg border border-red-400/40 bg-red-950/35 px-4 py-3 text-xs text-red-200"
                    >
                      {slotsError}
                    </div>
                  )}

                  {slotsLoading ? (
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-12 animate-pulse rounded-lg border border-[#F5F2EB]/10 bg-[#141417]"
                        />
                      ))}
                    </div>
                  ) : availableSlotCount === 0 ? (
                    <div className="rounded-xl border border-[#F5F2EB]/12 bg-[#141417] p-6 text-center">
                      <p className="text-sm font-medium text-[#F5F2EB]">
                        На цю дату вільних вікон немає.
                      </p>
                      <p className="mt-1 text-xs text-[#9C968C]">
                        {selectedBarber
                          ? `${selectedBarber.name} працює за графіком ${selectedBarber.workingDays}, або всі слоти на цей день уже зайнято. Спробуйте іншу дату чи опцію «Будь-який вільний майстер».`
                          : 'Оберіть інший день у календарі.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                      {slots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            title={slot.reason}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`flex min-h-[48px] flex-col items-center justify-center rounded-lg border px-3 py-2 font-mono text-sm tabular-nums transition-colors ${
                              !slot.available
                                ? 'border-[#F5F2EB]/5 bg-[#0A0A0B] text-[#9C968C]/35 line-through cursor-not-allowed'
                                : isSelected
                                  ? 'border-[#C8A45D] bg-[#C8A45D] font-semibold text-[#0A0A0B] cursor-pointer'
                                  : 'border-[#F5F2EB]/15 bg-[#141417] text-[#F5F2EB] hover:border-[#C8A45D]/70 cursor-pointer'
                            }`}
                          >
                            <span>{slot.time}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedTime}
                    onClick={() => setStep(4)}
                    className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-6 py-2.5 text-sm font-semibold transition-colors ${
                      selectedTime
                        ? 'bg-[#C8A45D] text-[#0A0A0B] hover:bg-[#D8B878] cursor-pointer'
                        : 'bg-[#1C1C21] text-[#9C968C] cursor-not-allowed'
                    }`}
                  >
                    <span>Далі: контактні дані</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CLIENT DETAILS */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl">
                    04. Ваші контактні дані
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#9C968C] hover:text-[#F5F2EB] cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Змінити час</span>
                  </button>
                </div>

                <form
                  onSubmit={handleConfirmSubmit}
                  className="mt-6 space-y-5 rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-6 sm:p-7"
                >
                  <div>
                    <label
                      htmlFor="client-name"
                      className="block text-xs font-medium text-[#F5F2EB]"
                    >
                      Ім’я та прізвище (або лише ім’я) *
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Наприклад: Андрій Коваленко"
                      className="mt-2 min-h-[46px] w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-4 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#9C968C]/50 focus:border-[#C8A45D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-phone"
                      className="block text-xs font-medium text-[#F5F2EB]"
                    >
                      Номер телефону *
                    </label>
                    <input
                      id="client-phone"
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) =>
                        setClientPhone(formatUkrainianPhone(e.target.value))
                      }
                      placeholder="+380 67 000 00 00"
                      className="mt-2 min-h-[46px] w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-4 py-2.5 font-mono text-sm tabular-nums text-[#F5F2EB] placeholder:text-[#9C968C]/50 focus:border-[#C8A45D] focus:outline-none"
                    />
                    <p className="mt-1.5 text-xs text-[#9C968C]">
                      Український формат: +380 XX XXX XX XX
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="client-notes"
                      className="block text-xs font-medium text-[#F5F2EB]"
                    >
                      Побажання до візиту (необов’язково)
                    </label>
                    <textarea
                      id="client-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Наприклад: комфортна довжина з боків або кава перед процедурою"
                      className="mt-2 w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-4 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#9C968C]/50 focus:border-[#C8A45D] focus:outline-none"
                    />
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-400/40 bg-red-950/35 px-4 py-3 text-xs text-red-200"
                    >
                      {formError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-md bg-[#C8A45D] px-6 py-3 text-sm font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] disabled:opacity-60 cursor-pointer"
                    >
                      <span>
                        {submitting ? 'Оформлення запису...' : 'Підтвердити запис'}
                      </span>
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 5: CONFIRMATION */}
            {step === 5 && confirmedBooking && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-[#C8A45D]/40 bg-[#141417] p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#C8A45D]" />
                  <div>
                    <p className="text-xs font-medium tracking-[0.08em] text-[#C8A45D]">
                      Запис підтверджено · Код {confirmedBooking.bookingCode}
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-semibold text-[#F5F2EB]">
                      Чекаємо на вас, {confirmedBooking.clientName}
                    </h2>
                    <p className="mt-2 text-sm text-[#9C968C]">
                      Візит збережено в базі даних барбершопу. Обраний часовий інтервал автоматично зарезервовано за вашим майстром.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-4 border-y border-[#F5F2EB]/10 py-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#9C968C]">Послуга</p>
                    <p className="mt-1 text-sm font-semibold text-[#F5F2EB]">
                      {confirmedBooking.serviceTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9C968C]">Майстер</p>
                    <p className="mt-1 text-sm font-semibold text-[#F5F2EB]">
                      {confirmedBooking.barberName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9C968C]">Дата та час</p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-[#F5F2EB]">
                      {formatReadableDateUk(confirmedBooking.date)} ·{' '}
                      {confirmedBooking.startTime}–{confirmedBooking.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9C968C]">Вартість та тривалість</p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-[#C8A45D]">
                      {confirmedBooking.priceUah} грн · {confirmedBooking.durationMin} хв
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleStartNewBooking}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-md bg-[#C8A45D] px-5 py-2 text-xs font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] cursor-pointer"
                  >
                    Створити ще один запис
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Persistent Summary Sidebar */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-xl border border-[#F5F2EB]/12 bg-[#141417] p-6">
              <p className="text-xs font-medium tracking-[0.08em] text-[#C8A45D]">
                Деталі вашого візиту
              </p>

              <dl className="mt-5 space-y-4 divide-y divide-[#F5F2EB]/10 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[#9C968C]">Послуга</dt>
                  <dd className="text-right font-medium text-[#F5F2EB]">
                    {selectedService ? selectedService.title : 'Не обрано'}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4 pt-4">
                  <dt className="text-[#9C968C]">Барбер</dt>
                  <dd className="text-right font-medium text-[#F5F2EB]">
                    {confirmedBooking
                      ? confirmedBooking.barberName
                      : selectedBarber
                        ? selectedBarber.name
                        : 'Будь-який вільний'}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4 pt-4">
                  <dt className="text-[#9C968C]">Дата</dt>
                  <dd className="text-right font-mono text-xs tabular-nums text-[#F5F2EB]">
                    {formatReadableDateUk(selectedDate)}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4 pt-4">
                  <dt className="text-[#9C968C]">Час</dt>
                  <dd className="text-right font-mono tabular-nums text-[#F5F2EB]">
                    {selectedTime || 'Не обрано'}
                  </dd>
                </div>

                <div className="flex items-baseline justify-between gap-4 pt-4">
                  <dt className="text-[#9C968C]">Орієнтовна вартість</dt>
                  <dd className="font-mono text-xl font-semibold tabular-nums text-[#C8A45D]">
                    {selectedService ? `${selectedService.priceUah} грн` : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            {sessionBookings.length > 0 && (
              <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417]/70 p-5">
                <p className="flex items-center gap-2 text-xs font-medium text-[#F5F2EB]">
                  <User className="h-3.5 w-3.5 text-[#C8A45D]" />
                  <span>Ваші останні записи ({sessionBookings.length})</span>
                </p>
                <ul className="mt-3 space-y-2.5">
                  {sessionBookings.slice(0, 3).map((b) => (
                    <li
                      key={b.id}
                      className="border-t border-[#F5F2EB]/8 pt-2.5 text-xs text-[#9C968C]"
                    >
                      <p className="font-medium text-[#F5F2EB]">
                        {b.bookingCode} · {b.serviceTitle}
                      </p>
                      <p className="mt-0.5 font-mono tabular-nums">
                        {b.date} · {b.startTime} · {b.barberName}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};
