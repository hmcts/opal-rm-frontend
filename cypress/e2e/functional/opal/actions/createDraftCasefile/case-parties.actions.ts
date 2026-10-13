import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import type { IOpalMaintenanceCountryReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';
import type { CasePartyPath } from '../../types/createDraftCasefile/case-party-path.type';

/** Interacts with live party pages and verifies their local retention without submitting a draft. */
export class CasePartiesActions {
  /**
   * Starts an independent REMO In draft and observes live lookups and any submission attempt.
   * @param path Applicant category selected on the case-type page.
   */
  public start(path: CasePartyPath): void {
    cy.intercept('GET', '**/opal-maintenance-service/countries*').as('liveCountries');
    const submitted = cy.spy().as('liveDraftCreation');
    cy.intercept('POST', '**/opal-maintenance-service/draft-casefiles', () => {
      submitted();
    });
    cy.visit('/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get(S.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(S.applicantType).select(path);
    cy.get(S.continueButton).click();
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.taskList);
    cy.get(S.caseDetails.applicantTypeValue).should('contain.text', path);
  }

  /** Requires a successful live Country lookup and fills only the mandatory respondent details. */
  public fillRespondent(): void {
    cy.get(S.caseDetails.respondentLink).click();
    cy.wait('@liveCountries').then(({ response }) => {
      if (!response || response.statusCode !== 200) throw new Error('Live Country lookup must return 200');
      const body = response.body as IOpalMaintenanceCountryReferenceDataResponse;
      if (!Array.isArray(body.refData)) throw new Error('Live Country lookup must contain refData');
      expect(body.refData.length >= 3, 'Country ordering needs UK and at least two other Countries').to.equal(true);
      expect(
        body.refData.every((country) => country.active),
        'Countries must all be active',
      ).to.equal(true);
      const names = body.refData.map((country) => country.country_name);
      expect(names.includes('United Kingdom'), 'United Kingdom must be available').to.equal(true);
      expect(new Set(names).size, 'Country names must be distinct').to.equal(names.length);
      const remaining = names.filter((name) => name !== 'United Kingdom').sort((a, b) => a.localeCompare(b));
      cy.wrap(['United Kingdom', ...remaining], { log: false }).as('liveCountryNames');
    });
    this.assertCountryOrder(S.respondentDetails.countryAutocomplete, S.respondentDetails.countryOptions);
    cy.get(S.respondentDetails.firstNames).type('Synthetic');
    cy.get(S.respondentDetails.lastName).type('Respondent');
    cy.get(S.respondentDetails.addressLine1).type('1 Test Street');
  }

  /** Saves respondent details locally using keyboard activation and requires task completion. */
  public saveRespondent(): void {
    cy.get(S.respondentDetails.returnToCaseDetails).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.caseDetails.respondentStatus).should('contain.text', 'Provided');
  }

  /** Uses the cached Country list and fills mandatory individual details with no bank account. */
  public fillIndividual(): void {
    cy.get(S.caseDetails.applicantLink).click();
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.applicantIndividual);
    this.assertCountryOrder(S.applicantIndividual.countryAutocomplete, S.applicantIndividual.countryOptions);
    cy.get(S.applicantIndividual.firstNames).type('Synthetic');
    cy.get(S.applicantIndividual.lastName).type('Applicant');
    cy.get(S.applicantIndividual.addressLine1).type('2 Test Street');
    cy.get(S.applicantIndividual.bankTypeRadio('none')).check();
  }

  /** Saves individual details locally using keyboard activation and requires both tasks complete. */
  public saveIndividual(): void {
    cy.get(S.applicantIndividual.returnToCaseDetails).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    this.assertProvided();
  }

  /** Requires both party tasks complete and no draft creation request observed. */
  public assertProvided(): void {
    cy.get(S.caseDetails.respondentStatus).should('contain.text', 'Provided');
    cy.get(S.caseDetails.applicantStatus).should('contain.text', 'Provided');
    this.assertNoSubmission();
  }

  /** Reopens the respondent page and verifies the synthetic details retained through navigation. */
  public verifyRespondent(): void {
    cy.get(S.caseDetails.respondentLink).click();
    cy.get(S.respondentDetails.firstNames).should('have.value', 'Synthetic');
    cy.get(S.respondentDetails.lastName).should('have.value', 'Respondent');
    cy.get(S.respondentDetails.addressLine1).should('have.value', '1 Test Street');
    cy.get(S.respondentDetails.countryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(S.respondentDetails.returnToCaseDetails).click();
  }

  /** Reopens the individual page and verifies the synthetic details and bank selection retained. */
  public verifyIndividual(): void {
    cy.get(S.caseDetails.applicantLink).click();
    cy.get(S.applicantIndividual.firstNames).should('have.value', 'Synthetic');
    cy.get(S.applicantIndividual.lastName).should('have.value', 'Applicant');
    cy.get(S.applicantIndividual.addressLine1).should('have.value', '2 Test Street');
    cy.get(S.applicantIndividual.countryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(S.applicantIndividual.bankTypeRadio('none')).should('be.checked');
    cy.get(S.applicantIndividual.returnToCaseDetails).click();
    this.assertProvided();
  }

  /** Requires that this scenario has made no draft creation POST request. */
  public assertNoSubmission(): void {
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }

  /**
   * Requires the full unsorted DOM list to match live Country ordering, then selects United Kingdom.
   * @param input Country autocomplete selector.
   * @param options Visible Country option selector.
   */
  private assertCountryOrder(input: string, options: string): void {
    cy.get('@liveCountryNames').then((expectedNames) => {
      cy.get(input).clear().focus();
      cy.get(options).should((items) => {
        expect([...items].map((item) => item.textContent?.trim())).to.deep.equal(expectedNames);
      });
      cy.get(input).type('United Kingdom').type('{downArrow}{enter}');
      cy.get(input).should('have.value', 'United Kingdom');
    });
  }
}
