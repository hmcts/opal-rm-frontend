import type { IOpalMaintenanceCasefileSubmissionResult } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-casefile-submission-result.interface';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-applicant-organisation/mocks/cases-create-casefile-applicant-organisation.mock';
import type { CasesCreateCasefileCreditorAssignment } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-creditor-assignment.type';
import { SUMMARY_CREDITORS } from '../../orderTermsSummary/mocks/order-terms-summary.mock';
import { createCasesCreateCasefileReviewState } from 'src/app/flows/cases/cases-create-casefile/mocks/cases-create-casefile-review-state.mock';
import type { IOpalMaintenanceCountryReferenceDataItem } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-item.interface';
import type { IOpalMaintenanceApplicationReferenceDataItem } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-item.interface';

export const REVIEW_COUNTRIES: IOpalMaintenanceCountryReferenceDataItem[] = [
  { country_id: 1, cjs_code: 1, country_name: 'Test country', date_used_from: '2020-01-01', active: true },
];
export const REVIEW_APPLICATIONS: IOpalMaintenanceApplicationReferenceDataItem[] = [
  {
    application_id: 901,
    application_code: 'TEST',
    application_title: 'Synthetic application',
    application_group: 'Test',
    active: true,
  },
];
export function createCompleteReviewState() {
  const state = createCasesCreateCasefileReviewState();
  state.centralAuthorityDetails = {
    remoReference: 'TEST-REMO',
    centralAuthorityReference: 'TEST-CA',
    majorCreditor: null,
  };
  state.commentsAndNotes = { comment: 'Synthetic review comment', note: 'Synthetic review note' };
  state.respondentDetails!.restrictedInformation = { restricted: true, reason: 'Synthetic restriction' };
  return state;
}

export function createRemoOutReviewState() {
  const state = createCompleteReviewState();
  state.caseTypeSelection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT };
  return state;
}

export function createOrganisationReviewState() {
  const state = createCompleteReviewState();
  state.caseTypeSelection = {
    caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
    applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
  };
  state.applicantDetails = structuredClone(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedNonUk);
  state.applicantDetails.contactDetails.address.countryId = REVIEW_COUNTRIES[0].country_id;
  return state;
}

export function createMixedCreditorReviewState() {
  const state = createCompleteReviewState();
  state.minorCreditors = structuredClone(SUMMARY_CREDITORS);
  for (const creditor of state.minorCreditors) creditor.details.address.countryId = REVIEW_COUNTRIES[0].country_id;
  const assignments: CasesCreateCasefileCreditorAssignment[] = [
    { type: 'applicant' },
    { type: 'major', majorCreditorId: 1, displayName: 'Synthetic major creditor' },
    { type: 'minor', sequenceNumber: 1 },
    { type: 'minor', sequenceNumber: 2 },
    { type: 'minor', sequenceNumber: 1 },
    { type: 'minor', sequenceNumber: 3 },
  ];
  const original = state.orderTerms[0];
  state.orderTerms = assignments.map((creditor, index) => ({
    ...structuredClone(original),
    termId: index + 1,
    creditor,
  }));
  state.nextOrderTermId = 7;
  state.nextMinorCreditorSequence = 4;
  return state;
}

export const REVIEW_SUBMISSION_RESULT: IOpalMaintenanceCasefileSubmissionResult = {
  draft_casefile_id: 'synthetic-submitted-casefile',
};
