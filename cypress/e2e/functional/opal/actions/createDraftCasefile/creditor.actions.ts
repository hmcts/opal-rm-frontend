import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { E2E_CREDITOR_MAJOR_RESPONSE } from '../../mocks/createDraftCasefile/creditor.mock';

/** Drives the creditor page of the Create draft casefile journey. */
export class CreditorActions {
  /** Installs the controlled active non-Central-Authority Major source before route activation. */
  public prepareMajorCreditors(): void {
    cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', {
      body: structuredClone(E2E_CREDITOR_MAJOR_RESPONSE),
    }).as('majorCreditors');
  }

  /** Checks the creditor route and its resolver query. */
  public assertReady(): void {
    cy.wait('@majorCreditors')
      .its('request.query')
      .should('deep.equal', { business_unit_id: '44', central_authority: 'false', active: 'true' });
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermCreditor);
    cy.get(S.heading).should('have.text', 'Creditor');
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Selects the Applicant radio. */
  public chooseApplicant(): void {
    cy.get(S.creditor.applicant).check();
  }

  /** Selects the second synthetic Major by its stable ID. */
  public chooseMajor(): void {
    cy.get(S.creditor.major).check();
    cy.get(S.creditor.majorId).select(String(E2E_CREDITOR_MAJOR_RESPONSE.refData[1].major_creditor_id));
  }

  /** Selects the add-new navigation branch. */
  public chooseAddNew(): void {
    cy.get(S.creditor.addNew).check();
  }

  /** Submits the creditor page. */
  public continue(): void {
    cy.get(S.creditor.continueButton).click();
  }

  /** Confirms local acceptance reached Summary without draft persistence. */
  public assertSummaryWithoutPersistence(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsSummary);
    cy.get(S.heading).should('have.text', 'Order terms');
    cy.get('@draftCreation').should('not.have.been.called');
  }

  /** Checks required-choice validation and its accessible focus link. */
  public assertValidation(): void {
    cy.get(S.errorSummary).should('be.focused').and('contain.text', 'There is a problem');
    cy.get(S.errorSummaryLinks).contains('Select a creditor').click();
    cy.get(S.creditor.applicant).should('be.focused');
  }

  /** Checks the selected Major remains represented by its numeric ID. */
  public assertMajorSelected(): void {
    cy.get(S.creditor.major).should('be.checked');
    cy.get(S.creditor.majorId).should('have.value', String(E2E_CREDITOR_MAJOR_RESPONSE.refData[1].major_creditor_id));
  }

  /** Follows the native return link from the pending details destination. */
  public returnFromDetails(): void {
    cy.get(S.minorCreditorDetails.returnLink).click();
  }

  /** Checks the add-new branch is restored on return. */
  public assertAddNewRestored(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermCreditor);
    cy.get(S.creditor.addNew).should('be.checked');
    cy.get('@draftCreation').should('not.have.been.called');
  }

  /**
   * Cancels the page using the requested confirmation outcome.
   * @param confirmed Whether to accept the unsaved-changes warning.
   */
  public cancel(confirmed: boolean): void {
    cy.on('window:confirm', () => confirmed);
    cy.get(S.creditor.cancel).click();
  }

  /** Checks a declined Cancel retains the local Applicant edit. */
  public assertCreditorRetained(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermCreditor);
    cy.get(S.creditor.applicant).should('be.checked');
  }

  /** Reloads to discard the in-memory journey state. */
  public reloadWithoutJourneyState(): void {
    cy.reload();
  }

  /** Checks the real guards reject creditor entry without current term context. */
  public assertMissingContextRejected(): void {
    cy.get(S.caseTypeGroup).should('be.visible');
    cy.get(S.creditor.continueButton).should('not.exist');
    cy.get(S.primaryNavigation).should('not.exist');
  }
}
