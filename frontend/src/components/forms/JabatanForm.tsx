// frontend/src/components/forms/JabatanForm.tsx
import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import type { Department, Jabatan } from '@/types/user.types';
import type {
  CreateJabatanPayload,
  UpdateJabatanPayload,
} from '@/services/api/master.api';

export interface JabatanFormProps {
  mode?: 'create' | 'edit';
  initial?: Partial<Jabatan>;
  departments?: Department[];
  submitting?: boolean;
  onSubmit: (
    payload: CreateJabatanPayload | UpdateJabatanPayload,
  ) => Promise<void> | void;
  onCancel?: () => void;
}

interface FormState {
  namaJabatan: string;
  departmentId: string; // store as string then convert to number
  keterangan: string;
}

interface FormErrors {
  namaJabatan?: string;
  departmentId?: string;
  keterangan?: string;
}

function validate(state: FormState, allowEmptyDept: boolean): FormErrors {
  const errors: FormErrors = {};

  const nama = state.namaJabatan.trim();
  if (!nama) {
    errors.namaJabatan = 'Nama jabatan wajib diisi';
  } else if (nama.length < 2) {
    errors.namaJabatan = 'Nama jabatan terlalu pendek (min 2 karakter)';
  } else if (nama.length > 128) {
    errors.namaJabatan = 'Nama jabatan terlalu panjang (maks 128 karakter)';
  }

  const ket = state.keterangan.trim();
  if (ket && ket.length > 512) {
    errors.keterangan = 'Keterangan terlalu panjang (maks 512 karakter)';
  }

  if (!allowEmptyDept) {
    if (!state.departmentId) {
      errors.departmentId = 'Departemen wajib dipilih';
    } else {
      const num = Number(state.departmentId);
      if (!Number.isFinite(num) || num <= 0) {
        errors.departmentId = 'Departemen tidak valid';
      }
    }
  } else if (state.departmentId) {
    const num = Number(state.departmentId);
    if (!Number.isFinite(num) || num <= 0) {
      errors.departmentId = 'Departemen tidak valid';
    }
  }

  return errors;
}

export default function JabatanForm({
  mode = 'create',
  initial,
  departments = [],
  submitting,
  onSubmit,
  onCancel,
}: JabatanFormProps) {
  const [state, setState] = React.useState<FormState>({
    namaJabatan: initial?.namaJabatan ?? '',
    departmentId:
      initial?.departmentId && Number.isFinite(Number(initial.departmentId))
        ? String(initial.departmentId)
        : '',
    keterangan: initial?.keterangan ?? '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isDirty, setDirty] = React.useState<boolean>(false);
  const [isSubmittingLocal, setSubmittingLocal] = React.useState<boolean>(false);

  const isSubmitting = Boolean(submitting ?? isSubmittingLocal);

  const allowEmptyDept = true; // departmentId optional pada UI

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setDirty(true);
    if (errors[key]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate(state, allowEmptyDept);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const deptId =
      state.departmentId && Number.isFinite(Number(state.departmentId))
        ? Number(state.departmentId)
        : null;

    const payload: CreateJabatanPayload | UpdateJabatanPayload = {
      namaJabatan: state.namaJabatan.trim(),
      departmentId: deptId,
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

  const departmentOptions =
    departments?.map((d) => ({
      label: d.namaDivisi,
      value: d.id,
    })) ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Nama Jabatan"
        placeholder="Contoh: Supervisor"
        value={state.namaJabatan}
        onChange={(e) => handleChange('namaJabatan', e.currentTarget.value)}
        error={errors.namaJabatan}
        required
      />

      <Select
        label="Departemen (opsional)"
        placeholder="Pilih departemen"
        value={state.departmentId}
        onChange={(e) => handleChange('departmentId', e.currentTarget.value)}
        options={departmentOptions}
        error={errors.departmentId}
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

      {isDirty && !isSubmitting ? (
        <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          Perubahan belum disimpan.
        </p>
      ) : null}
    </form>
  );
}