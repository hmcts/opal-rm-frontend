import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors } from '../../../../../shared/selectors/create-casefile.selectors';
import { E2E_MAJOR_CREDITORS_RESPONSE } from '../../mocks/createDraftCasefile/major-creditors.mock';

const Page = CreateCasefileSelectors.centralAuthority;
const root = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/';
const caseTypePath = root + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType;
const taskListPath = root + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;

/** Owns Central Authority page navigation, interactions, waits, and assertions. */
export class CentralAuthorityDetailsActions {
  /** Opens Central Authority details from a newly selected REMO Out casefile. */
  public openInNewRemoOutCasefile(): void {
    cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', {
      statusCode: 200,
      body: E2E_MAJOR_CREDITORS_RESPONSE,
    }).as('getMajorCreditors');
    cy.visit(caseTypePath);
    cy.get(CreateCasefileSelectors.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT)).check();
    cy.get(CreateCasefileSelectors.continueButton).click();
    cy.get(CreateCasefileSelectors.caseDetails.centralAuthorityLink).click();
    cy.wait('@getMajorCreditors').its('request.query').should('deep.equal', {
      business_unit_id: '77',
      central_authority: 'true',
      active: 'true',
    });
    cy.get(Page.heading).should('have.text', 'Central authority details');
  }

  /**
   * Enters and saves Central Authority details.
   *
   * @param remoReference The REMO reference to enter.
   * @param centralAuthorityReference The Central Authority reference to enter.
   * @param authority The displayed Central Authority option to select.
   */
  public saveDetails(remoReference: string, centralAuthorityReference: string, authority: string): void {
    cy.get(Page.remoReference).clear().type(remoReference);
    cy.get(Page.centralAuthorityReference).clear().type(centralAuthorityReference);
    cy.get(Page.autocomplete).clear().type(authority).type('{downArrow}{enter}');
    cy.get(Page.returnToCaseDetails).click();
    cy.location('pathname').should('equal', taskListPath);
  }

  /** Confirms the Central Authority task is marked as provided. */
  public assertTaskProvided(): void {
    cy.get(CreateCasefileSelectors.caseDetails.centralAuthorityStatus).should('contain.text', 'Provided');
  }

  /** Reopens the Central Authority details page from Case details. */
  public reopen(): void {
    cy.get(CreateCasefileSelectors.caseDetails.centralAuthorityLink).click();
    cy.get(Page.heading).should('have.text', 'Central authority details');
  }

  /**
   * Confirms saved Central Authority details are restored and editable.
   *
   * @param remoReference The expected REMO reference.
   * @param centralAuthorityReference The expected Central Authority reference.
   * @param authority The expected displayed Central Authority option.
   */
  public assertEditableDetails(remoReference: string, centralAuthorityReference: string, authority: string): void {
    cy.get(Page.remoReference).should('have.value', remoReference).and('not.be.disabled');
    cy.get(Page.centralAuthorityReference).should('have.value', centralAuthorityReference).and('not.be.disabled');
    cy.get(Page.autocomplete).should('have.value', authority).and('not.be.disabled');
  }

  /** Submits references beyond their maximum lengths and confirms both validation errors. */
  public submitOverLimitReferences(): void {
    cy.get(Page.remoReference).type('x'.repeat(21));
    cy.get(Page.centralAuthorityReference).type('x'.repeat(51));
    cy.get(Page.returnToCaseDetails).click();
    cy.get(Page.remoReferenceError).should('contain.text', 'REMO reference must be 20 characters or fewer');
    cy.get(Page.centralAuthorityReferenceError).should(
      'contain.text',
      'Central authority reference must be 50 characters or fewer',
    );
  }
}
