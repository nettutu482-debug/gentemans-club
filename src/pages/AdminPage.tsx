import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Calendar,
  Check,
  Lock,
  LogOut,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BARBERS } from '../data/catalog';
import {
  createBlockedSlot,
  deleteBlockedSlot,
  fetchAdminBookings,
  fetchBlockedSlots,
  getAdminSession,
  loginAdmin,
  logoutAdmin,
  updateAdminBookingStatus,
} from '../services/bookingService';
import {
  AdminBookingItem,
  AdminUser,
  BlockedSlotItem,
  BookingStatus,
} from '../types/barbershop';

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: 'Підтверджено',
  completed: 'Виконано',
  cancelled: 'Скасовано',
};

const STATUS_TEXT_COLORS: Record<BookingStatus, string> = {
  confirmed: 'text-[#C8A45D]',
  completed: 'text-emerald-400',
  cancelled: 'text-[#9C968C]',
};

const TIME_OPTIONS = Array.from({ length: 23 }, (_, i) => {
  const totalMin = 10 * 60 + i * 30;
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const m = String(totalMin % 60).padStart(2, '0');
  return `${h}:${m}`;
});

function getTodayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const AdminPage: React.FC = () => {
  const { showToast } = useApp();

  const [checkingSession, setCheckingSession] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard tabs & filters
  const [activeTab, setActiveTab] = useState<'bookings' | 'blocks'>('bookings');
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'specific'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayIso());
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Data state
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [blocks, setBlocks] = useState<BlockedSlotItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New block form state
  const [blockBarberId, setBlockBarberId] = useState<string>(BARBERS[0].id);
  const [blockDate, setBlockDate] = useState<string>(() => getTodayIso());
  const [blockStartTime, setBlockStartTime] = useState<string>('13:00');
  const [blockEndTime, setBlockEndTime] = useState<string>('14:00');
  const [blockReason, setBlockReason] = useState<string>('Обідня перерва');
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  useEffect(() => {
    getAdminSession()
      .then((res) => {
        setAdminUser(res.authenticated ? res.user : null);
      })
      .catch(() => {
        setAdminUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    if (!adminUser) return;
    setDataLoading(true);
    setActionError(null);
    try {
      const dateParam = dateFilterMode === 'all' ? 'all' : selectedDate;
      const [loadedBookings, loadedBlocks] = await Promise.all([
        fetchAdminBookings({
          date: dateParam,
          barberId: selectedBarberId,
          status: selectedStatus,
        }),
        fetchBlockedSlots({
          date: dateParam,
          barberId: selectedBarberId,
        }),
      ]);
      setBookings(loadedBookings);
      setBlocks(loadedBlocks);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        setAdminUser(null);
        setLoginError('Сесія завершилася. Увійдіть повторно.');
        return;
      }
      setActionError(
        err instanceof Error ? err.message : 'Не вдалося завантажити дані.'
      );
    } finally {
      setDataLoading(false);
    }
  }, [adminUser, dateFilterMode, selectedDate, selectedBarberId, selectedStatus]);

  useEffect(() => {
    if (adminUser) {
      loadWorkspaceData();
    }
  }, [adminUser, loadWorkspaceData]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await loginAdmin({ username, password });
      setAdminUser(res.user);
      setPassword('');
      showToast('Авторизація успішна');
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Помилка входу в панель.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setAdminUser(null);
    setBookings([]);
    setBlocks([]);
    showToast('Сесію завершено');
  };

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    setActionError(null);
    try {
      await updateAdminBookingStatus(bookingId, status);
      showToast(`Статус оновлено: ${STATUS_LABELS[status]}`);
      await loadWorkspaceData();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Не вдалося оновити статус.'
      );
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setBlockSubmitting(true);
    try {
      await createBlockedSlot({
        barberId: blockBarberId,
        date: blockDate,
        startTime: blockStartTime,
        endTime: blockEndTime,
        reason: blockReason,
      });
      showToast('Години успішно заблоковано');
      await loadWorkspaceData();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Не вдалося створити блокування.'
      );
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    setActionError(null);
    try {
      await deleteBlockedSlot(blockId);
      showToast('Блокування знято');
      await loadWorkspaceData();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Не вдалося видалити блокування.'
      );
    }
  };

  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const revenueUah = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.priceUah, 0);

    return {
      total: bookings.length,
      confirmed,
      completed,
      cancelled,
      revenueUah,
    };
  }, [bookings]);

  if (checkingSession) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-8 text-center">
          <p className="text-sm text-[#9C968C]">Перевірка сесії адміністратора...</p>
        </div>
      </section>
    );
  }

  // --- UNAUTHENTICATED LOGIN VIEW ---
  if (!adminUser) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-md rounded-xl border border-[#F5F2EB]/12 bg-[#141417] p-7 sm:p-9">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#C8A45D]/40 bg-[#C8A45D]/10 text-[#C8A45D]">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.08em] text-[#C8A45D]">
                Захищений доступ
              </p>
              <h1 className="font-display text-2xl font-semibold text-[#F5F2EB]">
                Панель адміністратора
              </h1>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#9C968C]">
            Увійдіть під обліковим записом адміністратора, щоб керувати записами клієнтів та графіком барберів.
          </p>

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-medium text-[#F5F2EB]"
              >
                Логін
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="mt-1.5 min-h-[44px] w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#9C968C]/50 focus:border-[#C8A45D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-[#F5F2EB]"
              >
                Пароль
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 min-h-[44px] w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#9C968C]/50 focus:border-[#C8A45D] focus:outline-none"
              />
            </div>

            {loginError && (
              <div
                role="alert"
                className="rounded-lg border border-red-400/40 bg-red-950/35 px-3.5 py-2.5 text-xs text-red-200"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#C8A45D] px-5 py-2.5 text-sm font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] disabled:opacity-60 cursor-pointer"
            >
              {loginLoading ? 'Перевірка...' : 'Увійти в кабінет'}
            </button>
          </form>
        </div>
      </section>
    );
  }

  // --- AUTHENTICATED ADMIN WORKSPACE ---
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      {/* Top Workspace Header */}
      <div className="flex flex-col gap-4 border-b border-[#F5F2EB]/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.08em] text-[#C8A45D]">
            Кабінет керування · {adminUser.displayName} ({adminUser.username})
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#F5F2EB] sm:text-4xl">
            Розклад та записи клієнтів
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadWorkspaceData}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[#F5F2EB]/15 bg-[#141417] px-4 py-2 text-xs font-medium text-[#F5F2EB] transition-colors hover:border-[#C8A45D] hover:text-[#C8A45D] whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
            <span>Оновити</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[#F5F2EB]/15 bg-[#141417] px-4 py-2 text-xs font-medium text-[#9C968C] transition-colors hover:border-red-400/50 hover:text-red-300 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Вийти</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-4">
          <p className="text-xs text-[#9C968C]">Записів у вибірці</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#F5F2EB]">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-4">
          <p className="text-xs text-[#9C968C]">Підтверджено</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#C8A45D]">
            {stats.confirmed}
          </p>
        </div>
        <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-4">
          <p className="text-xs text-[#9C968C]">Виконано</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-emerald-400">
            {stats.completed}
          </p>
        </div>
        <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-4">
          <p className="text-xs text-[#9C968C]">Скасовано</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#9C968C]">
            {stats.cancelled}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-4 sm:col-span-1">
          <p className="text-xs text-[#9C968C]">Сума (без скас.)</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#F5F2EB]">
            {stats.revenueUah} грн
          </p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-b border-[#F5F2EB]/10 pb-4">
        <div role="tablist" className="flex gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bookings'}
            onClick={() => setActiveTab('bookings')}
            className={`min-h-[40px] rounded-md px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-[#C8A45D] text-[#0A0A0B] font-semibold'
                : 'border border-[#F5F2EB]/12 bg-[#141417] text-[#F5F2EB]/80 hover:border-[#C8A45D]/50'
            }`}
          >
            Журнал записів ({bookings.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'blocks'}
            onClick={() => setActiveTab('blocks')}
            className={`min-h-[40px] rounded-md px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'blocks'
                ? 'bg-[#C8A45D] text-[#0A0A0B] font-semibold'
                : 'border border-[#F5F2EB]/12 bg-[#141417] text-[#F5F2EB]/80 hover:border-[#C8A45D]/50'
            }`}
          >
            Блокування годин ({blocks.length})
          </button>
        </div>

        {/* Shared Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-md border border-[#F5F2EB]/12 bg-[#141417] p-0.5">
            <button
              type="button"
              onClick={() => setDateFilterMode('all')}
              className={`min-h-[34px] rounded px-3 text-xs transition-colors whitespace-nowrap cursor-pointer ${
                dateFilterMode === 'all'
                  ? 'bg-[#C8A45D] text-[#0A0A0B] font-semibold'
                  : 'text-[#9C968C] hover:text-[#F5F2EB]'
              }`}
            >
              Усі дати
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilterMode('specific');
                setSelectedDate(getTodayIso());
              }}
              className={`min-h-[34px] rounded px-3 text-xs transition-colors whitespace-nowrap cursor-pointer ${
                dateFilterMode === 'specific' && selectedDate === getTodayIso()
                  ? 'bg-[#C8A45D] text-[#0A0A0B] font-semibold'
                  : 'text-[#9C968C] hover:text-[#F5F2EB]'
              }`}
            >
              Сьогодні
            </button>
          </div>

          <input
            type="date"
            aria-label="Фільтр за датою"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setDateFilterMode('specific');
            }}
            className="min-h-[38px] rounded-md border border-[#F5F2EB]/12 bg-[#141417] px-3 py-1.5 font-mono text-xs text-[#F5F2EB] focus:border-[#C8A45D] focus:outline-none"
          />

          <select
            aria-label="Фільтр за майстром"
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="min-h-[38px] rounded-md border border-[#F5F2EB]/12 bg-[#141417] px-3 py-1.5 text-xs text-[#F5F2EB] focus:border-[#C8A45D] focus:outline-none"
          >
            <option value="all">Усі майстри</option>
            {BARBERS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {activeTab === 'bookings' && (
            <select
              aria-label="Фільтр за статусом"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="min-h-[38px] rounded-md border border-[#F5F2EB]/12 bg-[#141417] px-3 py-1.5 text-xs text-[#F5F2EB] focus:border-[#C8A45D] focus:outline-none"
            >
              <option value="all">Усі статуси</option>
              <option value="confirmed">Підтверджено</option>
              <option value="completed">Виконано</option>
              <option value="cancelled">Скасовано</option>
            </select>
          )}
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-400/40 bg-red-950/35 px-4 py-3 text-xs text-red-200"
        >
          {actionError}
        </div>
      )}

      {/* TAB 1: BOOKINGS JOURNAL */}
      {activeTab === 'bookings' && (
        <div className="mt-6">
          {dataLoading && bookings.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg border border-[#F5F2EB]/10 bg-[#141417]"
                />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-10 text-center">
              <Calendar className="mx-auto h-7 w-7 text-[#C8A45D]/70" />
              <p className="mt-3 text-sm font-medium text-[#F5F2EB]">
                За обраними фільтрами записів немає.
              </p>
              <p className="mt-1 text-xs text-[#9C968C]">
                Змініть дату або майстра, або оформіть новий тестовий візит на сторінці онлайн-запису.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop High-Density Table */}
              <div className="hidden overflow-x-auto rounded-xl border border-[#F5F2EB]/10 bg-[#141417] lg:block">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F5F2EB]/10 text-[#9C968C]">
                      <th className="px-4 py-3.5 font-medium">Дата і час</th>
                      <th className="px-4 py-3.5 font-medium">Код</th>
                      <th className="px-4 py-3.5 font-medium">Клієнт</th>
                      <th className="px-4 py-3.5 font-medium">Послуга</th>
                      <th className="px-4 py-3.5 font-medium">Майстер</th>
                      <th className="px-4 py-3.5 font-medium text-right">Сума</th>
                      <th className="px-4 py-3.5 font-medium">Статус</th>
                      <th className="px-4 py-3.5 font-medium text-right">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F2EB]/8">
                    {bookings.map((b) => (
                      <tr
                        key={b.id}
                        className="transition-colors hover:bg-[#1C1C21]/70"
                      >
                        <td className="px-4 py-3.5 font-mono tabular-nums text-[#F5F2EB] whitespace-nowrap">
                          {b.date} · {b.startTime}–{b.endTime}
                        </td>
                        <td className="px-4 py-3.5 font-mono tabular-nums text-[#C8A45D] whitespace-nowrap">
                          {b.bookingCode}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[#F5F2EB]">{b.clientName}</p>
                          <p className="font-mono text-[11px] tabular-nums text-[#9C968C]">
                            {b.clientPhone}
                          </p>
                          {b.notes && (
                            <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-[#9C968C]/80">
                              {b.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-[#F5F2EB]">
                          <p>{b.serviceTitle}</p>
                          <p className="font-mono text-[11px] tabular-nums text-[#9C968C]">
                            {b.durationMin} хв
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-[#F5F2EB]/85 whitespace-nowrap">
                          {b.barberName}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#F5F2EB] whitespace-nowrap">
                          {b.priceUah} грн
                        </td>
                        <td
                          className={`px-4 py-3.5 font-medium whitespace-nowrap ${STATUS_TEXT_COLORS[b.status]}`}
                        >
                          {STATUS_LABELS[b.status]}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {b.status !== 'completed' && (
                              <button
                                type="button"
                                title="Позначити як виконано"
                                onClick={() => handleStatusChange(b.id, 'completed')}
                                className="inline-flex h-8 items-center gap-1 rounded border border-emerald-500/40 px-2.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/15 cursor-pointer"
                              >
                                <Check className="h-3 w-3" />
                                <span>Виконано</span>
                              </button>
                            )}
                            {b.status !== 'cancelled' && (
                              <button
                                type="button"
                                title="Скасувати запис"
                                onClick={() => handleStatusChange(b.id, 'cancelled')}
                                className="inline-flex h-8 items-center gap-1 rounded border border-[#F5F2EB]/15 px-2.5 text-[11px] font-medium text-[#9C968C] transition-colors hover:border-red-400/50 hover:text-red-300 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                                <span>Скасувати</span>
                              </button>
                            )}
                            {b.status === 'cancelled' && (
                              <button
                                type="button"
                                title="Відновити запис"
                                onClick={() => handleStatusChange(b.id, 'confirmed')}
                                className="inline-flex h-8 items-center gap-1 rounded border border-[#C8A45D]/40 px-2.5 text-[11px] font-medium text-[#C8A45D] transition-colors hover:bg-[#C8A45D]/15 cursor-pointer"
                              >
                                <span>Відновити</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Stacked Cards */}
              <div className="space-y-3 lg:hidden">
                {bookings.map((b) => (
                  <article
                    key={b.id}
                    className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs tabular-nums text-[#C8A45D]">
                          {b.bookingCode} · {b.date} · {b.startTime}–{b.endTime}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-[#F5F2EB]">
                          {b.clientName}
                        </h3>
                        <p className="font-mono text-xs tabular-nums text-[#9C968C]">
                          {b.clientPhone}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${STATUS_TEXT_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-[#F5F2EB]/10 pt-3 text-xs text-[#9C968C]">
                      <p className="text-[#F5F2EB]">
                        {b.serviceTitle} ·{' '}
                        <span className="font-mono tabular-nums">{b.priceUah} грн</span>
                      </p>
                      <p className="mt-0.5">Майстер: {b.barberName}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {b.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b.id, 'completed')}
                          className="min-h-[38px] flex-1 rounded border border-emerald-500/40 px-3 text-xs font-medium text-emerald-300 cursor-pointer"
                        >
                          Виконано
                        </button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b.id, 'cancelled')}
                          className="min-h-[38px] flex-1 rounded border border-[#F5F2EB]/15 px-3 text-xs font-medium text-[#9C968C] cursor-pointer"
                        >
                          Скасувати
                        </button>
                      )}
                      {b.status === 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b.id, 'confirmed')}
                          className="min-h-[38px] flex-1 rounded border border-[#C8A45D]/40 px-3 text-xs font-medium text-[#C8A45D] cursor-pointer"
                        >
                          Відновити
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: BLOCKED HOURS */}
      {activeTab === 'blocks' && (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <form
              onSubmit={handleCreateBlock}
              className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-6"
            >
              <div className="flex items-center gap-2.5">
                <Ban className="h-4 w-4 text-[#C8A45D]" />
                <h2 className="font-display text-2xl font-semibold text-[#F5F2EB]">
                  Заблокувати години
                </h2>
              </div>
              <p className="mt-1.5 text-xs text-[#9C968C]">
                Закрийте перерву або неробочий інтервал у графіку конкретного майстра. Заблокований час одразу зникне з онлайн-запису.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="block-barber"
                    className="block text-xs font-medium text-[#F5F2EB]"
                  >
                    Барбер
                  </label>
                  <select
                    id="block-barber"
                    value={blockBarberId}
                    onChange={(e) => setBlockBarberId(e.target.value)}
                    className="mt-1.5 min-h-[42px] w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F2EB] focus:border-[#C8A45D] focus:outline-none"
                  >
                    {BARBERS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="block-date"
                    className="block text-xs font-medium text-[#F5F2EB]"
                  >
                    Дата
                  </label>
                  <input
                    id="block-date"
                    type="date"
                    required
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="mt-1.5 min-h-[42px] w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-3 py-2 font-mono text-sm text-[#F5F2EB] focus:border-[#C8A45D] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="block-start"
                      className="block text-xs font-medium text-[#F5F2EB]"
                    >
                      Початок
                    </label>
                    <select
                      id="block-start"
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="mt-1.5 min-h-[42px] w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-3 py-2 font-mono text-sm text-[#F5F2EB] focus:border-[#C8A45D] focus:outline-none"
                    >
                      {TIME_OPTIONS.slice(0, -1).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="block-end"
                      className="block text-xs font-medium text-[#F5F2EB]"
                    >
                      Завершення
                    </label>
                    <select
                      id="block-end"
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                      className="mt-1.5 min-h-[42px] w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-3 py-2 font-mono text-sm text-[#F5F2EB] focus:border-[#C8A45D] focus:outline-none"
                    >
                      {TIME_OPTIONS.slice(1).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="block-reason"
                    className="block text-xs font-medium text-[#F5F2EB]"
                  >
                    Причина
                  </label>
                  <input
                    id="block-reason"
                    type="text"
                    required
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Наприклад: Перерва, Вихідний, Навчання"
                    className="mt-1.5 min-h-[42px] w-full rounded-md border border-[#F5F2EB]/15 bg-[#0A0A0B] px-3 py-2 text-sm text-[#F5F2EB] focus:border-[#C8A45D] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={blockSubmitting}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#C8A45D] px-5 py-2.5 text-sm font-semibold text-[#0A0A0B] transition-colors hover:bg-[#D8B878] disabled:opacity-60 cursor-pointer"
                >
                  {blockSubmitting ? 'Збереження...' : 'Заблокувати час'}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#F5F2EB]/10 bg-[#141417] p-6">
              <h2 className="font-display text-2xl font-semibold text-[#F5F2EB]">
                Активні блокування ({blocks.length})
              </h2>

              {blocks.length === 0 ? (
                <p className="mt-4 text-sm text-[#9C968C]">
                  Для обраних фільтрів заблокованих годин немає.
                </p>
              ) : (
                <ul className="mt-5 divide-y divide-[#F5F2EB]/10">
                  {blocks.map((blk) => (
                    <li
                      key={blk.id}
                      className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-mono text-xs tabular-nums text-[#C8A45D]">
                          {blk.date} · {blk.startTime}–{blk.endTime}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#F5F2EB]">
                          {blk.barberName}
                        </p>
                        <p className="mt-0.5 text-xs text-[#9C968C]">{blk.reason}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(blk.id)}
                        className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-md border border-[#F5F2EB]/15 px-3 py-1.5 text-xs text-[#9C968C] transition-colors hover:border-red-400/50 hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Розблокувати</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
