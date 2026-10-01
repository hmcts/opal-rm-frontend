import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { createScopedLogger } from 'cypress/support/utils/log.helper';
import { CountryAutocompleteActions } from './country-autocomplete.actions';

const log = createScopedLogger('RespondentDetailsActions');

/** The minimum Respondent fields required to provide the party-details task. */
export interface MinimumRespondentDetails {
  firstNames: string;
  lastName: string;
  addressLine1: string;
  countryName: string;
}

/** Completes and checks the minimum Respondent details for a Draft Casefile. */
export class RespondentDetailsActions {
  private readonly countryAutocompleteActions = new CountryAutocompleteActions();

  /** Checks that the Respondent Country options match the observed active Countries response. */
  public assertCountrySampleOrdered(): void {
    log('assert', 'Checking Respondent Country option order');
    this.countryAutocompleteActions.assertFirstFourFromRealResponse(
      Page.respondentDetails.countryAutocomplete,
      Page.respondentDetails.countryOptions,
    );
  }

  /**
   * Completes only the minimum required Respondent fields and returns to the task list.
   *
   * @param details Minimum Respondent values to enter.
   */
  public completeMinimum(details: MinimumRespondentDetails): void {
    log('action', 'Completing minimum Respondent details');
    cy.get(Page.respondentDetails.firstNames).clear().type(details.firstNames);
    cy.get(Page.respondentDetails.lastName).clear().type(details.lastName);
    cy.get(Page.respondentDetails.addressLine1).clear().type(details.addressLine1);
    this.countryAutocompleteActions.select(
      Page.respondentDetails.countryAutocomplete,
      Page.respondentDetails.countryOptions,
      details.countryName,
    );
    this.returnToCaseDetails();
  }

  /**
   * Verifies that representative Respondent values remain after reopening the task.
   *
   * @param details Minimum Respondent values expected on the form.
   */
  public assertRetained(details: MinimumRespondentDetails): void {
    log('assert', 'Checking retained Respondent details');
    cy.get(Page.respondentDetails.firstNames).should('have.value', details.firstNames);
    cy.get(Page.respondentDetails.lastName).should('have.value', details.lastName);
    cy.get(Page.respondentDetails.addressLine1).should('have.value', details.addressLine1);
    cy.get(Page.respondentDetails.countryAutocomplete).should('have.value', details.countryName);
  }

  /** Returns from Respondent details to the Case details task list. */
  public returnToCaseDetails(): void {
    log('navigate', 'Returning from Respondent details to Case details');
    cy.get(Page.respondentDetails.returnToCaseDetails).click();
    cy.location('pathname').should('eq', '/cases/create-casefile/task-list');
  }
}
