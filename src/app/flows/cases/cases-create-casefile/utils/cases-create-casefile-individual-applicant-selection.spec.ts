import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { isCasesCreateCasefileIndividualApplicantSelection } from './cases-create-casefile-individual-applicant-selection';

describe('isCasesCreateCasefileIndividualApplicantSelection', () => {
  it.each([
    [
      'REMO In Individual',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
      true,
    ],
    [
      'REMO In Organisation',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
      },
      false,
    ],
    ['REMO Out', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT }, true],
    ['REMO Out (CMS)', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS }, true],
    ['null', null, false],
    ['malformed', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN }, false],
    [
      'REMO Out with applicant type',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
      false,
    ],
  ])('returns %s => %s', (_description, selection, expected) => {
    expect(isCasesCreateCasefileIndividualApplicantSelection(selection)).toBe(expected);
  });
});
