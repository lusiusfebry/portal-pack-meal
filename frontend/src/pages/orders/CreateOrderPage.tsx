// frontend/src/pages/orders/CreateOrderPage.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import Select, { type SelectOption } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

import { getShifts } from '@/services/api/master.api';
import { createOrder } from '@/services/api/orders.api';

import { toISODateOnly, isValidDateOnlyString } from '@/utils/date.utils';
import { showError, showSuccess } from '@/components/ui/Toast';

import { useAuthStore } from '@/stores/auth.store';
import type { Role } from '@/types/auth.types';
import type { Order } from '@/types/order.types';

/**
 * CreateOrderPage
 * - Employee only
 * - Form: shift selection, quantity, date (not past)
 * - Validation:
 *   - quantity >= 1
 *   - tanggalPesanan >= today
 * - Success: toast + navigate to /orders
 */

interface FormState {
  shiftId: string; // store as string for select handling, cast to number on submit
  jumlahPesanan: string; // store as string, validate/cast to number
  tanggalPesanan: string; // 'yyyy-MM-dd'
}

interface FormErrors {
  shiftId?: string;
  jumlahPesanan?: string;
  tanggalPesanan?: string;
  form?: string;
}

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role: Role | undefined = user?.role;

  // Allow only employee
  const isEmployee = role === 'employee';

  const [shifts, setShifts] = useState<SelectOption[]>([{ label: 'Pilih shift', value: '' }]);
  const [loadingShifts, setLoadingShifts] = useState<boolean>(true);

  const todayISO = useMemo(() => toISODateOnly(new Date()), []);
  const [form, setForm] = useState<FormState>({
    shiftId: '',
    jumlahPesanan: '1',
    tanggalPesanan: todayISO,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load shifts
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingShifts(true);
      try {
        const items = await getShifts();
        if (!mounted) return;
        const opts: SelectOption[] = [
          { label: 'Pilih shift', value: '' },
          ...items.map((s) => ({
            label: `${s.namaShift} (${s.jamMulai?.slice(0, 5)}-${s.jamSelesai?.slice(0, 5)})`,
            value: s.id,
          })),
        ];
        setShifts(opts);
      } catch (e: any) {
        // master.api has fallback stubs already; show warning if needed
      } finally {
        if (mounted) setLoadingShifts(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const validate = useCallback((state: FormState): FormErrors => {
    const errs: FormErrors = {};
    // shift
    if (!state.shiftId || String(state.shiftId).trim() === '') {
      errs.shiftId = 'Shift wajib dipilih';
    }
    // jumlahPesanan
    const qty = Number(state.jumlahPesanan);
    if (!Number.isFinite(qty) || qty < 1) {
      errs.jumlahPesanan = 'Jumlah minimal 1';
    }
    // tanggal
    if (!isValidDateOnlyString(state.tanggalPesanan)) {
      errs.tanggalPesanan = 'Tanggal tidak valid (yyyy-MM-dd)';
    } else {
      // not past date
      const selected = state.tanggalPesanan;
      if (selected < todayISO) {
        errs.tanggalPesanan = 'Tanggal tidak boleh di masa lalu';
      }
    }
    return errs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayISO]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      shiftId: Number(form.shiftId),
      jumlahPesanan: Number(form.jumlahPesanan),
      tanggalPesanan: form.tanggalPesanan,
    };

    setSubmitting(true);
    try {
      const order: Order = await createOrder(payload);
      showSuccess(`Pesanan berhasil dibuat${order?.kodePesanan ? `: ${order.kodePesanan}` : ''}`);
      navigate('/orders');
    } catch (error: any) {
      const message = (error?.message as string) ?? 'Gagal membuat pesanan';
      setErrors((s) => ({ ...s, form: message }));
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate, validate]);

  if (!isEmployee) {
    return (
      <div className="px-6 py-6">
        <EmptyState
          title="Akses ditolak"
          description="Hanya karyawan (employee) yang dapat membuat pesanan."
        />
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">
          Buat Pesanan
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Isi formulir di bawah ini untuk membuat pesanan baru.
        </p>
      </div>

      <form
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm max-w-2xl"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Shift */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            {loadingShifts ? (
              <div className="flex items-center gap-2">
                <Spinner variant="primary" />
                <span className="text-sm text-slate-600 dark:text-slate-300">Memuat shift...</span>
              </div>
            ) : (
              <Select
                label="Shift"
                options={shifts}
                value={form.shiftId}
                onChange={(e) => setForm((s) => ({ ...s, shiftId: e.currentTarget.value }))}
                error={errors.shiftId}
                placeholder="Pilih shift"
              />
            )}
          </div>

          {/* Tanggal pesanan */}
          <div>
            <DatePicker
              label="Tanggal Pesanan"
              value={form.tanggalPesanan}
              onChange={(e) =>
                setForm((s) => ({ ...s, tanggalPesanan: e.currentTarget.value || '' }))
              }
              error={errors.tanggalPesanan}
              helperText="Tanggal tidak boleh di masa lalu"
            />
          </div>

          {/* Jumlah pesanan */}
          <div>
            <Input
              label="Jumlah Pesanan"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.jumlahPesanan}
              onChange={(e) => setForm((s) => ({ ...s, jumlahPesanan: e.currentTarget.value }))}
              error={errors.jumlahPesanan}
              helperText="Masukkan angka >= 1"
            />
          </div>
        </div>

        {/* Form error */}
        {errors.form ? (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.form}
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-2">
          <Button type="submit" variant="primary" isLoading={submitting}>
            Simpan
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/orders')}
            disabled={submitting}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}