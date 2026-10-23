import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { CreateCasefileSelectors } from '../../../../../shared/selectors/create-casefile.selectors';

const Page = CreateCasefileSelectors.centralAuthority;
const root = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/';
const taskListPath = root + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
const CENTRAL_AUTHORITY_ALIASES = {
  first: 'firstAvailableCentralAuthority',
  second: 'secondAvailableCentralAuthority',
} as const;

export type CentralAuthorityChoice = keyof typeof CENTRAL_AUTHORITY_ALIASES;

/** Owns Central Authority page navigation, interactions, waits, and assertions. */
export class CentralAuthorityDetailsActions {
  /** Observes real draft creation requests without replacing their responses. */
  public observeDraftCreation(): void {
    const submitted = cy.spy().as('authorityDraftCreation');
    cy.intercept('POST', '**/opal-maintenance-service/draft-casefiles', () => {
      submitted();
    });
  }

  /** Confirms local authority capture has not created a persisted draft. */
  public assertNoSubmission(): void {
    cy.get('@authorityDraftCreation').should('not.have.been.called');
  }

  /** Opens authority capture and requires two active live BU 44 authorities for edit/reselection coverage. */
  public openFromTaskList(): void {
    cy.intercept('GET', '**/opal-maintenance-service/major-creditors*').as('getMajorCreditors');
    cy.get(CreateCasefileSelectors.caseDetails.centralAuthorityLink).click();
    cy.wait('@getMajorCreditors').then(({ request, response }) => {
      expect(request.query).to.deep.equal({ business_unit_id: '44', central_authority: 'true', active: 'true' });
      if (!response || response.statusCode !== 200) throw new Error('Live Central Authority lookup must return 200');
      const body = response.body as IOpalMaintenanceMajorCreditorReferenceDataResponse;
      if (!Array.isArray(body.refData) || body.refData.length < 2) {
        throw new Error('Live Central Authority editing needs two available active records');
      }
      expect(
        body.refData.every((item) => item.business_unit_id === 44 && item.active && item.central_authority),
        'Returned authorities must be active Central Authorities for RM BU 44',
      ).to.equal(true);
      const [first, second] = body.refData;
      if (!first || !second) throw new Error('Two selectable Central Authorities are required');
      cy.wrap(this.toAuthorityLabel(first), { log: false }).as(CENTRAL_AUTHORITY_ALIASES.first);
      cy.wrap(this.toAuthorityLabel(second), { log: false }).as(CENTRAL_AUTHORITY_ALIASES.second);
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
