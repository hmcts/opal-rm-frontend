import { createScopedLogger } from 'cypress/support/utils/log.helper';

const log = createScopedLogger('CountryAutocompleteActions');

interface CountryReferenceDataResponse {
  refData: Array<{
    country_id: number;
    country_name: string;
  }>;
}

/** Interacts with Country autocompletes through their visible input and rendered options. */
export class CountryAutocompleteActions {
  /**
   * Confirms that the first four rendered Country options retain the observed API order.
   *
   * @param inputSelector Selector for the visible Country autocomplete input.
   * @param optionSelector Selector for the rendered Country options.
   */
  public assertFirstFourFromRealResponse(inputSelector: string, optionSelector: string): void {
    log('assert', 'Checking Country option order against the real response');
    cy.wait('@getActiveCountries').then(({ response }) => {
      expect(response?.statusCode, 'active Countries response status').to.equal(200);

      const apiNames = (response?.body as CountryReferenceDataResponse).refData
        .slice(0, 4)
        .map(({ country_name }) => country_name);
      expect(apiNames, 'real API Country sample').to.have.length(4);

      cy.get(inputSelector).click().type('{downarrow}');
      cy.get(optionSelector)
        .should('have.length.at.least', 4)
        .then(($options) => {
          const uiNames = [...$options].slice(0, 4).map((option) => option.textContent?.trim() ?? '');
          const followingCountries = uiNames.slice(1);
          const alphabeticFollowingCountries = [...followingCountries].sort((left, right) =>
            left.localeCompare(right, 'en-GB', { sensitivity: 'base' }),
          );

          expect(uiNames, 'rendered options match the real API sample').to.deep.equal(apiNames);
          expect(uiNames[0], 'first Country option').to.equal('United Kingdom');
          expect(followingCountries, 'next three Country options').to.deep.equal(alphabeticFollowingCountries);
        });
    });
  }

  /**
   * Selects a Country through the visible autocomplete rather than its hidden identifier.
   *
   * @param inputSelector Selector for the visible Country autocomplete input.
   * @param optionSelector Selector for the rendered Country options.
   * @param countryName Name of the Country to select.
   */
  public select(inputSelector: string, optionSelector: string, countryName: string): void {
    log('action', 'Selecting a Country', { countryName });
    cy.get(inputSelector).clear().type(countryName);
    cy.contains(optionSelector, countryName).click();
  }
}
