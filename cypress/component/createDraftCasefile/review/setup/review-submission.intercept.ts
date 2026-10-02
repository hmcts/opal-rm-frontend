import { REVIEW_SUBMISSION_ERROR, REVIEW_SUBMISSION_RECEIPT } from '../mocks/review.mock';

export const REVIEW_SUBMISSION_URL = '/opal-maintenance-service/draft-casefiles';

export function interceptReviewSubmission(statusCode = 201): void {
  cy.intercept('POST', REVIEW_SUBMISSION_URL, {
    statusCode,
    body: structuredClone(statusCode === 201 ? REVIEW_SUBMISSION_RECEIPT : REVIEW_SUBMISSION_ERROR),
  }).as('draftCasefilePost');
}
