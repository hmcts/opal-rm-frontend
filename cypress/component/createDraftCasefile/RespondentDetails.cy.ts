import type { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileRespondentDetails } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-respondent-details.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from 'src/app/flows/cases/cases-create-casefile/services/interfaces/cases-create-casefile-country-reference-data-response.interface';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { setupRespondentDetails } from './setup/respondent-details.setup';
import type { CasesCreateCasefileStoreInstance, GlobalStoreInstance } from './setup/respondent-details.setup';

const CREATE_CASEFILE_STORY_TAG = '@JIRA-STORY:PO-9801';
const CREATE_CASEFILE_EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (...tags: string[]): string[] => [...tags, CREATE_CASEFILE_STORY_TAG, CREATE_CASEFILE_EPIC_TAG];
const respondentPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.respondentDetails;
const taskListPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;

const SAVED_RESPONDENT: ICasesCreateCasefileRespondentDetails = {
  title: 'Mx',
  firstNames: 'Test',
  lastName: 'Respondent',
  aliases: [
    { firstNames: 'Example', lastName: 'Alias' },
    { firstNames: 'Second', lastName: 'Alias' },
  ],
  dateOfBirth: '1990-01-31',
  nationalInsuranceNumber: 'QQ123456C',
  otherPersonalInformation: 'Synthetic test information',
  contactDetails: {
    mainEmailAddress: 'test@example.com',
    otherEmailAddress: null,
    mainTelephoneNumber: '01234567890',
    otherTelephoneNumber: null,
    address: {
      addressLine1: '1 Test Street',
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: 'TE1 1ST',
      countryId: 826,
    },
  },
  thirdParty: {
    nameOrOrganisation: 'Test Support',
    relationship: 'Representative',
    reference: 'REF-1',
    address: {
      addressLine1: '2 Test Street',
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: null,
      countryId: 250,
    },
  },
  employer: {
    employerName: 'Test Employer',
    employeeReference: 'EMP-1',
    emailAddress: null,
    telephoneNumber: null,
    address: {
      addressLine1: '3 Test Street',
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: null,
      countryId: 826,
    },
  },
  restrictedInformation: {
    restricted: true,
    reason: 'Synthetic restricted-information reason',
  },
};

const SUBMITTED_RESPONDENT: ICasesCreateCasefileRespondentDetails = {
  title: null,
  firstNames: 'Test',
  lastName: 'Respondent',
  aliases: [{ firstNames: 'Example', lastName: 'Alias' }],
  dateOfBirth: null,
  nationalInsuranceNumber: null,
  otherPersonalInformation: null,
  contactDetails: {
    mainEmailAddress: null,
    otherEmailAddress: null,
    mainTelephoneNumber: null,
    otherTelephoneNumber: null,
    address: {
      addressLine1: '1 Test Street',
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: null,
      countryId: 826,
    },
  },
  thirdParty: {
    nameOrOrganisation: 'Test Support',
    relationship: 'Representative',
    reference: null,
    address: {
      addressLine1: '2 Test Street',
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: null,
      countryId: 250,
    },
  },
  employer: {
    employerName: 'Test Employer',
    employeeReference: null,
    emailAddress: null,
    telephoneNumber: null,
    address: {
      addressLine1: '3 Test Street',
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      addressLine5: null,
      postalOrZipCode: null,
      countryId: 826,
    },
  },
  restrictedInformation: {
    restricted: true,
    reason: 'Synthetic restricted-information reason',
  },
};

const EMPTY_COUNTRIES_RESPONSE: ICasesCreateCasefileCountryReferenceDataResponse = { count: 0, refData: [] };

const normalizeText = (text: string | null | undefined): string => text?.replace(/\s+/g, ' ').trim() ?? '';

const assertInlineError = (selector: string, expectedMessage: string): void => {
  cy.get(selector).then(($error) => {
    const error = $error[0].cloneNode(true) as HTMLElement;
    error.querySelector('.govuk-visually-hidden')?.remove();
    expect(normalizeText(error.textContent)).to.equal(expectedMessage);
  });
};

const assertRouterPath = (expectedPath: string): void => {
  cy.get('@angularRouter').then((router: Router) => {
    expect(router.url).to.equal(expectedPath);
  });
};

const selectAutocomplete = (
  inputSelector: string,
  optionSelector: string,
  hiddenValueSelector: string,
  countryName: string,
  countryId: number,
): void => {
  cy.get(inputSelector).should('be.visible').clear().type(countryName);
  cy.get(optionSelector).contains(countryName).click();
  cy.get(hiddenValueSelector).should('have.value', String(countryId));
};

const fillRequiredIdentityAndAddress = (): void => {
  cy.get(Page.respondentDetails.firstNames).type('Test');
  cy.get(Page.respondentDetails.lastName).type('Respondent');
  cy.get(Page.respondentDetails.addressLine1).type('1 Test Street');
  selectAutocomplete(
    Page.respondentDetails.countryAutocomplete,
    Page.respondentDetails.countryOptions,
    Page.respondentDetails.countryId,
    'United Kingdom',
    826,
  );
};

const fillValidExpandedRespondent = (): void => {
  fillRequiredIdentityAndAddress();

  cy.get(Page.respondentDetails.addAliases).check();
  cy.get(Page.respondentDetails.aliasFirstName(0)).type('Example');
  cy.get(Page.respondentDetails.aliasLastName(0)).type('Alias');

  cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).check();
  cy.get(Page.respondentDetails.thirdPartyNameOrOrganisation).type('Test Support');
  cy.get(Page.respondentDetails.thirdPartyRelationship).type('Representative');
  cy.get(Page.respondentDetails.thirdPartyAddressLine1).type('2 Test Street');
  cy.get(Page.respondentDetails.thirdPartyCountry).select(String(250));

  cy.get(Page.respondentDetails.addEmployerDetails).check();
  cy.get(Page.respondentDetails.employerName).type('Test Employer');
  cy.get(Page.respondentDetails.employerAddressLine1).type('3 Test Street');
  selectAutocomplete(
    Page.respondentDetails.employerCountryAutocomplete,
    Page.respondentDetails.employerCountryOptions,
    Page.respondentDetails.employerCountryId,
    'United Kingdom',
    826,
  );

  cy.get(Page.respondentDetails.restrictedInformation).check();
  cy.get(Page.respondentDetails.restrictedInformationReason).type('Synthetic restricted-information reason');
};

describe('Create Casefile Respondent Details', () => {
  it('AC1. should render the complete respondent screen in approved section order', { tags: buildTags() }, () => {
    setupRespondentDetails();

    cy.wait('@getCountries').its('request.method').should('equal', 'GET');
    cy.get(Page.respondentDetails.heading).should('have.text', 'Respondent details');
    cy.get(Page.respondentDetails.sectionHeadings).then(($headings) => {
      expect([...$headings].map((heading) => normalizeText(heading.textContent))).to.deep.equal([
        'Contact details',
        'Address',
        'Third party details',
        'Employer details',
        'Restricted information',
      ]);
    });
    cy.get(Page.respondentDetails.firstNames).should('be.visible').and('have.value', '');
    cy.get(Page.respondentDetails.lastName).should('be.visible').and('have.value', '');
    cy.get(Page.respondentDetails.addressLine1).should('be.visible').and('have.value', '');
    cy.get(Page.respondentDetails.countryAutocomplete).should('be.visible').and('have.value', '');
    for (const checkbox of [
      Page.respondentDetails.addAliases,
      Page.respondentDetails.sendCorrespondenceToThirdParty,
      Page.respondentDetails.addEmployerDetails,
      Page.respondentDetails.restrictedInformation,
    ]) {
      cy.get(checkbox).should('be.enabled').and('not.be.checked');
    }
    cy.get(Page.respondentDetails.returnToCaseDetails)
      .invoke('text')
      .then((text) => expect(normalizeText(text)).to.equal('Return to case details'));
    cy.get(Page.respondentDetails.cancelLink).should('have.text', 'Cancel');
  });

  it('AC1. should rehydrate saved identity, aliases, Countries and conditional objects', { tags: buildTags() }, () => {
    setupRespondentDetails({ savedRespondent: SAVED_RESPONDENT });

    cy.get(Page.respondentDetails.title).should('have.value', 'Mx');
    cy.get(Page.respondentDetails.firstNames).should('have.value', 'Test');
    cy.get(Page.respondentDetails.lastName).should('have.value', 'Respondent');
    cy.get(Page.respondentDetails.addAliases).should('be.checked');
    cy.get(Page.respondentDetails.aliasFirstNames).should('have.length', 2);
    cy.get(Page.respondentDetails.aliasFirstName(0)).should('have.value', 'Example');
    cy.get(Page.respondentDetails.aliasLastName(1)).should('have.value', 'Alias');
    cy.get(Page.respondentDetails.countryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(Page.respondentDetails.countryId).should('have.value', '826');
    cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).should('be.checked');
    cy.get(Page.respondentDetails.thirdPartyNameOrOrganisation).should('have.value', 'Test Support');
    cy.get(Page.respondentDetails.thirdPartyCountry).should('have.value', '250');
    cy.get(Page.respondentDetails.addEmployerDetails).should('be.checked');
    cy.get(Page.respondentDetails.employerName).should('have.value', 'Test Employer');
    cy.get(Page.respondentDetails.employerCountryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(Page.respondentDetails.employerCountryId).should('have.value', '826');
    cy.get(Page.respondentDetails.restrictedInformation).should('be.checked');
    cy.get(Page.respondentDetails.restrictedInformationReason).should(
      'have.value',
      'Synthetic restricted-information reason',
    );
  });

  it(
    'AC2. should add at most five aliases and clear them when Add aliases is deselected',
    { tags: buildTags() },
    () => {
      setupRespondentDetails();

      cy.get(Page.respondentDetails.addAliases).check();
      cy.get(Page.respondentDetails.aliasFirstName(0)).should('be.focused').type('First');
      for (let index = 1; index < 5; index += 1) {
        cy.get(Page.respondentDetails.addAliasButton).click();
        cy.get(Page.respondentDetails.aliasFirstName(index)).should('be.focused');
      }
      cy.get(Page.respondentDetails.aliasFirstNames).should('have.length', 5);
      cy.get(Page.respondentDetails.aliasLastNames).should('have.length', 5);
      cy.get(Page.respondentDetails.addAliasButton).should('not.exist');

      cy.get(Page.respondentDetails.addAliases).uncheck();
      cy.get(Page.respondentDetails.aliasesConditional).should('not.exist');
      cy.get(Page.respondentDetails.aliasFirstNames).should('not.exist');
      cy.get(Page.respondentDetails.aliasLastNames).should('not.exist');
    },
  );

  it(
    'AC2. should reveal, require and clear third-party, employer and restricted branches independently',
    { tags: buildTags() },
    () => {
      setupRespondentDetails();

      cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).check();
      cy.get(Page.respondentDetails.returnToCaseDetails).click();
      assertInlineError(Page.respondentDetails.thirdPartyNameOrOrganisationError, 'Enter name or organisation');
      assertInlineError(Page.respondentDetails.thirdPartyRelationshipError, 'Enter relationship to the respondent');
      assertInlineError(Page.respondentDetails.thirdPartyAddressLine1Error, 'Enter an address');
      assertInlineError(Page.respondentDetails.thirdPartyCountryError, 'Select a country');
      cy.get(Page.respondentDetails.thirdPartyNameOrOrganisation).type('Stale third party');
      cy.get(Page.respondentDetails.thirdPartyCountry).select(String(250));
      cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).uncheck().check();
      cy.get(Page.respondentDetails.thirdPartyNameOrOrganisation).should('have.value', '');
      cy.get(Page.respondentDetails.thirdPartyCountry).should('not.have.value', '250');
      cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).uncheck();

      cy.get(Page.respondentDetails.addEmployerDetails).check();
      cy.get(Page.respondentDetails.returnToCaseDetails).click();
      assertInlineError(Page.respondentDetails.employerNameError, 'Enter employer name');
      assertInlineError(Page.respondentDetails.employerAddressLine1Error, 'Enter employer address');
      assertInlineError(Page.respondentDetails.employerCountryError, 'Select a country');
      cy.get(Page.respondentDetails.employerName).type('Stale employer');
      selectAutocomplete(
        Page.respondentDetails.employerCountryAutocomplete,
        Page.respondentDetails.employerCountryOptions,
        Page.respondentDetails.employerCountryId,
        'France',
        250,
      );
      cy.get(Page.respondentDetails.addEmployerDetails).uncheck().check();
      cy.get(Page.respondentDetails.employerName).should('have.value', '');
      cy.get(Page.respondentDetails.employerCountryAutocomplete).should('have.value', '');
      cy.get(Page.respondentDetails.addEmployerDetails).uncheck();

      cy.get(Page.respondentDetails.restrictedInformation).check();
      cy.get(Page.respondentDetails.returnToCaseDetails).click();
      assertInlineError(
        Page.respondentDetails.restrictedInformationReasonError,
        'Enter a reason why the respondent’s personal information should not be shared',
      );
      cy.get(Page.respondentDetails.restrictedInformationReason).type('Stale reason');
      cy.get(Page.respondentDetails.restrictedInformation).uncheck().check();
      cy.get(Page.respondentDetails.restrictedInformationReason).should('have.value', '');
    },
  );

  it('AC3. should show exact inline and summary errors and focus the summary', { tags: buildTags() }, () => {
    setupRespondentDetails();

    cy.get(Page.respondentDetails.addAliases).check();
    cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).check();
    cy.get(Page.respondentDetails.addEmployerDetails).check();
    cy.get(Page.respondentDetails.restrictedInformation).check();
    cy.get(Page.respondentDetails.returnToCaseDetails).click();

    cy.get(Page.respondentDetails.errorSummary).should('be.focused').and('contain.text', 'There is a problem');
    const expectedErrors = [
      'Enter respondent’s first name(s)',
      'Enter respondent’s last name',
      'Enter alias 1 first name(s)',
      'Enter alias 1 last name',
      'Enter an address',
      'Select a country',
      'Enter name or organisation',
      'Enter relationship to the respondent',
      'Enter an address',
      'Select a country',
      'Enter employer name',
      'Enter employer address',
      'Select a country',
      'Enter a reason why the respondent’s personal information should not be shared',
    ];
    cy.get(Page.respondentDetails.errorSummaryLinks).then(($links) => {
      expect([...$links].map((link) => normalizeText(link.textContent))).to.deep.equal(expectedErrors);
    });
    assertInlineError(Page.respondentDetails.firstNamesError, expectedErrors[0]);
    assertInlineError(Page.respondentDetails.lastNameError, expectedErrors[1]);
    assertInlineError(Page.respondentDetails.aliasFirstNameError(0), expectedErrors[2]);
    assertInlineError(Page.respondentDetails.aliasLastNameError(0), expectedErrors[3]);
    assertInlineError(Page.respondentDetails.addressLine1Error, expectedErrors[4]);
    assertInlineError(Page.respondentDetails.countryError, expectedErrors[5]);
    assertInlineError(Page.respondentDetails.thirdPartyNameOrOrganisationError, expectedErrors[6]);
    assertInlineError(Page.respondentDetails.thirdPartyRelationshipError, expectedErrors[7]);
    assertInlineError(Page.respondentDetails.thirdPartyAddressLine1Error, expectedErrors[8]);
    assertInlineError(Page.respondentDetails.thirdPartyCountryError, expectedErrors[9]);
    assertInlineError(Page.respondentDetails.employerNameError, expectedErrors[10]);
    assertInlineError(Page.respondentDetails.employerAddressLine1Error, expectedErrors[11]);
    assertInlineError(Page.respondentDetails.employerCountryError, expectedErrors[12]);
    assertInlineError(Page.respondentDetails.restrictedInformationReasonError, expectedErrors[13]);
  });

  it('AC3. should focus the exact control when a summary link is selected', { tags: buildTags() }, () => {
    setupRespondentDetails();

    cy.get(Page.respondentDetails.addAliases).check();
    cy.get(Page.respondentDetails.aliasFirstName(0)).type('Example');
    cy.get(Page.respondentDetails.aliasLastName(0)).type('Alias');
    cy.get(Page.respondentDetails.addAliasButton).click();
    cy.get(Page.respondentDetails.returnToCaseDetails).click();
    cy.contains(Page.respondentDetails.errorSummaryLinks, /^Enter alias 2 first name\(s\)$/).click();
    cy.get(Page.respondentDetails.aliasFirstName(1)).should('be.focused');

    cy.get(Page.respondentDetails.returnToCaseDetails).click();
    cy.contains(Page.respondentDetails.errorSummaryLinks, /^Select a country$/).click();
    cy.get(Page.respondentDetails.countryAutocomplete).should('be.focused');
  });

  it(
    'AC4. should save canonical Country IDs locally, mark Respondent Provided and return to Case details',
    { tags: buildTags() },
    () => {
      setupRespondentDetails();
      fillValidExpandedRespondent();

      cy.get(Page.respondentDetails.returnToCaseDetails).click();
      assertRouterPath(taskListPath);
      cy.get(Page.caseDetails.heading).should('have.text', 'Case details');
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.respondentDetails()).to.deep.equal(SUBMITTED_RESPONDENT);
        expect(store.taskStatuses().respondent).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
        expect(store.unsavedChanges()).to.equal(false);
        expect(store.stateChanges()).to.equal(true);
      });
    },
  );
  it('AC4. should make no Draft Casefile POST or PUT request', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('draftCasefilePost');
    const putRequestSpy = cy.spy().as('draftCasefilePut');
    cy.intercept({ method: 'POST', url: '**/draft-casefiles**' }, (request) => {
      postRequestSpy(request);
      request.continue();
    });
    cy.intercept({ method: 'PUT', url: '**/draft-casefiles**' }, (request) => {
      putRequestSpy(request);
      request.continue();
    });
    setupRespondentDetails();
    fillRequiredIdentityAndAddress();

    cy.get(Page.respondentDetails.returnToCaseDetails).click();
    assertRouterPath(taskListPath);
    cy.get('@draftCasefilePost').should('not.have.been.called');
    cy.get('@draftCasefilePut').should('not.have.been.called');
  });

  it('AC4. should retain the last saved state when Cancel abandons a dirty working copy', { tags: buildTags() }, () => {
    setupRespondentDetails({ savedRespondent: SAVED_RESPONDENT });
    cy.on('window:confirm', (message) => {
      expect(message).to.equal(
        'WARNING: Are you sure you want to leave this page? Any information you entered will be lost.',
      );
      return true;
    });

    cy.get(Page.respondentDetails.firstNames).clear().type('Dirty working copy');
    cy.get(Page.respondentDetails.cancelLink).click();
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.respondentDetails()).to.deep.equal(SAVED_RESPONDENT);
      expect(store.taskStatuses().respondent).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).to.equal(false);
    });
  });

  it('AC5. should prevent valid Return when Countries resolves empty', { tags: buildTags() }, () => {
    setupRespondentDetails({ countries: EMPTY_COUNTRIES_RESPONSE });

    cy.get(Page.respondentDetails.firstNames).type('Test');
    cy.get(Page.respondentDetails.lastName).type('Respondent');
    cy.get(Page.respondentDetails.addressLine1).type('1 Test Street');
    cy.get(Page.respondentDetails.returnToCaseDetails).click();
    cy.get(Page.respondentDetails.errorSummary).should('be.focused').and('contain.text', 'Select a country');
    assertInlineError(Page.respondentDetails.countryError, 'Select a country');
    assertRouterPath(respondentPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.respondentDetails()).to.equal(null);
      expect(store.taskStatuses().respondent).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
    });
  });

  it(
    'AC5. should prevent respondent activation when Countries fails and preserve the task-list route',
    { tags: buildTags() },
    () => {
      const problem = {
        type: 'https://example.test/problems/countries-unavailable',
        title: 'Countries service unavailable',
        status: 503,
        detail: 'Countries could not be loaded',
        instance: '/opal-maintenance-service/countries',
        operation_id: 'OP-9801-COUNTRIES',
        retriable: true,
      };
      setupRespondentDetails({
        initialChildPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
        countries: {
          statusCode: 503,
          headers: { 'content-type': 'application/problem+json' },
          body: problem,
        },
        useHttpErrorInterceptor: true,
      });

      assertRouterPath(taskListPath);
      cy.get(Page.caseDetails.respondentLink).click();
      cy.wait('@getCountries').its('response.statusCode').should('equal', 503);
      assertRouterPath(taskListPath);
      cy.get('@globalStore').then((globalStore: GlobalStoreInstance) => {
        expect(globalStore.bannerError()).to.deep.equal({
          error: true,
          title: problem.title,
          message: problem.detail,
          operationId: problem.operation_id,
        });
      });
      cy.get('@appInsightsLogException').should('have.been.calledOnce');
    },
  );

  it(
    'AC5. should support keyboard operation through aliases, conditions, Return and Cancel',
    { tags: buildTags() },
    () => {
      setupRespondentDetails();
      cy.on('window:confirm', () => false);

      cy.get(Page.respondentDetails.addAliases).focus();
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(Page.respondentDetails.aliasFirstName(0)).should('be.focused').type('Example');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(Page.respondentDetails.aliasLastName(0)).should('be.focused').type('Alias');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(Page.respondentDetails.addAliasButton).should('be.focused');
      cy.get(Page.respondentDetails.addAliasButton).type('{enter}');
      cy.get(Page.respondentDetails.aliasFirstName(1)).should('be.focused');

      cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).focus().type(' ');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(Page.respondentDetails.thirdPartyNameOrOrganisation).should('be.focused');
      cy.get(Page.respondentDetails.addEmployerDetails).focus().type(' ');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(Page.respondentDetails.employerName).should('be.focused');
      cy.get(Page.respondentDetails.restrictedInformation).focus().type(' ');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(Page.respondentDetails.restrictedInformationReason).should('be.focused');

      cy.get(Page.respondentDetails.returnToCaseDetails).focus();
      cy.get(Page.respondentDetails.returnToCaseDetails).type('{enter}');
      cy.get(Page.respondentDetails.errorSummary).should('be.focused');
      cy.get(Page.respondentDetails.cancelLink).focus();
      cy.get(Page.respondentDetails.cancelLink).type('{enter}');
      assertRouterPath(respondentPath);
    },
  );

  it('AC5. should have no detected Axe violations in a valid expanded state', { tags: buildTags() }, () => {
    setupRespondentDetails();
    fillValidExpandedRespondent();

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC5. should have no detected Axe violations in the validation-error state', { tags: buildTags() }, () => {
    setupRespondentDetails();
    cy.get(Page.respondentDetails.addAliases).check();
    cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).check();
    cy.get(Page.respondentDetails.addEmployerDetails).check();
    cy.get(Page.respondentDetails.restrictedInformation).check();
    cy.get(Page.respondentDetails.returnToCaseDetails).click();
    cy.get(Page.respondentDetails.errorSummary).should('be.focused');

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC5. should reflow at 1280px and 320px without horizontal document overflow', { tags: buildTags() }, () => {
    for (const width of [1280, 320]) {
      cy.viewport(width, 900);
      setupRespondentDetails();
      cy.get(Page.respondentDetails.addAliases).check();
      cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).check();
      cy.get(Page.respondentDetails.addEmployerDetails).check();
      cy.get(Page.respondentDetails.restrictedInformation).check();
      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth, `${width}px document width`).to.be.at.most(
          document.documentElement.clientWidth,
        );
      });
    }
  });
});
