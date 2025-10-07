import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export default function CreateOrderPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const role = user?.role;
    // Allow only employee
    const isEmployee = role === 'employee';
    const [shifts, setShifts] = useState([{ label: 'Pilih shift', value: '' }]);
    const [loadingShifts, setLoadingShifts] = useState(true);
    const todayISO = useMemo(() => toISODateOnly(new Date()), []);
    const [form, setForm] = useState({
        shiftId: '',
        jumlahPesanan: '1',
        tanggalPesanan: todayISO,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    // Load shifts
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoadingShifts(true);
            try {
                const items = await getShifts();
                if (!mounted)
                    return;
                const opts = [
                    { label: 'Pilih shift', value: '' },
                    ...items.map((s) => ({
                        label: `${s.namaShift} (${s.jamMulai?.slice(0, 5)}-${s.jamSelesai?.slice(0, 5)})`,
                        value: s.id,
                    })),
                ];
                setShifts(opts);
            }
            catch (e) {
                // master.api has fallback stubs already; show warning if needed
            }
            finally {
                if (mounted)
                    setLoadingShifts(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);
    const validate = useCallback((state) => {
        const errs = {};
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
        }
        else {
            // not past date
            const selected = state.tanggalPesanan;
            if (selected < todayISO) {
                errs.tanggalPesanan = 'Tanggal tidak boleh di masa lalu';
            }
        }
        return errs;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [todayISO]);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        const errs = validate(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0)
            return;
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
        }
        catch (error) {
            const message = error?.message ?? 'Gagal membuat pesanan';
            setErrors((s) => ({ ...s, form: message }));
            showError(message);
        }
        finally {
            setSubmitting(false);
        }
    }, [form, navigate, validate]);
    if (!isEmployee) {
        return (_jsx("div", { className: "px-6 py-6", children: _jsx(EmptyState, { title: "Akses ditolak", description: "Hanya karyawan (employee) yang dapat membuat pesanan." }) }));
    }
    return (_jsxs("div", { className: "px-6 py-6", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h1", { className: "text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white", children: "Buat Pesanan" }), _jsx("p", { className: "text-sm text-slate-700 dark:text-slate-300", children: "Isi formulir di bawah ini untuk membuat pesanan baru." })] }), _jsxs("form", { className: "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm max-w-2xl", onSubmit: handleSubmit, noValidate: true, children: [_jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsx("div", { children: loadingShifts ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Spinner, { variant: "primary" }), _jsx("span", { className: "text-sm text-slate-600 dark:text-slate-300", children: "Memuat shift..." })] })) : (_jsx(Select, { label: "Shift", options: shifts, value: form.shiftId, onChange: (e) => setForm((s) => ({ ...s, shiftId: e.currentTarget.value })), error: errors.shiftId, placeholder: "Pilih shift" })) }), _jsx("div", { children: _jsx(DatePicker, { label: "Tanggal Pesanan", value: form.tanggalPesanan, onChange: (e) => setForm((s) => ({ ...s, tanggalPesanan: e.currentTarget.value || '' })), error: errors.tanggalPesanan, helperText: "Tanggal tidak boleh di masa lalu" }) }), _jsx("div", { children: _jsx(Input, { label: "Jumlah Pesanan", type: "number", inputMode: "numeric", min: 1, value: form.jumlahPesanan, onChange: (e) => setForm((s) => ({ ...s, jumlahPesanan: e.currentTarget.value })), error: errors.jumlahPesanan, helperText: "Masukkan angka >= 1" }) })] }), errors.form ? (_jsx("div", { className: "mt-3 text-sm text-red-600 dark:text-red-400", role: "alert", children: errors.form })) : null, _jsxs("div", { className: "mt-5 flex items-center gap-2", children: [_jsx(Button, { type: "submit", variant: "primary", isLoading: submitting, children: "Simpan" }), _jsx(Button, { type: "button", variant: "outline", onClick: () => navigate('/orders'), disabled: submitting, children: "Batal" })] })] })] }));
}
