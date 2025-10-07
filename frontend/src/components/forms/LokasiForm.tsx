// frontend/src/components/forms/LokasiForm.tsx
import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Lokasi } from '@/types/user.types';
import type {
  CreateLokasiPayload,
  UpdateLokasiPayload,
} from '@/services/api/master.api';

export interface LokasiFormProps {
  mode?: 'create' | 'edit';
  initial?: Partial<Lokasi>;
  submitting?: boolean;
  onSubmit: (
    payload: CreateLokasiPayload | UpdateLokasiPayload,
  ) => Promise<void> | void;
  onCancel?: () => void;
}

interface FormState {
  namaLokasi: string;
  alamat: string;
  keterangan: string;
  isActive: boolean;
}

interface FormErrors {
  namaLokasi?: string;
  alamat?: string;
  keterangan?: string;
}

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {};
  const nama = state.namaLokasi.trim();
  if (!nama) {
    errors.namaLokasi = 'Nama lokasi wajib diisi';
  } else if (nama.length < 2) {
    errors.namaLokasi = 'Nama lokasi terlalu pendek (min 2 karakter)';
  } else if (nama.length > 100) {
    errors.namaLokasi = 'Nama lokasi terlalu panjang (maks 100 karakter)';
  }

  const adr = state.alamat.trim();
  if (!adr) {
    errors.alamat = 'Alamat wajib diisi';
  } else if (adr.length > 512) {
    errors.alamat = 'Alamat terlalu panjang (maks 512 karakter)';
  }

  const ket = state.keterangan.trim();
  if (ket && ket.length > 512) {
    errors.keterangan = 'Keterangan terlalu panjang (maks 512 karakter)';
  }

  return errors;
}

export default function LokasiForm({
  mode = 'create',
  initial,
  submitting,
  onSubmit,
  onCancel,
}: LokasiFormProps) {
  const [state, setState] = React.useState<FormState>({
    namaLokasi: initial?.namaLokasi ?? '',
    alamat: initial?.alamat ?? '',
    keterangan: initial?.keterangan ?? '',
    isActive: initial?.isActive ?? true,
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isDirty, setDirty] = React.useState<boolean>(false);
  const [isSubmittingLocal, setSubmittingLocal] = React.useState<boolean>(false);

  const isSubmitting = Boolean(submitting ?? isSubmittingLocal);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setDirty(true);
    if (key in errors && (errors as any)[key]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const payload: CreateLokasiPayload | UpdateLokasiPayload = {
      namaLokasi: state.namaLokasi.trim(),
      alamat: state.alamat.trim(),
      keterangan: state.keterangan.trim() || null,
      isActive: !!state.isActive,
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
        label="Nama Lokasi"
        placeholder="Contoh: Gudang Utama"
        value={state.namaLokasi}
        onChange={(e) => handleChange('namaLokasi', e.currentTarget.value)}
        error={errors.namaLokasi}
        required
      />

      <Input
        label="Alamat"
        placeholder="Contoh: Jl. Merdeka No. 123, Jakarta"
        value={state.alamat}
        onChange={(e) => handleChange('alamat', e.currentTarget.value)}
        error={errors.alamat}
        required
      />

      <Input
        label="Keterangan (opsional)"
        placeholder="Tambahkan catatan singkat bila diperlukan"
        value={state.keterangan}
        onChange={(e) => handleChange('keterangan', e.currentTarget.value)}
        error={errors.keterangan}
      />

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={state.isActive}
          onChange={(e) => handleChange('isActive', e.currentTarget.checked)}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
          Status Aktif
        </label>
      </div>

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