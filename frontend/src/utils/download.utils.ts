/**
 * Utility functions untuk unduhan file di frontend.
 * Mendukung:
 * - Download Blob (CSV, PDF, JSON, dll.)
 * - Fetch dan unduh dari URL
 * - Generate CSV dari array objek dan unduh
 * - Generate JSON dan unduh
 *
 * Catatan:
 * - Menyertakan opsi BOM UTF-8 untuk kompatibilitas Excel saat mengunduh CSV.
 */

export function safeFilename(name: string, fallback = 'download'): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return fallback;
  // Ganti karakter yang tidak aman dengan underscore
  return trimmed.replace(/[\\/:*?"<>|]+/g, '_');
}

/**
 * Unduh dari Blob dengan nama file dan mime type opsional.
 */
export function downloadBlob(
  blob: Blob,
  filename = 'download',
): void {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = safeFilename(filename);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Unduh konten teks sebagai file (dengan tipe MIME yang disarankan).
 */
export function downloadText(
  content: string,
  filename = 'download.txt',
  mime = 'text/plain;charset=utf-8',
): void {
  const blob = new Blob([content], { type: mime });
  downloadBlob(blob, filename);
}

/**
 * Unduh JSON (pretty-printed).
 */
export function downloadJSON(
  data: unknown,
  filename = 'data.json',
): void {
  const json = JSON.stringify(data, null, 2);
  downloadText(json, filename, 'application/json;charset=utf-8');
}

/**
 * Konversi baris objek ke CSV string.
 * - Menggunakan header dari union semua key pada rows
 * - Escape quotes dan separator dengan aturan CSV standar
 * - Opsi penambahan BOM untuk kompatibilitas Excel
 */
export function toCSV(
  rows: Array<Record<string, any>>,
  options?: {
    delimiter?: string; // default ','
    includeHeader?: boolean; // default true
  },
): string {
  const delimiter = options?.delimiter ?? ',';
  const includeHeader = options?.includeHeader ?? true;

  const allKeys = new Set<string>();
  for (const row of rows) {
    Object.keys(row ?? {}).forEach((k) => allKeys.add(k));
  }
  const headers = Array.from(allKeys);

  const escapeCell = (val: any): string => {
    if (val == null) return '';
    const s = String(val);
    const needsQuote =
      s.includes(delimiter) ||
      s.includes('\n') ||
      s.includes('\r') ||
      s.includes('"');
    const escaped = s.replace(/"/g, '""');
    return needsQuote ? `"${escaped}"` : escaped;
  };

  const lines: string[] = [];
  if (includeHeader) {
    lines.push(headers.map(escapeCell).join(delimiter));
  }
  for (const row of rows) {
    const line = headers.map((h) => escapeCell((row ?? {})[h]));
    lines.push(line.join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Unduh CSV dari baris objek.
 * - Menambahkan BOM UTF-8 untuk kompatibilitas Excel
 */
export function downloadCSV(
  rows: Array<Record<string, any>>,
  filename = 'data.csv',
  options?: {
    delimiter?: string;
    includeHeader?: boolean;
    addBom?: boolean; // default true
  },
): void {
  const addBom = options?.addBom ?? true;
  const csv = toCSV(rows, options);
  const BOM = '\uFEFF'; // UTF-8 BOM untuk Excel
  const payload = addBom ? BOM + csv : csv;
  const blob = new Blob([payload], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * Fetch konten dari URL dan unduh sebagai file.
 * Bila header Content-Disposition memiliki filename, akan digunakan.
 */
export async function downloadFromUrl(url: string, filename?: string): Promise<void> {
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const cd = res.headers.get('Content-Disposition') ?? '';
  const nameMatch = cd.match(/filename="?([^"]+)"?/i);
  const resolvedName = safeFilename(filename ?? nameMatch?.[1] ?? 'download');
  const contentType = res.headers.get('Content-Type') ?? 'application/octet-stream';
  const blob = await res.blob();
  // Gunakan type dari response untuk hint
  const typedBlob = new Blob([blob], { type: contentType });
  downloadBlob(typedBlob, resolvedName);
}