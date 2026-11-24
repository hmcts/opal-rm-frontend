import { DateTime } from 'luxon';
import type {
  RespondentAccountAtAGlance,
  RespondentAccountHeaderSummary,
} from '../interfaces/opal-maintenance-respondent-account.interface';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveId(value: unknown): boolean {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'boolean';
}

function isNonBlankString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalDate(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value, { zone: 'utc' }).isValid)
  );
}

function isName(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonBlankString(value['surname']) &&
    isOptionalString(value['title']) &&
    isOptionalString(value['forenames'])
  );
}

function isAccountResponse(value: unknown, accountId: number): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    value['respondentAccountId'] === accountId &&
    isNonBlankString(value['version']) &&
    value['enforcementStatus'] === null
  );
}

function isAccountStatus(value: unknown): boolean {
  return (
    isRecord(value) &&
    ((value['code'] === 'L' && value['display'] === 'Live') ||
      (value['code'] === 'C' && value['display'] === 'Completed'))
  );
}

function isOptionalAddress(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  return (
    isRecord(value) &&
    Array.isArray(value['lines']) &&
    value['lines'].length <= 5 &&
    value['lines'].every((line: unknown) => typeof line === 'string') &&
    isOptionalString(value['postcode']) &&
    isOptionalString(value['country'])
  );
}

function isRespondentSummary(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const age = value['age'];
  return (
    isName(value['name']) &&
    isOptionalDate(value['dateOfBirth']) &&
    (age === undefined ||
      (typeof value['dateOfBirth'] === 'string' && typeof age === 'number' && Number.isSafeInteger(age) && age >= 0)) &&
    isOptionalAddress(value['address']) &&
    isOptionalString(value['mainEmail']) &&
    isOptionalBoolean(value['restricted'])
  );
}

function isOptionalApplicant(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!isRecord(value) || !isPositiveId(value['accountId']) || !isOptionalString(value['accountNumber'])) return false;
  if (value['kind'] === 'individual') return isName(value['name']) && isOptionalBoolean(value['restricted']);
  return value['kind'] === 'organisation' && isNonBlankString(value['organisationName']);
}

const caseTypes: readonly unknown[] = ['REMO In', 'REMO Out', 'REMO Out (CMS)', null];

export function isRespondentAccountHeaderSummary(
  value: unknown,
  accountId: number,
): value is RespondentAccountHeaderSummary {
  return (
    isAccountResponse(value, accountId) &&
    isPositiveId(value['respondentAccountPartyId']) &&
    isPositiveId(value['partyId']) &&
    isPositiveId(value['businessUnitId']) &&
    isNonBlankString(value['accountNumber']) &&
    value['accountType'] === 'Respondent' &&
    isName(value['name']) &&
    caseTypes.includes(value['caseType']) &&
    Number.isFinite(value['arrears']) &&
    Number.isFinite(value['balance']) &&
    isOptionalDate(value['arrearsUpdatedDate']) &&
    isAccountStatus(value['accountStatus']) &&
    value['hasOutstandingCaseHearing'] === false
  );
}

export function isRespondentAccountAtAGlance(value: unknown, accountId: number): value is RespondentAccountAtAGlance {
  return (
    isAccountResponse(value, accountId) &&
    isRespondentSummary(value['respondent']) &&
    isOptionalApplicant(value['applicant']) &&
    isOptionalString(value['comment']) &&
    isOptionalString(value['authorityReference'])
  );
}
