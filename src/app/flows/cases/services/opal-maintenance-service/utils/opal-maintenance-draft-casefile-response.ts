import { DateTime } from 'luxon';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../../../cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import type { IOpalMaintenanceDraftCasefileCountResponse } from '../interfaces/opal-maintenance-draft-casefile-count-response.interface';
import type { IOpalMaintenanceDraftCasefileListResponse } from '../interfaces/opal-maintenance-draft-casefile-list-response.interface';
import type { IOpalMaintenanceDraftCasefileSnapshot } from '../interfaces/opal-maintenance-draft-casefile-snapshot.interface';
import type { IOpalMaintenanceDraftCasefileSummary } from '../interfaces/opal-maintenance-draft-casefile-summary.interface';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

function isOptionalAccount(value: unknown, nameKey?: string): boolean {
  if (value === undefined || value === null) return true;
  if (!isRecord(value) || !isOptionalString(value['account_number'])) return false;
  if (nameKey === undefined) return true;
  return value[nameKey] === undefined || typeof value[nameKey] === 'string';
}

function isMinorCreditors(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!Array.isArray(value)) return false;
  return value.every(
    (account: unknown) =>
      isRecord(account) &&
      isOptionalAccount(account) &&
      (account['creditor_sequence'] === undefined || positiveInteger(account['creditor_sequence'])),
  );
}

function isSnapshot(value: unknown): value is IOpalMaintenanceDraftCasefileSnapshot {
  return (
    isRecord(value) &&
    isOptionalAccount(value['respondent_account'], 'respondent_name') &&
    isOptionalAccount(value['applicant_account'], 'applicant_name') &&
    isMinorCreditors(value['minor_creditor_accounts'])
  );
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.includes('T') && DateTime.fromISO(value, { setZone: true }).isValid;
}

function hasSummaryIdentity(value: Record<string, unknown>): boolean {
  return (
    positiveInteger(value['draft_casefile_id']) &&
    positiveInteger(value['business_unit_id']) &&
    typeof value['submitted_by'] === 'string' &&
    value['submitted_by'].trim().length > 0
  );
}

function hasSummaryDates(value: Record<string, unknown>): boolean {
  const validated = value['validated_date'];
  return (
    isIsoTimestamp(value['created_date']) &&
    isIsoTimestamp(value['casefile_status_date']) &&
    (validated === undefined || validated === null || isIsoTimestamp(validated))
  );
}

function isSummary(value: unknown): value is IOpalMaintenanceDraftCasefileSummary {
  if (!isRecord(value) || !hasSummaryIdentity(value) || !hasSummaryDates(value)) return false;
  const statuses: readonly unknown[] = [
    'SUBMITTED',
    'RESUBMITTED',
    'REJECTED',
    'PUBLISHING_PENDING',
    'PUBLISHED',
    'PUBLISHING_FAILED',
    'DELETED',
  ];
  const types: readonly unknown[] = Object.values(CASES_CREATE_CASEFILE_CASE_TYPES);
  return (
    statuses.includes(value['casefile_status']) &&
    types.includes(value['casefile_type']) &&
    isOptionalString(value['submitted_by_name']) &&
    isSnapshot(value['casefile_snapshot'])
  );
}

/** Rejects malformed counts-only responses without inventing a zero count. */
export function decodeDraftCasefileCount(value: unknown): IOpalMaintenanceDraftCasefileCountResponse {
  if (!isRecord(value) || !isCount(value['count'])) throw new Error('Invalid draft casefile count response');
  return { count: value['count'] };
}

/** Validates the collection independently of the POST contract, preserving the provider count. */
export function decodeDraftCasefileList(value: unknown): IOpalMaintenanceDraftCasefileListResponse {
  if (
    !isRecord(value) ||
    !isCount(value['count']) ||
    !Array.isArray(value['summaries']) ||
    !value['summaries'].every(isSummary)
  ) {
    throw new Error('Invalid draft casefile list response');
  }
  return { count: value['count'], summaries: value['summaries'] };
}
