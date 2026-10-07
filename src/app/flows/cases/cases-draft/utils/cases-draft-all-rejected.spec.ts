import { expect, it } from 'vitest';
import {
  defaultAllRejectedSelection,
  validAllRejectedSelection,
  decodeAllRejectedSuccess,
} from './cases-draft-all-rejected';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftResubmissionSuccess } from '../interfaces/cases-draft-resubmission-success.interface';
it('starts at the oldest rejection and validates all six columns', () => {
  expect(defaultAllRejectedSelection()).toEqual({ page: 1, sort: 'statusDate', direction: 'ascending' });
  expect(validAllRejectedSelection({ page: 2, sort: 'submittedByName', direction: 'descending' })).toBe(true);
  expect(validAllRejectedSelection({ page: 0, sort: 'created', direction: 'ascending' })).toBe(false);
});
it('accepts separate respondent names only in the same authorised identity', () => {
  const identity: ICasesDraftIdentity = { userId: 100, businessUnitId: 44, submittedBy: 'BUU-SYNTHETIC' };
  const event: ICasesDraftResubmissionSuccess = {
    origin: 'all-rejected',
    identity,
    draftCasefileId: 123,
    respondentForename: 'Synthetic',
    respondentSurname: 'Respondent',
  };
  expect(decodeAllRejectedSuccess(event, identity)).toEqual(event);
  expect(decodeAllRejectedSuccess(event, { ...identity, submittedBy: 'BUU-OTHER' })).toBeNull();
  expect(decodeAllRejectedSuccess({ ...event, respondentSurname: ' ' }, identity)).toBeNull();
  expect(decodeAllRejectedSuccess({ success: true }, identity)).toBeNull();
});

const identity: ICasesDraftIdentity = { userId: 100, businessUnitId: 44, submittedBy: 'BUU-SYNTHETIC' };
const event = {
  origin: 'all-rejected',
  identity,
  draftCasefileId: 123,
  respondentForename: ' Synthetic ',
  respondentSurname: ' Respondent ',
};
it.each(['respondent', 'applicant', 'caseType', 'submittedByName', 'created', 'statusDate'] as const)(
  'allows sorting by %s',
  (sort) => {
    expect(validAllRejectedSelection({ page: 1, sort, direction: 'ascending' })).toBe(true);
  },
);
it.each([0, -1, 1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid page %s', (page) => {
  expect(validAllRejectedSelection({ page, sort: 'created', direction: 'descending' })).toBe(false);
});
it('rejects unsupported columns and directions at runtime', () => {
  expect(
    validAllRejectedSelection({ page: 1, sort: 'unsupported', direction: 'ascending' } as unknown as Parameters<
      typeof validAllRejectedSelection
    >[0]),
  ).toBe(false);
  expect(
    validAllRejectedSelection({ page: 1, sort: 'created', direction: 'unsupported' } as unknown as Parameters<
      typeof validAllRejectedSelection
    >[0]),
  ).toBe(false);
});
it.each([
  null,
  [],
  'success',
  {},
  { ...event, origin: 'dashboard' },
  { ...event, identity: null },
  { ...event, identity: [] },
  { ...event, identity: { ...identity, userId: 101 } },
  { ...event, identity: { ...identity, businessUnitId: 45 } },
  { ...event, identity: { ...identity, submittedBy: 'OTHER' } },
  { ...event, draftCasefileId: undefined },
  { ...event, draftCasefileId: '123' },
  { ...event, draftCasefileId: 0 },
  { ...event, draftCasefileId: -1 },
  { ...event, draftCasefileId: 1.5 },
  { ...event, draftCasefileId: NaN },
  { ...event, draftCasefileId: Infinity },
  { ...event, draftCasefileId: Number.MAX_SAFE_INTEGER + 1 },
  { ...event, respondentForename: null },
  { ...event, respondentForename: ' ' },
  { ...event, respondentSurname: undefined },
  { ...event, respondentSurname: ' ' },
])('rejects malformed or foreign success event %j', (value) => {
  expect(decodeAllRejectedSuccess(value, identity)).toBeNull();
});
it('requires an authorised identity and copies trimmed names into a fresh event', () => {
  expect(decodeAllRejectedSuccess(event, null)).toBeNull();
  const decoded = decodeAllRejectedSuccess(event, identity)!;
  expect(decoded).toEqual({ ...event, respondentForename: 'Synthetic', respondentSurname: 'Respondent' });
  expect(decoded.identity).not.toBe(identity);
});
