// frontend/src/components/forms/ShiftForm.tsx
import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Shift } from '@/types/user.types';
import type {
  CreateShiftPayload,
  UpdateShiftPayload,
} from '@/services/api/master.api';

export interface ShiftFormProps {
  mode?: 'create' | 'edit';
  initial?: Partial<Shift>;
  submitting?: boolean;
  onSubmit: (
    payload: CreateShiftPayload | UpdateShiftPayload,
  ) => Promise<void> | void;
  onCancel?: () => void;
}

interface FormState {
  namaShift: string;
  jamMulai: string;   // HTML time value "HH:mm"
  jamSelesai: string; // HTML time value "HH:mm"
  keterangan: string;
}

interface FormErrors {
  namaShift?: string;
  jamMulai?: string;
  jamSelesai?: string;
  range?: string;
  keterangan?: string;
}

function toTimeInput(value?: string | null): string {
  if (!value) return '';
  // value could be 'HH:mm:ss' or 'HH:mm' — normalize to HH:mm for input[type=time]
  if (value.length >= 5) return value.slice(0, 5);
  return '';
}

function toApiTime(value: string): string {
  // Convert 'HH:mm' -> 'HH:mm:00'
  if (!value) return '';
  if (value.length === 5) return `${value}:00`;
  return value;
}

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {};
  const nama = state.namaShift.trim();

  if (!nama) {
    errors.namaShift = 'Nama shift wajib diisi';
  } else if (nama.length < 2) {
    errors.namaShift = 'Nama shift terlalu pendek (min 2 karakter)';
  } else if (nama.length > 64) {
    errors.namaShift = 'Nama shift terlalu panjang (maks 64 karakter)';
  }

  if (!state.jamMulai) errors.jamMulai = 'Jam mulai wajib diisi';
  if (!state.jamSelesai) errors.jamSelesai = 'Jam selesai wajib diisi';

  // Jika keduanya ada, cek kesetaraan. Tidak memaksa start < end agar shift lintas tengah malam tetap valid.
  if (state.jamMulai && state.jamSelesai && state.jamMulai === state.jamSelesai) {
    errors.range = 'Jam mulai dan jam selesai tidak boleh sama';
  }

  const ket = state.keterangan.trim();
  if (ket && ket.length > 512) {
    errors.keterangan = 'Keterangan terlalu panjang (maks 512 karakter)';
  }

  return errors;
}

export default function ShiftForm({
  mode = 'create',
  initial,
  submitting,
  onSubmit,
  onCancel,
}: ShiftFormProps) {
  const [state, setState] = React.useState<FormState>({
    namaShift: initial?.namaShift ?? '',
    jamMulai: toTimeInput(initial?.jamMulai),
    jamSelesai: toTimeInput(initial?.jamSelesai),
    keterangan: initial?.keterangan ?? '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isDirty, setDirty] = React.useState<boolean>(false);
  const [isSubmittingLocal, setSubmittingLocal] = React.useState<boolean>(false);

  const isSubmitting = Boolean(submitting ?? isSubmittingLocal);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setDirty(true);
    // Clear field-specific error
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined, range: undefined }));
    // Clear range error when any time changes
    if ((key === 'jamMulai' || key === 'jamSelesai') && errors.range) {
      setErrors((e) => ({ ...e, range: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const payload: CreateShiftPayload | UpdateShiftPayload = {
      namaShift: state.namaShift.trim(),
      jamMulai: toApiTime(state.jamMulai),
      jamSelesai: toApiTime(state.jamSelesai),
      keterangan: state.keterangan.trim() || null,
    };

    try {
      if (submitting === undefined) setSubmittingLocal(true);
      await onSubmit(payload);
      setDirty(false);
    } finally {
      if (submitting === undefined) setSubmittingLocal(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Nama Shift"
        placeholder="Contoh: Shift 1"
        value={state.namaShift}
        onChange={(e) => handleChange('namaShift', e.currentTarget.value)}
        error={errors.namaShift}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Jam Mulai"
          type="time"
          value={state.jamMulai}
          onChange={(e) => handleChange('jamMulai', e.currentTarget.value)}
          error={errors.jamMulai}
          required
        />
        <Input
          label="Jam Selesai"
          type="time"
          value={state.jamSelesai}
          onChange={(e) => handleChange('jamSelesai', e.currentTarget.value)}
          error={errors.jamSelesai}
          required
        />
      </div>

      {errors.range ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">{errors.range}</p>
      ) : null}

      <Input
        label="Keterangan (opsional)"
        placeholder="Tambahkan catatan singkat bila diperlukan"
        value={state.keterangan}
        onChange={(e) => handleChange('keterangan', e.currentTarget.value)}
        error={errors.keterangan}
      />

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        ) : null}

        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {mode === 'create' ? 'Simpan' : 'Perbarui'}
        </Button>
      </div>

      {isDirty && !isSubmitting ? (
        <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          Perubahan belum disimpan.
        </p>
      ) : null}
    </form>
  );
}