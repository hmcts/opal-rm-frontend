import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';

/** Verifies live permission rejection for the protected casefile tasks. */
export class CasefilePermissionsActions {
  /** Proves released entry is available before testing denial. */
  public assertReleasedEntry(): void {
    cy.visit('/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get(S.caseTypeHeading).should('be.visible');
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.caseType);
  }

  /**
   * Navigates to a supported task without injecting journey state.
   * @param path Protected task route covered by the shared outline.
   * @throws If the supplied path is unsupported.
   */
  public openTask(path: string): void {
    const tasks = [
      PATHS.children.respondentDetails,
      PATHS.children.applicantIndividual,
      PATHS.children.applicantOrganisation,
      PATHS.children.centralAuthorityDetails,
      PATHS.children.orderDetails,
    ];
    if (!tasks.includes(path)) throw new Error('Unsupported permission-test task route');
    cy.visit('/' + PATHS.root + '/' + path);
  }

  /** Requires Access Denied and verifies that no protected task form is rendered. */
  public assertDenied(): void {
    cy.location('pathname').should('eq', '/access-denied');
    cy.get(S.heading).should('be.visible').and('contain.text', 'Access Denied');
    cy.get(S.respondentDetails.firstNames).should('not.exist');
    cy.get(S.applicantIndividual.firstNames).should('not.exist');
    cy.get(S.applicantOrganisation.organisationName).should('not.exist');
    cy.get(S.centralAuthority.autocomplete).should('not.exist');
    cy.get(S.orderDetails.application).should('not.exist');
  }
}
