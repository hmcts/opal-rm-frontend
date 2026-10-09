import { CASES_DRAFT_ALL_REJECTED } from '../constants/cases-draft-all-rejected.constant';
import type { ICasesDraftAllRejectedSelection } from '../interfaces/cases-draft-all-rejected-selection.interface';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftResubmissionSuccess } from '../interfaces/cases-draft-resubmission-success.interface';

export function defaultAllRejectedSelection(): ICasesDraftAllRejectedSelection {
  return { page: 1, sort: 'statusDate', direction: 'ascending' };
}
export function validAllRejectedSelection(selection: ICasesDraftAllRejectedSelection): boolean {
  const columns: readonly string[] = CASES_DRAFT_ALL_REJECTED.columns;
  return (
    Number.isSafeInteger(selection.page) &&
    selection.page > 0 &&
    columns.includes(selection.sort) &&
    ['ascending', 'descending'].includes(selection.direction)
  );
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function matchesIdentity(value: unknown, identity: ICasesDraftIdentity): boolean {
  return (
    record(value) &&
    value['userId'] === identity.userId &&
    value['businessUnitId'] === identity.businessUnitId &&
    value['submittedBy'] === identity.submittedBy
  );
}
function nonEmptyName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
export function decodeAllRejectedSuccess(
  value: unknown,
  identity: ICasesDraftIdentity | null,
): ICasesDraftResubmissionSuccess | null {
  if (!identity || !record(value) || value['origin'] !== 'all-rejected') return null;
  if (!matchesIdentity(value['identity'], identity)) return null;
  const id = value['draftCasefileId'];
  const forename = value['respondentForename'];
  const surname = value['respondentSurname'];
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) return null;
  if (!nonEmptyName(forename) || !nonEmptyName(surname)) return null;
  return {
    origin: 'all-rejected',
    identity: { ...identity },
    draftCasefileId: id,
    respondentForename: forename.trim(),
    respondentSurname: surname.trim(),
  };
}
