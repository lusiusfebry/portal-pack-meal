/**
 * Utilitas tanggal untuk UI dengan date-fns.
 * Pastikan sinkron dengan kontrak backend yang menggunakan format ISO/DateOnly.
 */
import { format as dfFormat, parseISO, isValid as dfIsValid, formatISO, addDays, differenceInCalendarDays, formatDistanceToNow, parse as dfParse, } from 'date-fns';
/**
 * Normalisasi input ke Date yang valid.
 */
export function toDate(input) {
    if (input instanceof Date) {
        return dfIsValid(input) ? input : null;
    }
    if (typeof input === 'number') {
        const d = new Date(input);
        return dfIsValid(d) ? d : null;
    }
    if (typeof input === 'string') {
        // Coba parse ISO dulu
        const iso = parseISO(input);
        if (dfIsValid(iso))
            return iso;
        // Fallback: coba parse 'yyyy-MM-dd'
        const d = dfParse(input, 'yyyy-MM-dd', new Date());
        return dfIsValid(d) ? d : null;
    }
    return null;
}
/**
 * Format tanggal (default: yyyy-MM-dd).
 */
export function formatDate(input, pattern = 'yyyy-MM-dd') {
    const d = toDate(input);
    return d ? dfFormat(d, pattern) : '';
}
/**
 * Format tanggal+jam (default: yyyy-MM-dd HH:mm).
 */
export function formatDateTime(input, pattern = 'yyyy-MM-dd HH:mm') {
    const d = toDate(input);
    return d ? dfFormat(d, pattern) : '';
}
/**
 * ISO string dengan hanya bagian tanggal (YYYY-MM-DD).
 */
export function toISODateOnly(input) {
    const d = toDate(input);
    if (!d)
        return '';
    return dfFormat(d, 'yyyy-MM-dd');
}
/**
 * ISO string penuh (e.g., 2025-10-01T12:34:56.789Z).
 */
export function toISODateTime(input) {
    const d = toDate(input);
    return d ? formatISO(d) : '';
}
/**
 * Apakah dua tanggal pada hari yang sama (berdasarkan kalender lokal).
 */
export function isSameDay(a, b) {
    const da = toDate(a);
    const db = toDate(b);
    if (!da || !db)
        return false;
    return (da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate());
}
/**
 * Menghasilkan array tanggal (YYYY-MM-DD) dari start sampai end (inklusif).
 */
export function getDateRangeDays(start, end) {
    const s = toDate(start);
    const e = toDate(end);
    if (!s || !e)
        return [];
    const days = Math.max(0, differenceInCalendarDays(e, s));
    const result = [];
    for (let i = 0; i <= days; i++) {
        result.push(toISODateOnly(addDays(s, i)));
    }
    return result;
}
/**
 * Relative time (e.g., "3 minutes ago" / "dalam 3 menit").
 * Catatan: Locale default (en). Dapat di-improve dengan locale id saat dibutuhkan.
 */
export function formatRelativeToNow(input) {
    const d = toDate(input);
    if (!d)
        return '';
    return formatDistanceToNow(d, { addSuffix: true });
}
/**
 * Helper: Validasi string tanggal 'yyyy-MM-dd'.
 */
export function isValidDateOnlyString(v) {
    if (!v)
        return false;
    const d = dfParse(v, 'yyyy-MM-dd', new Date());
    return dfIsValid(d) && toISODateOnly(d) === v;
}
/**
 * Format durasi dalam menit menjadi string ramah pengguna.
 * - Null/undefined → "—"
 * - < 60 → "X menit"
 * - >= 60 → "X jam Y menit" (Y dihilangkan jika 0)
 */
export function formatDuration(minutes) {
    if (minutes == null)
        return '—';
    const m = Math.max(0, Math.floor(minutes));
    if (m < 60)
        return `${m} menit`;
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    if (mins === 0)
        return `${hours} jam`;
    return `${hours} jam ${mins} menit`;
}
