import { Injectable, BadRequestException } from '@nestjs/common';
import { Parser } from 'json2csv';

@Injectable()
export class ExportService {
  /**
   * Export arbitrary array of objects to CSV string using json2csv Parser.
   * - If fields are not provided, use the keys from the first object in the array.
   * - Throws BadRequestException on invalid input or conversion errors.
   */
  async exportToCSV<T>(data: T[], fields?: string[]): Promise<string> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new BadRequestException('No data provided for CSV export');
      }

      const resolvedFields =
        fields && fields.length > 0
          ? fields
          : Object.keys(data[0] as Record<string, unknown>);

      const parser = new Parser({ fields: resolvedFields });
      const csv = parser.parse(data as any[]);
      return csv;
    } catch (error: any) {
      // Normalize json2csv errors into HTTP 400
      throw new BadRequestException(
        `Failed to export CSV: ${error?.message ?? 'Unknown error'}`,
      );
    }
  }

  /**
   * Stub for PDF export.
   * Logs a warning and returns a mock Buffer.
   * TODO: Implement real PDF export using pdfkit or puppeteer in the future.
   */
  async exportToPDF<T>(data: T[], title: string): Promise<Buffer> {
    // TODO: Implement real PDF export using pdfkit atau puppeteer/Playwright untuk generate dari HTML template
    // Stub implementation for now:
    // eslint-disable-next-line no-console
    console.warn('PDF export not yet implemented');
    return Buffer.from('PDF export coming soon');
  }

  /**
   * Resolve MIME type for the given format.
   */
  getContentType(format: 'csv' | 'pdf'): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'pdf':
        return 'application/pdf';
      default:
        // Should never happen due to union type, but keep safe fallback
        return 'application/octet-stream';
    }
  }

  /**
   * Resolve file extension for the given format.
   */
  getFileExtension(format: 'csv' | 'pdf'): string {
    switch (format) {
      case 'csv':
        return '.csv';
      case 'pdf':
        return '.pdf';
      default:
        return '';
    }
  }
}
