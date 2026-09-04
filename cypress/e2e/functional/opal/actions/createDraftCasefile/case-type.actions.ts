import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { PrimaryNavigationLocators as Navigation } from 'cypress/shared/selectors/primary-navigation.locators';
import { createScopedLogger } from 'cypress/support/utils/log.helper';

const log = createScopedLogger('CaseTypeActions');

/** Opens and completes the Draft Casefile type page for REMO In and an Individual applicant. */
export class CaseTypeActions {
  /** Starts the agreed case path from the authenticated Cases dashboard. */
  public startRemoInIndividual(): void {
    log('action', 'Starting a REMO In case with an Individual applicant');
    cy.contains(Navigation.items, Navigation.labels.cases).should('be.visible').click();
    cy.location('pathname').should('eq', '/dashboard/cases');
    cy.get(Page.dashboard.createCasefileLink, { timeout: 20_000 }).should('be.visible').click();
    cy.location('pathname').should('eq', '/cases/create-casefile/case-type');
    cy.get(Page.caseTypeRadio('REMO In')).check();
    cy.get(Page.applicantType).select('Individual');
    cy.get(Page.continueButton).click();
    cy.location('pathname').should('eq', '/cases/create-casefile/task-list');
  }
}
