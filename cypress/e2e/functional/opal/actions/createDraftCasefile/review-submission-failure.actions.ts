import type { Interception } from 'cypress/types/net-stubbing';
import type { IOpalMaintenanceDraftCasefileRequest as Request } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CHECK_CASE_DETAILS_SUBMISSION as DATA } from '../../mocks/createDraftCasefile/check-case-details.mock';

/** Proves a definite create rejection keeps the reviewed draft available for correction and retry. */
export class ReviewSubmissionFailureActions {
  /** Captures the visible review and rejects exactly the next create request. */
  public prepare(): void {
    const snapshot: Record<string, string> = {};
    for (const section of [
      'caseType',
      'respondent',
      'applicant',
      'orderDetails',
      'orderTerms',
      'interestAndIndexation',
      'managingPayments',
      'commentsAndNotes',
    ]) {
      cy.get(S.review.section(section))
        .should('be.visible')
        .invoke('text')
        .then((text) => {
          snapshot[section] = text.replace(/\s+/g, ' ').trim();
        });
    }
    cy.then(() => cy.wrap(snapshot, { log: false }).as('reviewBeforeRejection'));
    cy.intercept(
      { method: 'POST', url: '**/opal-maintenance-service/draft-casefiles', times: 1 },
      { statusCode: 400, body: structuredClone(DATA.failure) },
    ).as('rejectedDraftSubmission');
  }

  /** Requires the explicit HTTP rejection and the review's actionable failure state. */
  public assertRejected(): void {
    cy.wait('@rejectedDraftSubmission').then(({ request, response }) => {
      expect(response?.statusCode).to.equal(400);
      cy.wrap(structuredClone(request.body), { log: false }).as('rejectedDraftPayload');
    });
    cy.get(S.review.heading).should('be.visible');
    cy.get(S.globalErrorBanner)
      .should('be.visible')
      .and('contain.text', DATA.failure.title)
      .and('contain.text', DATA.failure.detail);
    cy.get(S.review.submit).should('be.enabled');
    cy.get(S.review.confirmationHeading).should('not.exist');
    cy.get('@draftSubmission.all').should('have.length', 0);
  }

  /** Checks every review section still matches the snapshot taken before rejection. */
  public assertRetainedReview(): void {
    cy.get<Record<string, string>>('@reviewBeforeRejection').then((snapshot) => {
      for (const [section, expected] of Object.entries(snapshot)) {
        cy.get(S.review.section(section))
          .should('be.visible')
          .invoke('text')
          .should((value) => {
            expect(value.replace(/\s+/g, ' ').trim(), section).to.equal(expected);
          });
      }
    });
  }

  /** Proves the accepted retry changed only the corrected respondent's forenames. */
  public assertCorrectedRetry(): void {
    cy.get<Request>('@rejectedDraftPayload').then((original) => {
      const expected = structuredClone(original);
      const individual = expected.casefile.respondent_account.respondent.party_details.individual_details;
      if (!individual) throw new Error('Recovery fixture requires an individual respondent');
      individual.forenames = 'Corrected synthetic';
      cy.get<Interception[]>('@draftSubmission.all')
        .should('have.length', 1)
        .then(([call]) => {
          expect(call.response?.statusCode).to.equal(201);
          expect(call.request.body).to.deep.equal(expected);
        });
    });
    cy.get('@rejectedDraftSubmission.all').should('have.length', 1);
    cy.get(S.globalErrorBanner).should('not.exist');
  }
}
