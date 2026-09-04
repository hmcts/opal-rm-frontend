import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { createScopedLogger } from 'cypress/support/utils/log.helper';

const log = createScopedLogger('CaseDetailsActions');

/** Interacts with the party-detail tasks on the Draft Casefile task list. */
export class CaseDetailsActions {
  /** Opens the Respondent details task after observing the real active Countries request. */
  public openRespondentAndObserveCountries(): void {
    log('action', 'Opening Respondent details and observing active Countries');
    cy.intercept({
      method: 'GET',
      pathname: '/opal-maintenance-service/countries',
      query: { active: 'true' },
    }).as('getActiveCountries');
    cy.get(Page.caseDetails.respondentLink).should('be.visible').click();
  }

  /** Opens the Individual Applicant details task. */
  public openApplicant(): void {
    log('action', 'Opening Applicant details');
    cy.get(Page.caseDetails.applicantLink).should('be.visible').click();
  }

  /** Verifies that both required party tasks show their provided status. */
  public assertMandatoryPartyTasksProvided(): void {
    log('assert', 'Checking that Respondent and Applicant tasks are provided');
    cy.get(Page.caseDetails.respondentStatus)
      .should('be.visible')
      .invoke('text')
      .then((text) => expect(text.trim(), 'Respondent task status').to.equal('Provided'));
    cy.get(Page.caseDetails.applicantStatus)
      .should('be.visible')
      .invoke('text')
      .then((text) => expect(text.trim(), 'Applicant task status').to.equal('Provided'));
  }
}
