import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { CreateCasefileSelectors } from '../../../../../shared/selectors/create-casefile.selectors';

const Page = CreateCasefileSelectors.centralAuthority;
const root = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/';
const caseTypePath = root + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType;
const taskListPath = root + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
const CENTRAL_AUTHORITY_ALIASES = {
  first: 'firstAvailableCentralAuthority',
  second: 'secondAvailableCentralAuthority',
} as const;

export type CentralAuthorityChoice = keyof typeof CENTRAL_AUTHORITY_ALIASES;

/** Owns Central Authority page navigation, interactions, waits, and assertions. */
export class CentralAuthorityDetailsActions {
  /** Opens Central Authority details from a newly selected REMO Out casefile. */
  public openInNewRemoOutCasefile(): void {
    cy.intercept('GET', '**/opal-maintenance-service/major-creditors*').as('getMajorCreditors');
    cy.visit(caseTypePath);
    cy.get(CreateCasefileSelectors.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT)).check();
    cy.get(CreateCasefileSelectors.continueButton).click();
    cy.get(CreateCasefileSelectors.caseDetails.centralAuthorityLink).click();
    cy.wait('@getMajorCreditors').then(({ request, response }) => {
      expect(request.query).to.deep.equal({
        business_unit_id: '44',
        central_authority: 'true',
        active: 'true',
      });

      if (!response) {
        throw new Error('The live major-creditors request completed without a response');
      }

      expect(response.statusCode, 'major-creditors response status').to.equal(200);
      const body = response.body as Partial<IOpalMaintenanceMajorCreditorReferenceDataResponse>;
      if (!Array.isArray(body.refData)) {
        throw new Error('The live major-creditors response must contain a refData array');
      }
      if (body.refData.length < 2) {
        throw new Error('The live major-creditors response must contain at least two Central Authorities');
      }

      expect(body.refData, 'available Central Authorities').to.have.length.at.least(2);
      body.refData.forEach((majorCreditor) => {
        expect(majorCreditor.business_unit_id, 'Central Authority Business Unit').to.equal(44);
        expect(majorCreditor.central_authority, 'Central Authority flag').to.equal(true);
        expect(majorCreditor.active, 'Central Authority active flag').to.equal(true);
      });

      const [first, second] = body.refData;
      if (!first || !second) {
        throw new Error('The live major-creditors response did not expose two selectable Central Authorities');
      }

      cy.wrap(this.toAuthorityLabel(first)).as(CENTRAL_AUTHORITY_ALIASES.first);
      cy.wrap(this.toAuthorityLabel(second)).as(CENTRAL_AUTHORITY_ALIASES.second);
    });
    cy.get(Page.heading).should('have.text', 'Central authority details');
  }

  /**
   * Enters and saves Central Authority details.
   *
   * @param remoReference The REMO reference to enter.
   * @param centralAuthorityReference The Central Authority reference to enter.
   * @param authorityChoice Which returned Central Authority option to select.
   */
  public saveDetails(
    remoReference: string,
    centralAuthorityReference: string,
    authorityChoice: CentralAuthorityChoice,
  ): void {
    this.withAuthorityLabel(authorityChoice, (authorityLabel) => {
      cy.get(Page.remoReference).clear().type(remoReference);
      cy.get(Page.centralAuthorityReference).clear().type(centralAuthorityReference);
      cy.get(Page.autocomplete).clear().type(authorityLabel).type('{downArrow}{enter}');
      cy.get(Page.returnToCaseDetails).click();
      cy.location('pathname').should('equal', taskListPath);
    });
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
   * @param authorityChoice Which returned Central Authority option is expected.
   */
  public assertEditableDetails(
    remoReference: string,
    centralAuthorityReference: string,
    authorityChoice: CentralAuthorityChoice,
  ): void {
    this.withAuthorityLabel(authorityChoice, (authorityLabel) => {
      cy.get(Page.remoReference).should('have.value', remoReference).and('not.be.disabled');
      cy.get(Page.centralAuthorityReference).should('have.value', centralAuthorityReference).and('not.be.disabled');
      cy.get(Page.autocomplete).should('have.value', authorityLabel).and('not.be.disabled');
    });
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

  /**
   * Builds the autocomplete label for a returned Central Authority.
   *
   * @param majorCreditor The returned Central Authority record.
   * @returns The selectable autocomplete label.
   */
  private toAuthorityLabel(majorCreditor: IOpalMaintenanceMajorCreditorReferenceDataItem): string {
    return `${majorCreditor.major_creditor_code} - ${majorCreditor.name}`;
  }

  /**
   * Resolves a captured Central Authority label and passes it to an assertion or interaction.
   *
   * @param authorityChoice Which returned Central Authority option to resolve.
   * @param assertion The assertion or interaction to perform with the resolved label.
   */
  private withAuthorityLabel(
    authorityChoice: CentralAuthorityChoice,
    assertion: (authorityLabel: string) => void,
  ): void {
    cy.get(`@${CENTRAL_AUTHORITY_ALIASES[authorityChoice]}`).then((authorityLabel) => {
      expect(authorityLabel, `${authorityChoice} available Central Authority label`).to.be.a('string').and.not.be.empty;
      assertion(String(authorityLabel));
    });
  }
}
