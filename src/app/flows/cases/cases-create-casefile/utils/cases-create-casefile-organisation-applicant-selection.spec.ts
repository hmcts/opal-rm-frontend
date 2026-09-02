import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { isCasesCreateCasefileOrganisationApplicantSelection } from './cases-create-casefile-organisation-applicant-selection';

describe('isCasesCreateCasefileOrganisationApplicantSelection', () => {
  it.each([
    [
      'REMO In Organisation',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
      },
      true,
    ],
    [
      'REMO In Individual',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
      false,
    ],
    ['REMO Out', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT }, false],
    ['REMO Out (CMS)', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS }, false],
    ['null', null, false],
    ['malformed REMO In', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN }, false],
  ])('returns the expected result for %s', (_description, selection, expected) => {
    expect(isCasesCreateCasefileOrganisationApplicantSelection(selection)).toBe(expected);
  });
});
