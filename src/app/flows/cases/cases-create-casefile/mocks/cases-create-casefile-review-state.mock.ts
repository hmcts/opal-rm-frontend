import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS } from '../cases-create-casefile-respondent-details/mocks/cases-create-casefile-respondent-details.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../cases-create-casefile-applicant-individual/mocks/cases-create-casefile-applicant-individual.mock';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';

export function createCasesCreateCasefileReviewState(): ICasesCreateCasefileState {
  return structuredClone({
    ...CASES_CREATE_CASEFILE_STATE,
    caseTypeSelection: { caseType: 'REMO In', applicantType: 'Individual' },
    respondentDetails: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved,
    applicantDetails: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved,
    orderDetails: {
      applicationId: 901,
      court: null,
      dateOrderMade: null,
      paymentFrequency: 'Monthly',
      dateArrearsLastUpdated: '2026-09-15',
    },
    orderTerms: [
      {
        termId: 1,
        resultId: 'TEST01',
        parameters: { amount: '100.00' },
        creditor: { type: 'applicant' },
        presentation: {
          title: 'Synthetic maintenance',
          fields: [{ name: 'amount', label: 'Amount', kind: 'money', options: [] }],
        },
      },
    ],
    nextOrderTermId: 2,
    currentOrderTermId: 1,
    interestAndIndexation: { interestApplies: false, indexationType: 'NONE' },
    paymentArrangement: 'court',
    stateChanges: true,
    taskStatuses: {
      ...CASES_CREATE_CASEFILE_STATE.taskStatuses,
      respondent: 'Provided',
      applicant: 'Provided',
      orderDetails: 'Provided',
      orderTerms: 'Provided',
      interestAndIndexation: 'Provided',
      managingPayments: 'Provided',
    },
  });
}
