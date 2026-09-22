import type { CasesCreateCasefileReviewIssue } from '../types/cases-create-casefile-review-issue.type';

/** Provisional local-mock content; exact AC2 copy still requires product confirmation. */
export const CASES_CREATE_CASEFILE_REVIEW_ERRORS: Record<
  CasesCreateCasefileReviewIssue,
  { text: string; target: string }
> = {
  caseType: { text: 'Choose a valid case type.', target: 'review-caseType' },
  authority: { text: 'Local mock submission is not available for this session.', target: 'review-heading' },
  respondent: { text: 'Check and complete the respondent details.', target: 'review-respondent' },
  applicant: { text: 'Check and complete the applicant details.', target: 'review-applicant' },
  orderDetails: { text: 'Check and complete the order details.', target: 'review-orderDetails' },
  orderTerms: { text: 'Check the order terms and their creditors.', target: 'review-orderTerms' },
  interestAndIndexation: {
    text: 'Check and complete interest and indexation.',
    target: 'review-interestAndIndexation',
  },
  managingPayments: { text: 'Check and complete managing payments.', target: 'review-managingPayments' },
  editing: { text: 'Finish the current correction before submitting.', target: 'review-heading' },
};
