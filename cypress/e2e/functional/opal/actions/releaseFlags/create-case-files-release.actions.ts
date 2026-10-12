import { ReleaseFlagsSelectors as S } from '../../../../../shared/selectors/release-flags.selectors';
import { CreateCasefileSelectors } from '../../../../../shared/selectors/create-casefile.selectors';

/** Exercises release access through the deployed application's public routes. */
export class CreateCaseFilesReleaseActions {
  /**
   * Opens a route without changing the environment's release configuration.
   * @param path The application route to visit.
   */
  public openPath(path: string): void {
    cy.visit(path);
  }

  /** Confirms the sole released section and its journey entry point. */
  public assertCasesOnly(): void {
    cy.location('pathname').should('eq', '/dashboard/cases');
    cy.get(S.primaryNavigationLink).should('have.length', 1).and('contain.text', 'Cases');
    cy.get(S.createCaseLink).should('be.visible');
  }

  /** Enters case creation from the dashboard. */
  public followCreateCase(): void {
    cy.get(S.createCaseLink).click();
  }

  /** Confirms the actual journey entry page has loaded. */
  public assertCaseType(): void {
    cy.location('pathname').should('eq', '/cases/create-casefile/case-type');
    cy.get(CreateCasefileSelectors.caseTypeHeading).should('be.visible').and('contain.text', 'Create a case');
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Confirms an unavailable section does not expose other navigation sections. */
  public assertUnreleasedSectionDenied(): void {
    this.assertDeniedPage();
    cy.get(S.primaryNavigationLink).should('have.length', 1).and('contain.text', 'Cases');
  }

  /** Confirms the denied page exposes neither navigation nor case creation. */
  public assertAccessDenied(): void {
    this.assertDeniedPage();
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Checks the denial outcome shared by enabled and disabled release states. */
  private assertDeniedPage(): void {
    cy.location('pathname').should('eq', '/access-denied');
    cy.get(S.heading).should('be.visible').and('contain.text', 'Access Denied');
    cy.get(S.createCaseLink).should('not.exist');
  }

  /** Repeats initial navigation at the current URL. */
  public refresh(): void {
    cy.reload();
  }

  /** Exercises the no-release fallback from the denied page. */
  public returnToDashboard(): void {
    cy.contains('button', 'Back to dashboard').click();
  }
}
