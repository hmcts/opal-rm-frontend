import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { createScopedLogger } from 'cypress/support/utils/log.helper';
import { CountryAutocompleteActions } from './country-autocomplete.actions';

const log = createScopedLogger('ApplicantIndividualActions');

/** The minimum Individual Applicant fields required to provide the party-details task. */
export interface MinimumApplicantDetails {
  firstNames: string;
  lastName: string;
  addressLine1: string;
  countryName: string;
}

/** Completes and checks the minimum Individual Applicant details for a Draft Casefile. */
export class ApplicantIndividualActions {
  private readonly countryAutocompleteActions = new CountryAutocompleteActions();

  /**
   * Completes only the minimum required Individual Applicant fields and returns to the task list.
   *
   * @param details Minimum Individual Applicant values to enter.
   */
  public completeMinimum(details: MinimumApplicantDetails): void {
    log('action', 'Completing minimum Individual Applicant details');
    cy.get(Page.applicantIndividual.firstNames).clear().type(details.firstNames);
    cy.get(Page.applicantIndividual.lastName).clear().type(details.lastName);
    cy.get(Page.applicantIndividual.addressLine1).clear().type(details.addressLine1);
    this.countryAutocompleteActions.select(
      Page.applicantIndividual.countryAutocomplete,
      Page.applicantIndividual.countryOptions,
      details.countryName,
    );
    cy.get(Page.applicantIndividual.bankTypeRadio('none')).check();
    this.returnToCaseDetails();
  }

  /**
   * Verifies that representative Individual Applicant values remain after reopening the task.
   *
   * @param details Minimum Individual Applicant values expected on the form.
   */
  public assertRetained(details: MinimumApplicantDetails): void {
    log('assert', 'Checking retained Individual Applicant details');
    cy.get(Page.applicantIndividual.firstNames).should('have.value', details.firstNames);
    cy.get(Page.applicantIndividual.lastName).should('have.value', details.lastName);
    cy.get(Page.applicantIndividual.addressLine1).should('have.value', details.addressLine1);
    cy.get(Page.applicantIndividual.countryAutocomplete).should('have.value', details.countryName);
    cy.get(Page.applicantIndividual.bankTypeRadio('none')).should('be.checked');
  }

  /** Returns from Individual Applicant details to the Case details task list. */
  public returnToCaseDetails(): void {
    log('navigate', 'Returning from Individual Applicant details to Case details');
    cy.get(Page.applicantIndividual.returnToCaseDetails).click();
    cy.location('pathname').should('eq', '/cases/create-casefile/task-list');
  }
}
