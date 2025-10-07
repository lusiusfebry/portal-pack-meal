// frontend/src/components/forms/DepartmentForm.tsx
import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Department } from '@/types/user.types';
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '@/services/api/master.api';

export interface DepartmentFormProps {
  mode?: 'create' | 'edit';
  initial?: Partial<Department>;
  submitting?: boolean;
  onSubmit: (
    payload: CreateDepartmentPayload | UpdateDepartmentPayload,
  ) => Promise<void> | void;
  onCancel?: () => void;
}

interface FormState {
  namaDivisi: string;
  keterangan: string;
}

interface FormErrors {
  namaDivisi?: string;
  keterangan?: string;
}

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {};
  const nama = state.namaDivisi.trim();
  if (!nama) {
    errors.namaDivisi = 'Nama divisi wajib diisi';
  } else if (nama.length < 2) {
    errors.namaDivisi = 'Nama divisi terlalu pendek (min 2 karakter)';
  } else if (nama.length > 128) {
    errors.namaDivisi = 'Nama divisi terlalu panjang (maks 128 karakter)';
  }

  const ket = state.keterangan.trim();
  if (ket && ket.length > 512) {
    errors.keterangan = 'Keterangan terlalu panjang (maks 512 karakter)';
  }

  return errors;
}

export default function DepartmentForm({
  mode = 'create',
  initial,
  submitting,
  onSubmit,
  onCancel,
}: DepartmentFormProps) {
  const [state, setState] = React.useState<FormState>({
    namaDivisi: initial?.namaDivisi ?? '',
    keterangan: initial?.keterangan ?? '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isDirty, setDirty] = React.useState<boolean>(false);
  const [isSubmittingLocal, setSubmittingLocal] = React.useState<boolean>(false);

  const isSubmitting = Boolean(submitting ?? isSubmittingLocal);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setDirty(true);
    if (errors[key]) {
      // Clear field error on change
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

    const payload: CreateDepartmentPayload | UpdateDepartmentPayload = {
      namaDivisi: state.namaDivisi.trim(),
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
        label="Nama Divisi"
        placeholder="Contoh: IT Department"
        value={state.namaDivisi}
        onChange={(e) => handleChange('namaDivisi', e.currentTarget.value)}
        error={errors.namaDivisi}
        required
      />

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

      {/* Helper: unsaved changes indicator */}
      {isDirty && !isSubmitting ? (
        <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          Perubahan belum disimpan.
        </p>
      ) : null}
    </form>
  );
}