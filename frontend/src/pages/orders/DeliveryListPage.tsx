// frontend/src/pages/orders/DeliveryListPage.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';

import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

import { getOrders, updateOrderStatus } from '@/services/api/orders.api';

import {
  StatusPesanan,
  type Order,
  type QueryOrdersParams,
} from '@/types/order.types';
import type { Role } from '@/types/auth.types';

import { getStatusBadgeVariant, getStatusLabel } from '@/utils/status.utils';
import { formatDate } from '@/utils/date.utils';
import { showError, showSuccess, showInfo } from '@/components/ui/Toast';

import useWebSocket from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/auth.store';

/**
 * DeliveryListPage
 * - Mobile-first
 * - Tabs: "Siap Diambil" (READY) dan "Sedang Diantar" (ON_DELIVERY)
 * - Large action buttons:
 *   - READY → Pickup (ubah ke ON_DELIVERY)
 *   - ON_DELIVERY → Complete (ubah ke COMPLETE)
 * - Order cards dengan large touch targets
 * - Real-time updates via WebSocket (order.status.changed)
 */

type TabKey = 'READY' | 'ON_DELIVERY';

export default function DeliveryListPage() {
  const { user } = useAuthStore();
  const role: Role | undefined = user?.role;
  const isDelivery = role === 'delivery' || role === 'administrator'; // admin dapat mengoperasikan untuk keperluan kontrol

  const [activeTab, setActiveTab] = useState<TabKey>('READY');

  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [onDeliveryOrders, setOnDeliveryOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);

  // WebSocket: refetch on status change
  const wsStatusChanged = useWebSocket(
    'order.status.changed',
    useCallback((payload) => {
      showInfo(
        `Status ${payload.kodePesanan ?? '#' + payload.orderId} berubah menjadi ${getStatusLabel(
          payload.newStatus,
        )}`,
      );
      void refetch();
    }, []),
    [],
  );

  const refetch = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const paramsBase: QueryOrdersParams = { page: 1, limit: 50 };
      const [ready, onDelivery] = await Promise.all([
        getOrders({ ...paramsBase, status: StatusPesanan.READY }),
        getOrders({ ...paramsBase, status: StatusPesanan.ON_DELIVERY }),
      ]);
      setReadyOrders(ready.data);
      setOnDeliveryOrders(onDelivery.data);
    } catch (error: any) {
      const message = (error?.message as string) ?? 'Gagal memuat daftar pengantaran';
      setLoadError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeItems = useMemo<Order[]>(() => {
    return activeTab === 'READY' ? readyOrders : onDeliveryOrders;
  }, [activeTab, readyOrders, onDeliveryOrders]);

  const pickup = async (order: Order) => {
    setSubmitting(true);
    try {
      const updated = await updateOrderStatus(order.id, StatusPesanan.ON_DELIVERY);
      showSuccess(`Pickup: ${updated.kodePesanan} sekarang sedang diantar`);
      void refetch();
    } catch (error: any) {
      showError((error?.message as string) ?? 'Gagal melakukan pickup');
    } finally {
      setSubmitting(false);
    }
  };

  const complete = async (order: Order) => {
    setSubmitting(true);
    try {
      const updated = await updateOrderStatus(order.id, StatusPesanan.COMPLETE);
      showSuccess(`Selesai: ${updated.kodePesanan} pengantaran lengkap`);
      void refetch();
    } catch (error: any) {
      showError((error?.message as string) ?? 'Gagal menyelesaikan pengantaran');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isDelivery) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6">
        <EmptyState
          title="Akses ditolak"
          description="Halaman pengantaran hanya untuk peran Delivery."
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-3 md:mb-4">
        <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white">
          Daftar Pengantaran
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Kelola pesanan untuk diambil dan diselesaikan.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Realtime: order.status.changed [{wsStatusChanged}]
        </p>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 p-1 mb-4">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            className={[
              'rounded-lg px-3 py-2 text-center text-sm',
              activeTab === 'READY'
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
            ].join(' ')}
            onClick={() => setActiveTab('READY')}
            aria-pressed={activeTab === 'READY'}
          >
            Siap Diambil
          </button>
          <button
            type="button"
            className={[
              'rounded-lg px-3 py-2 text-center text-sm',
              activeTab === 'ON_DELIVERY'
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
            ].join(' ')}
            onClick={() => setActiveTab('ON_DELIVERY')}
            aria-pressed={activeTab === 'ON_DELIVERY'}
          >
            Sedang Diantar
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading ? (
        <div className="w-full flex items-center justify-center py-12">
          <Spinner variant="primary" size="lg" label="Memuat daftar pengantaran..." />
        </div>
      ) : loadError ? (
        <EmptyState
          title="Gagal memuat data"
          description={loadError}
          action={{
            label: 'Coba Lagi',
            onClick: () => void refetch(),
            variant: 'primary',
          }}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M12 9v4M12 17h.01M4.93 4.93l14.14 14.14" />
            </svg>
          }
        />
      ) : activeItems.length === 0 ? (
        <EmptyState
          title={activeTab === 'READY' ? 'Tidak ada pesanan siap diambil' : 'Tidak ada pesanan sedang diantar'}
          description={
            activeTab === 'READY'
              ? 'Tunggu notifikasi pesanan siap untuk pickup.'
              : 'Tidak ada pesanan yang sedang diantar saat ini.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {activeItems.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
            >
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {order.kodePesanan}
                    </div>
                    <div className="mt-0.5 text-xs md:text-sm text-slate-600 dark:text-slate-300">
                      Departemen {order.departemen?.namaDivisi ?? `#${order.departmentPemesanId}`} • Shift {order.shift ? `${order.shift.namaShift} (${order.shift.jamMulai?.slice(0,5)}-${order.shift.jamSelesai?.slice(0,5)})` : `#${order.shiftId}`}
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(order.statusPesanan)} size="md">
                    {getStatusLabel(order.statusPesanan)}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300">
                    Jumlah: <span className="font-medium">{order.jumlahPesanan}</span>
                  </div>
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 text-right">
                    Tanggal: <span className="font-medium">{formatDate(order.tanggalPesanan, 'yyyy-MM-dd')}</span>
                  </div>
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300">
                    Dibuat: <span className="font-medium">{formatDate(order.waktuDibuat, 'HH:mm')}</span>
                  </div>
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 text-right">
                    {order.waktuSiap ? (
                      <>
                        Siap: <span className="font-medium">{formatDate(order.waktuSiap, 'HH:mm')}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4">
                  {activeTab === 'READY' ? (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full md:w-auto"
                      onClick={() => void pickup(order)}
                      isLoading={submitting}
                      leftIcon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeWidth="2" strokeLinecap="round" d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      }
                    >
                      Pickup
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full md:w-auto"
                      onClick={() => void complete(order)}
                      isLoading={submitting}
                      leftIcon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeWidth="2" strokeLinecap="round" d="M9 5l7 7-7 7" />
                        </svg>
                      }
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}