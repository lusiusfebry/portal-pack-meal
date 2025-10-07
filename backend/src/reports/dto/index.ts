// Re-export all Report DTOs and enums for clean imports
export * from './consumption-report-query.dto';
export * from './department-report-query.dto';
export * from './performance-report-query.dto';
export * from './rejection-report-query.dto';
export * from './audit-trail-query.dto';

// Explicitly re-export enum to satisfy consumers expecting a named export
export { ConsumptionGroupBy } from './consumption-report-query.dto';
