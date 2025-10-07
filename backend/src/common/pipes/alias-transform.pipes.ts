import { Injectable, PipeTransform } from '@nestjs/common';

/**
 * Alias Transform Pipes
 *
 * Tujuan:
 * - Menyelaraskan payload eksternal (dari alat pengujian/klien lain) dengan DTO internal kita
 * - Mencegah error "property X should not exist" dari ValidationPipe global (forbidNonWhitelisted: true)
 * - Transformasi dilakukan SEBELUM validasi DTO agar whitelist berfungsi pada properti final
 *
 * Referensi DTO:
 * - LoginDto: backend/src/auth/dto/login.dto.ts
 *   - nik, password
 * - CreateUserDto: backend/src/users/dto/create-user.dto.ts
 *   - nik, namaLengkap, password, roleAccess, departmentId?, jabatanId?, keterangan?
 * - CreateShiftDto: backend/src/master-data/dto/create-shift.dto.ts
 *   - namaShift, jamMulai (HH:mm/HH:mm:ss), jamSelesai (HH:mm/HH:mm:ss), keterangan?
 */

/**
 * LoginAliasPipe
 * Menerima bentuk alternatif:
 * - username → nik
 */
@Injectable()
export class LoginAliasPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(value: any) {
    if (!value || typeof value !== 'object') return value;
    const v = { ...value };

    if (v.username && !v.nik) {
      v.nik = v.username;
    }
    // Hapus properti alias agar tidak memicu forbidNonWhitelisted
    if (v.username) {
      delete v.username;
    }

    return v;
  }
}

/**
 * CreateUserAliasPipe
 * Menerima bentuk alternatif:
 * - username → namaLengkap
 * - role → roleAccess
 * - departmentId, jabatanId: string angka → number
 */
@Injectable()
export class CreateUserAliasPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(value: any) {
    if (!value || typeof value !== 'object') return value;
    const v = { ...value };

    // Aliases
    if (v.username && !v.namaLengkap) {
      v.namaLengkap = v.username;
    }
    if (v.role && !v.roleAccess) {
      v.roleAccess = v.role;
    }

    // Coercion number-like strings → number
    if (typeof v.departmentId === 'string' && /^\d+$/.test(v.departmentId)) {
      v.departmentId = Number(v.departmentId);
    }
    if (typeof v.jabatanId === 'string' && /^\d+$/.test(v.jabatanId)) {
      v.jabatanId = Number(v.jabatanId);
    }

    // Bersihkan alias agar tidak memicu forbidNonWhitelisted
    if (v.username) delete v.username;
    if (v.role) delete v.role;

    return v;
  }
}

/**
 * CreateShiftAliasPipe
 * Menerima bentuk alternatif:
 * - name → namaShift
 * - startTime → jamMulai
 * - endTime → jamSelesai
 * Selain itu, normalisasi waktu "H:mm" → "HH:mm" untuk lulus regex DTO.
 */
@Injectable()
export class CreateShiftAliasPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(value: any) {
    if (!value || typeof value !== 'object') return value;
    const v = { ...value };

    // Aliases
    if (v.name && !v.namaShift) {
      v.namaShift = v.name;
    }
    if (v.startTime && !v.jamMulai) {
      v.jamMulai = v.startTime;
    }
    if (v.endTime && !v.jamSelesai) {
      v.jamSelesai = v.endTime;
    }

    // Normalisasi waktu ke HH:mm jika "H:mm"
    const normalize = (t: unknown) => {
      if (typeof t !== 'string') return t;
      // "H:mm:ss" → pad ke "HH:mm:ss"
      const secMatch = /^(\d{1}):([0-5]\d):([0-5]\d)$/.exec(t);
      if (secMatch) {
        const hh = secMatch[1].padStart(2, '0');
        return `${hh}:${secMatch[2]}:${secMatch[3]}`;
      }
      // "H:mm" → pad ke "HH:mm"
      const minMatch = /^(\d{1}):([0-5]\d)$/.exec(t);
      if (minMatch) {
        const hh = minMatch[1].padStart(2, '0');
        return `${hh}:${minMatch[2]}`;
      }
      return t;
    };

    if (v.jamMulai) v.jamMulai = normalize(v.jamMulai);
    if (v.jamSelesai) v.jamSelesai = normalize(v.jamSelesai);

    // Bersihkan alias
    if (v.name) delete v.name;
    if (v.startTime) delete v.startTime;
    if (v.endTime) delete v.endTime;

    return v;
  }
}