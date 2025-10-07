// frontend/src/pages/orders/CreateOrderPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { getShifts } from '@/services/api/master.api';
import { createOrder } from '@/services/api/orders.api';
import { toISODateOnly, isValidDateOnlyString } from '@/utils/date.utils';
import { showError, showSuccess } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/auth.store';

// Interface for shift options
interface ShiftOption {
  label: string;
  value: string;
}

// Form state interface
interface OrderForm {
  shiftId: string;
  jumlahPesanan: string;
  tanggalPesanan: string;
}

// Form errors interface  
interface OrderFormErrors {
  shiftId?: string;
  jumlahPesanan?: string;
  tanggalPesanan?: string;
  form?: string;
}

export default function CreateOrderPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const role = user?.role;
    
    // Allow only employee
    const isEmployee = role === 'employee';
    
    const [shifts, setShifts] = useState<ShiftOption[]>([{ label: 'Pilih shift', value: '' }]);
    const [loadingShifts, setLoadingShifts] = useState(true);
    const todayISO = useMemo(() => toISODateOnly(new Date()), []);
    
    const [form, setForm] = useState<OrderForm>({
        shiftId: '',
        jumlahPesanan: '1',
        tanggalPesanan: todayISO,
    });
    
    const [errors, setErrors] = useState<OrderFormErrors>({});
    const [submitting, setSubmitting] = useState(false);

    // Load shifts
    useEffect(() => {
        let mounted = true;
        
        const loadShifts = async () => {
            setLoadingShifts(true);
            try {
                const items = await getShifts();
                if (!mounted) return;
                
                const opts: ShiftOption[] = [
                    { label: 'Pilih shift', value: '' },
                    ...items.map((s) => ({
                        label: `${s.namaShift} (${s.jamMulai?.slice(0, 5)}-${s.jamSelesai?.slice(0, 5)})`,
                        value: String(s.id), // Ensure value is string
                    })),
                ];
                setShifts(opts);
                console.log('Shifts loaded successfully:', opts); // Debug log
            } catch (e) {
                // master.api has fallback stubs already; show warning if needed
                console.warn('Failed to load shifts, using fallback:', e);
            } finally {
                if (mounted) setLoadingShifts(false);
            }
        };

        loadShifts();
        
        return () => {
            mounted = false;
        };
    }, []);

    const validate = useCallback((state: OrderForm): OrderFormErrors => {
        const errs: OrderFormErrors = {};
        
        // shift validation
        if (!state.shiftId || String(state.shiftId).trim() === '') {
            errs.shiftId = 'Shift wajib dipilih';
        }
        
        // jumlahPesanan validation
        const qty = Number(state.jumlahPesanan);
        if (!Number.isFinite(qty) || qty < 1) {
            errs.jumlahPesanan = 'Jumlah minimal 1';
        }
        
        // tanggal validation
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
    }, [todayISO]);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
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
            const order = await createOrder(payload);
            showSuccess(`Pesanan berhasil dibuat${order?.kodePesanan ? `: ${order.kodePesanan}` : ''}`);
            navigate('/orders');
        } catch (error: any) {
            const message = error?.message ?? 'Gagal membuat pesanan';
            setErrors((s) => ({ ...s, form: message }));
            showError(message);
        } finally {
            setSubmitting(false);
        }
    }, [form, navigate, validate]);

    // Handle shift change with proper event handling - FIXED
    const handleShiftChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value || '';
        console.log('Shift selection changed to:', value); // Debug log
        setForm((s) => ({ ...s, shiftId: value }));
        
        // Clear shift error when user selects a shift
        if (value && errors.shiftId) {
            setErrors((s) => ({ ...s, shiftId: undefined }));
        }
    }, [errors.shiftId]);

    const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value || '';
        setForm((s) => ({ ...s, tanggalPesanan: value }));
    }, []);

    const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value || '';
        setForm((s) => ({ ...s, jumlahPesanan: value }));
    }, []);

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
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        {loadingShifts ? (
                            <div className="flex items-center gap-2">
                                <Spinner variant="primary" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    Memuat shift...
                                </span>
                            </div>
                        ) : (
                            <Select
                                label="Shift"
                                options={shifts}
                                value={form.shiftId}
                                onChange={handleShiftChange}
                                error={errors.shiftId}
                                placeholder="Pilih shift"
                            />
                        )}
                    </div>

                    <div>
                        <DatePicker
                            label="Tanggal Pesanan"
                            value={form.tanggalPesanan}
                            onChange={handleDateChange}
                            error={errors.tanggalPesanan}
                            helperText="Tanggal tidak boleh di masa lalu"
                        />
                    </div>

                    <div>
                        <Input
                            label="Jumlah Pesanan"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={form.jumlahPesanan}
                            onChange={handleQuantityChange}
                            error={errors.jumlahPesanan}
                            helperText="Masukkan angka >= 1"
                        />
                    </div>
                </div>

                {errors.form && (
                    <div className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                        {errors.form}
                    </div>
                )}

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