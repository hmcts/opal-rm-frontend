import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { UNSAVED_CHANGES_WARNING } from '../../../../../component/createDraftCasefile/constants/create-casefile-test-copy.constant';
import { E2E_CREDITOR_MAJOR_RESPONSE } from '../../mocks/createDraftCasefile/creditor.mock';
import { COUNTRIES_RESPONSE } from '../../mocks/createDraftCasefile/countries.mock';

/** Drives the creditor page of the Create draft casefile journey. */
export class CreditorActions {
  /** Installs the controlled active non-Central-Authority Major source before route activation. */
  public prepareMajorCreditors(): void {
    cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', {
      body: structuredClone(E2E_CREDITOR_MAJOR_RESPONSE),
    }).as('majorCreditors');
  }

  /** Installs Countries reference data before the Minor Creditor route resolves. */
  public prepareCountries(): void {
    cy.intercept('GET', '**/opal-maintenance-service/countries*', {
      body: structuredClone(COUNTRIES_RESPONSE),
    });
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

  /** Cancels clean Minor Creditor details without invoking an unsaved-changes warning. */
  public cancelMinorDetailsWithoutEdits(): void {
    cy.once('window:confirm', () => {
      throw new Error('Clean Minor Creditor Cancel unexpectedly requested confirmation');
    });
    cy.get(S.minorCreditor.cancel).click();
  }

  /** Checks Cancel discarded pending add-new intent and did not create a Minor creditor. */
  public assertNoNewMinorCreditor(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermCreditor);
    cy.get(S.creditor.choiceFieldset).should('be.visible');
    cy.get(S.creditor.applicant).should('be.enabled').and('not.be.checked');
    cy.get(S.creditor.major).should('be.enabled').and('not.be.checked');
    cy.get(S.creditor.addNew).should('be.enabled').and('not.be.checked');
    cy.get(S.creditor.minor(1)).should('not.exist');
    cy.get('@draftCreation').should('not.have.been.called');
  }

  /**
   * Cancels the page using the requested confirmation outcome.
   * @param confirmed Whether to accept the unsaved-changes warning.
   */
  public cancel(confirmed: boolean): void {
    cy.once('window:confirm', (message) => {
      expect(message).to.eq(UNSAVED_CHANGES_WARNING);
      return confirmed;
    });
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
