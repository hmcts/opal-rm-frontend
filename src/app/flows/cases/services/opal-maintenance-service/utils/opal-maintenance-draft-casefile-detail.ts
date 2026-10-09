import { DateTime } from 'luxon';
import type { IOpalMaintenanceDraftCasefileDetail } from '../interfaces/opal-maintenance-draft-casefile-detail.interface';

const ERROR = 'Unusable draft casefile data';
function assert(condition: boolean): asserts condition {
  if (!condition) throw new Error(ERROR);
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function record(value: unknown): Record<string, unknown> {
  assert(isRecord(value));
  return value;
}
function text(value: unknown): asserts value is string {
  assert(typeof value === 'string');
}
function nonblank(value: unknown): void {
  text(value);
  assert(value.trim().length > 0);
}
function positive(value: unknown): void {
  assert(typeof value === 'number' && Number.isSafeInteger(value) && value > 0);
}
function boolean(value: unknown): void {
  assert(typeof value === 'boolean');
}
function member(value: unknown, allowed: readonly string[]): void {
  text(value);
  assert(allowed.includes(value));
}
function strings(value: Record<string, unknown>, keys: readonly string[], nullable = false): void {
  for (const key of keys) {
    const item = value[key];
    if (item === undefined || (nullable && item === null)) continue;
    text(item);
  }
}
function requiredStrings(value: Record<string, unknown>, keys: readonly string[]): void {
  for (const key of keys) nonblank(value[key]);
}
function array(value: unknown): unknown[] {
  assert(Array.isArray(value));
  return value;
}
function date(value: unknown, utc = false): void {
  text(value);
  const pattern = utc ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/ : /^\d{4}-\d{2}-\d{2}$/;
  assert(pattern.test(value) && DateTime.fromISO(value, { setZone: true }).isValid);
}
function address(value: unknown): void {
  const item = record(value);
  nonblank(item['address_line_1']);
  assert(typeof item['cjs_code'] === 'number' && Number.isSafeInteger(item['cjs_code']));
  strings(item, ['address_line_2', 'address_line_3', 'address_line_4', 'address_line_5', 'postcode']);
}
function individual(value: unknown): void {
  const item = record(value);
  nonblank(item['surname']);
  strings(item, [
    'title',
    'forenames',
    'national_insurance_number',
    'other_personal_information',
    'restriction_reason',
  ]);
  if (item['date_of_birth'] !== undefined) date(item['date_of_birth']);
  if (item['restrict_personal_information'] !== undefined) boolean(item['restrict_personal_information']);
}
function party(value: unknown, applicant = false): void {
  const item = record(value);
  boolean(item['organisation']);
  if (item['organisation']) {
    const organisation = record(item['organisation_details']);
    nonblank(organisation['organisation_name']);
    strings(organisation, ['foreign_authority_reference']);
    if (applicant) nonblank(organisation['foreign_authority_reference']);
    assert(item['individual_details'] === undefined);
  } else {
    individual(item['individual_details']);
    assert(item['organisation_details'] === undefined);
  }
  address(item['address']);
  if (item['contact_details'] !== undefined) {
    strings(record(item['contact_details']), [
      'primary_email_address',
      'secondary_email_address',
      'main_telephone_number',
      'other_telephone_number',
    ]);
  }
  if (item['aliases'] !== undefined) {
    for (const entry of array(item['aliases'])) {
      const alias = record(entry);
      positive(alias['sequence_number']);
      text(alias['forenames']);
      nonblank(alias['surname']);
    }
  }
}
function thirdParty(value: unknown): void {
  if (value === undefined) return;
  const item = record(value);
  requiredStrings(item, ['name', 'relationship']);
  strings(item, ['reference']);
  address(item['address']);
}
function bank(value: unknown): void {
  const item = record(value);
  member(item['bank_account_type'], ['UK Bank', 'Non-UK Bank', 'None or not applicable']);
  if (item['bank_account_type'] === 'UK Bank') {
    requiredStrings(record(item['uk_bank_details']), [
      'account_name',
      'sort_code',
      'account_number',
      'payment_reference',
    ]);
    assert(item['non_uk_bank_details'] === undefined);
  } else if (item['bank_account_type'] === 'Non-UK Bank') {
    const details = record(item['non_uk_bank_details']);
    requiredStrings(details, ['account_name', 'payment_reference']);
    strings(details, ['bic_or_swift_code', 'iban', 'bank_name', 'branch_code_or_sort_code', 'account_number']);
    assert(item['uk_bank_details'] === undefined);
  } else {
    assert(item['uk_bank_details'] === undefined && item['non_uk_bank_details'] === undefined);
  }
}
function respondent(value: unknown): void {
  const item = record(value);
  party(item['party_details']);
  thirdParty(item['third_party_details']);
  if (item['debtor_details'] !== undefined) {
    const employer = record(item['debtor_details']);
    nonblank(employer['employer_name']);
    strings(employer, ['employee_reference', 'employer_email_address', 'employer_telephone_number']);
    address(employer['employer_address']);
  }
}
function term(value: unknown): void {
  const item = record(value);
  nonblank(item['result_id']);
  member(item['creditor_type'], ['Applicant', 'Minor Creditor', 'Major Creditor']);
  if (item['creditor_type'] === 'Minor Creditor') positive(item['minor_creditor_sequence']);
  if (item['creditor_type'] === 'Major Creditor') nonblank(item['major_creditor_code']);
  assert(item['creditor_type'] === 'Minor Creditor' || item['minor_creditor_sequence'] === undefined);
  assert(item['creditor_type'] === 'Major Creditor' || item['major_creditor_code'] === undefined);
  for (const entry of array(item['result_responses'])) {
    const response = record(entry);
    nonblank(response['parameter_name']);
    text(response['response']);
  }
}
function order(value: unknown): void {
  const item = record(value);
  date(item['date_ordered']);
  date(item['date_arrears_last_updated']);
  boolean(item['interest_flag']);
  member(item['indexation'], ['RPI', 'CPI', 'Other', 'None']);
  member(item['payment_arrangement'], ['Court', 'Direct']);
  member(item['payment_period'], ['Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Yearly']);
  const terms = array(item['order_terms']);
  assert(terms.length > 0);
  terms.forEach(term);
}
function business(value: unknown, unit: unknown, type: unknown): void {
  const item = record(value);
  const account = record(item['respondent_account']);
  assert(account['business_unit_id'] === unit && account['casefile_type'] === type);
  nonblank(account['application_code']);
  strings(account, [
    'originator_name',
    'remo_reference',
    'central_authority_code',
    'central_authority_reference',
    'account_comment',
  ]);
  if (account['notes'] !== undefined) text(record(account['notes'])['note_text']);
  respondent(account['respondent']);
  order(account['order_details']);
  const applicant = record(item['applicant']);
  party(applicant['party_details'], true);
  thirdParty(applicant['third_party_details']);
  bank(applicant['bank_account_details']);
  if (item['minor_creditors'] !== undefined) {
    for (const entry of array(item['minor_creditors'])) {
      const minor = record(entry);
      positive(minor['creditor_sequence']);
      party(minor['party_details']);
      bank(minor['bank_account_details']);
    }
  }
}
function snapshotAccount(value: unknown, name: string): void {
  const item = record(value);
  if (item['account_id'] !== null) positive(item['account_id']);
  if (item['account_number'] !== null) text(item['account_number']);
  text(item[name]);
}
function snapshot(value: unknown): void {
  const item = record(value);
  snapshotAccount(item['respondent_account'], 'respondent_name');
  snapshotAccount(item['applicant_account'], 'applicant_name');
  for (const entry of array(item['minor_creditor_accounts'])) {
    const minor = record(entry);
    positive(minor['creditor_sequence']);
    snapshotAccount(minor, 'name');
  }
}
function timeline(value: unknown): void {
  const entries = array(value);
  assert(entries.length > 0);
  for (const entry of entries) {
    const item = record(entry);
    text(item['username']);
    member(item['status'], ['Submitted', 'Resubmitted', 'Rejected', 'Approved', 'Deleted']);
    date(item['status_date'], true);
    strings(item, ['reason_text'], true);
  }
}
function isDetail(body: unknown, requestedId: number): body is IOpalMaintenanceDraftCasefileDetail {
  const item = record(body);
  positive(item['draft_casefile_id']);
  positive(item['business_unit_id']);
  assert(item['draft_casefile_id'] === requestedId);
  member(item['casefile_type'], ['REMO In', 'REMO Out', 'REMO Out (CMS)']);
  member(item['casefile_status'], [
    'SUBMITTED',
    'RESUBMITTED',
    'REJECTED',
    'PUBLISHING_PENDING',
    'PUBLISHED',
    'PUBLISHING_FAILED',
    'DELETED',
  ]);
  requiredStrings(item, ['submitted_by', 'submitted_by_name', 'casefile_status_name']);
  date(item['created_date'], true);
  date(item['casefile_status_date'], true);
  strings(item, ['validated_by', 'validated_by_name', 'status_message'], true);
  if (item['validated_date'] !== undefined && item['validated_date'] !== null) date(item['validated_date'], true);
  business(item['casefile'], item['business_unit_id'], item['casefile_type']);
  snapshot(item['casefile_snapshot']);
  timeline(item['timeline_data']);
  return true;
}

/** Validates the selected resource before it can hydrate editable state; errors never include provider data. */
export function decodeDraftCasefileDetail(
  body: unknown,
  etag: string | null,
  requestedId: number,
): { draft: IOpalMaintenanceDraftCasefileDetail; etag: string } {
  assert(typeof etag === 'string' && /^"\d+"$/.test(etag));
  assert(isDetail(body, requestedId));
  return { draft: body, etag };
}
