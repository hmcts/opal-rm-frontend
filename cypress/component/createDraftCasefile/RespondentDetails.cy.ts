import type { Router } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
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
const UNSAVED_CHANGES_WARNING =
  'WARNING: Are you sure you want to leave this page? Any information you entered will be lost.';

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
    otherEmailAddress: 'other@example.com',
    mainTelephoneNumber: '01234567890',
    otherTelephoneNumber: '09876543210',
    address: {
      addressLine1: '1 Test Street',
      addressLine2: 'Test Area',
      addressLine3: 'Test District',
      addressLine4: 'Test Town',
      addressLine5: 'Test County',
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
      addressLine2: 'Support Area',
      addressLine3: 'Support District',
      addressLine4: 'Support Town',
      addressLine5: 'Support County',
      postalOrZipCode: 'SU2 2ST',
      countryId: 250,
    },
  },
  employer: {
    employerName: 'Test Employer',
    employeeReference: 'EMP-1',
    emailAddress: 'employer@example.com',
    telephoneNumber: '01111111111',
    address: {
      addressLine1: '3 Test Street',
      addressLine2: 'Employer Area',
      addressLine3: 'Employer District',
      addressLine4: 'Employer Town',
      addressLine5: 'Employer County',
      postalOrZipCode: 'EM3 3ST',
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
  cy.get('@angularRouter').should((router: Router) => {
    expect(router.url).to.equal(expectedPath);
  });
};

const assertDocumentOrder = (selectors: string[]): void => {
  cy.document().then((document) => {
    const elements = selectors.map((selector) => {
      const element = document.querySelector(selector);
      expect(element, `${selector} exists`).not.to.equal(null);
      return element!;
    });

    for (let index = 1; index < elements.length; index += 1) {
      expect(
        Boolean(elements[index - 1].compareDocumentPosition(elements[index]) & Node.DOCUMENT_POSITION_FOLLOWING),
        `${selectors[index - 1]} precedes ${selectors[index]}`,
      ).to.equal(true);
    }
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
    const initialTextControls = [
      Page.respondentDetails.title,
      Page.respondentDetails.firstNames,
      Page.respondentDetails.lastName,
      Page.respondentDetails.dateOfBirth,
      Page.respondentDetails.nationalInsuranceNumber,
      Page.respondentDetails.otherPersonalInformation,
      Page.respondentDetails.mainEmailAddress,
      Page.respondentDetails.otherEmailAddress,
      Page.respondentDetails.mainTelephoneNumber,
      Page.respondentDetails.otherTelephoneNumber,
      Page.respondentDetails.addressLine1,
      Page.respondentDetails.addressLine2,
      Page.respondentDetails.addressLine3,
      Page.respondentDetails.addressLine4,
      Page.respondentDetails.addressLine5,
      Page.respondentDetails.postalOrZipCode,
      Page.respondentDetails.countryAutocomplete,
    ];
    for (const selector of initialTextControls) {
      cy.get(selector).should('be.visible').and('have.value', '');
    }
    cy.get(Page.respondentDetails.countryId).should('have.value', '');
    for (const checkbox of [
      Page.respondentDetails.addAliases,
      Page.respondentDetails.sendCorrespondenceToThirdParty,
      Page.respondentDetails.addEmployerDetails,
      Page.respondentDetails.restrictedInformation,
    ]) {
      cy.get(checkbox).should('be.enabled').and('not.be.checked');
    }
    for (const conditional of [
      Page.respondentDetails.aliasesConditional,
      Page.respondentDetails.thirdPartyConditional,
      Page.respondentDetails.employerConditional,
      Page.respondentDetails.restrictedInformationConditional,
    ]) {
      cy.get(conditional).should('not.exist');
    }
    cy.get(Page.respondentDetails.addAliasButton).should('not.exist');
    cy.get(Page.respondentDetails.returnToCaseDetails)
      .invoke('text')
      .then((text) => expect(normalizeText(text)).to.equal('Return to case details'));
    cy.get(Page.respondentDetails.cancelLink).should('have.text', 'Cancel');
    assertDocumentOrder([
      Page.respondentDetails.title,
      Page.respondentDetails.firstNames,
      Page.respondentDetails.lastName,
      Page.respondentDetails.addAliases,
      Page.respondentDetails.dateOfBirth,
      Page.respondentDetails.nationalInsuranceNumber,
      Page.respondentDetails.otherPersonalInformation,
      Page.respondentDetails.mainEmailAddress,
      Page.respondentDetails.otherEmailAddress,
      Page.respondentDetails.mainTelephoneNumber,
      Page.respondentDetails.otherTelephoneNumber,
      Page.respondentDetails.addressLine1,
      Page.respondentDetails.addressLine2,
      Page.respondentDetails.addressLine3,
      Page.respondentDetails.addressLine4,
      Page.respondentDetails.addressLine5,
      Page.respondentDetails.postalOrZipCode,
      Page.respondentDetails.countryAutocomplete,
      Page.respondentDetails.sendCorrespondenceToThirdParty,
      Page.respondentDetails.addEmployerDetails,
      Page.respondentDetails.restrictedInformation,
      Page.respondentDetails.returnToCaseDetails,
      Page.respondentDetails.cancelLink,
    ]);
  });

  it('AC1. should rehydrate saved identity, aliases, Countries and conditional objects', { tags: buildTags() }, () => {
    setupRespondentDetails({ savedRespondent: SAVED_RESPONDENT });

    cy.get(Page.respondentDetails.title).should('have.value', 'Mx');
    cy.get(Page.respondentDetails.firstNames).should('have.value', 'Test');
    cy.get(Page.respondentDetails.lastName).should('have.value', 'Respondent');
    cy.get(Page.respondentDetails.dateOfBirth).should('have.value', '31/01/1990');
    cy.get(Page.respondentDetails.nationalInsuranceNumber).should('have.value', 'QQ123456C');
    cy.get(Page.respondentDetails.otherPersonalInformation).should('have.value', 'Synthetic test information');
    cy.get(Page.respondentDetails.addAliases).should('be.checked');
    cy.get(Page.respondentDetails.aliasFirstNames).should('have.length', 2);
    cy.get(Page.respondentDetails.aliasLastNames).should('have.length', 2);
    cy.get(Page.respondentDetails.aliasFirstName(0)).should('have.value', 'Example');
    cy.get(Page.respondentDetails.aliasLastName(0)).should('have.value', 'Alias');
    cy.get(Page.respondentDetails.aliasFirstName(1)).should('have.value', 'Second');
    cy.get(Page.respondentDetails.aliasLastName(1)).should('have.value', 'Alias');
    cy.get(Page.respondentDetails.aliasesConditional).should('be.visible');
    cy.get(Page.respondentDetails.mainEmailAddress).should('have.value', 'test@example.com');
    cy.get(Page.respondentDetails.otherEmailAddress).should('have.value', 'other@example.com');
    cy.get(Page.respondentDetails.mainTelephoneNumber).should('have.value', '01234567890');
    cy.get(Page.respondentDetails.otherTelephoneNumber).should('have.value', '09876543210');
    cy.get(Page.respondentDetails.addressLine1).should('have.value', '1 Test Street');
    cy.get(Page.respondentDetails.addressLine2).should('have.value', 'Test Area');
    cy.get(Page.respondentDetails.addressLine3).should('have.value', 'Test District');
    cy.get(Page.respondentDetails.addressLine4).should('have.value', 'Test Town');
    cy.get(Page.respondentDetails.addressLine5).should('have.value', 'Test County');
    cy.get(Page.respondentDetails.postalOrZipCode).should('have.value', 'TE1 1ST');
    cy.get(Page.respondentDetails.countryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(Page.respondentDetails.countryId).should('have.value', '826');
    cy.get(Page.respondentDetails.sendCorrespondenceToThirdParty).should('be.checked');
    cy.get(Page.respondentDetails.thirdPartyConditional).should('be.visible');
    cy.get(Page.respondentDetails.thirdPartyNameOrOrganisation).should('have.value', 'Test Support');
    cy.get(Page.respondentDetails.thirdPartyRelationship).should('have.value', 'Representative');
    cy.get(Page.respondentDetails.thirdPartyReference).should('have.value', 'REF-1');
    cy.get(Page.respondentDetails.thirdPartyAddressLine1).should('have.value', '2 Test Street');
    cy.get(Page.respondentDetails.thirdPartyAddressLine2).should('have.value', 'Support Area');
    cy.get(Page.respondentDetails.thirdPartyAddressLine3).should('have.value', 'Support District');
    cy.get(Page.respondentDetails.thirdPartyAddressLine4).should('have.value', 'Support Town');
    cy.get(Page.respondentDetails.thirdPartyAddressLine5).should('have.value', 'Support County');
    cy.get(Page.respondentDetails.thirdPartyPostalOrZipCode).should('have.value', 'SU2 2ST');
    cy.get(Page.respondentDetails.thirdPartyCountry).should('have.value', '250');
    cy.get(Page.respondentDetails.addEmployerDetails).should('be.checked');
    cy.get(Page.respondentDetails.employerConditional).should('be.visible');
    cy.get(Page.respondentDetails.employerName).should('have.value', 'Test Employer');
    cy.get(Page.respondentDetails.employeeReference).should('have.value', 'EMP-1');
    cy.get(Page.respondentDetails.employerEmailAddress).should('have.value', 'employer@example.com');
    cy.get(Page.respondentDetails.employerTelephoneNumber).should('have.value', '01111111111');
    cy.get(Page.respondentDetails.employerAddressLine1).should('have.value', '3 Test Street');
    cy.get(Page.respondentDetails.employerAddressLine2).should('have.value', 'Employer Area');
    cy.get(Page.respondentDetails.employerAddressLine3).should('have.value', 'Employer District');
    cy.get(Page.respondentDetails.employerAddressLine4).should('have.value', 'Employer Town');
    cy.get(Page.respondentDetails.employerAddressLine5).should('have.value', 'Employer County');
    cy.get(Page.respondentDetails.employerPostalOrZipCode).should('have.value', 'EM3 3ST');
    cy.get(Page.respondentDetails.employerCountryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(Page.respondentDetails.employerCountryId).should('have.value', '826');
    cy.get(Page.respondentDetails.restrictedInformation).should('be.checked');
    cy.get(Page.respondentDetails.restrictedInformationConditional).should('be.visible');
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
      cy.get(Page.respondentDetails.aliasLastName(0)).type('Alias');
      for (let index = 1; index < 5; index += 1) {
        cy.get(Page.respondentDetails.addAliasButton).click();
        cy.get(Page.respondentDetails.aliasFirstName(index)).should('be.focused');
        if (index === 1) {
          cy.get(Page.respondentDetails.aliasFirstName(index)).type('Second');
          cy.get(Page.respondentDetails.aliasLastName(index)).type('Alias');
        }
      }
      cy.get(Page.respondentDetails.aliasFirstNames).should('have.length', 5);
      cy.get(Page.respondentDetails.aliasLastNames).should('have.length', 5);
      cy.get(Page.respondentDetails.addAliasButton).should('not.exist');

      cy.get(Page.respondentDetails.addAliases).uncheck();
      cy.get(Page.respondentDetails.aliasesConditional).should('not.exist');
      cy.get(Page.respondentDetails.aliasFirstNames).should('not.exist');
      cy.get(Page.respondentDetails.aliasLastNames).should('not.exist');

      cy.get(Page.respondentDetails.addAliases).check();
      cy.get(Page.respondentDetails.aliasFirstNames).should('have.length', 1);
      cy.get(Page.respondentDetails.aliasLastNames).should('have.length', 1);
      cy.get(Page.respondentDetails.aliasFirstName(0)).should('have.value', '');
      cy.get(Page.respondentDetails.aliasLastName(0)).should('have.value', '');
      cy.get(Page.respondentDetails.aliasFirstName(1)).should('not.exist');
      cy.get(Page.respondentDetails.aliasLastName(1)).should('not.exist');
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
    const acceptCancelConfirm = cy.stub().as('acceptCancelConfirm').returns(true);
    cy.on('window:confirm', acceptCancelConfirm);

    cy.get(Page.respondentDetails.firstNames).clear().type('Dirty working copy');
    cy.get(Page.respondentDetails.cancelLink).click();
    cy.get('@acceptCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.respondentDetails()).to.deep.equal(SAVED_RESPONDENT);
      expect(store.taskStatuses().respondent).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).to.equal(false);
    });
  });

  it('AC4. should guard alias-only addition from a saved pristine form', { tags: buildTags() }, () => {
    setupRespondentDetails({ savedRespondent: SAVED_RESPONDENT });
    const rejectCancelConfirm = cy.stub().as('rejectAliasAdditionConfirm').returns(false);
    cy.on('window:confirm', rejectCancelConfirm);

    cy.get(Page.respondentDetails.addAliasButton).click();
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.unsavedChanges()).to.equal(true);
    });
    cy.get(Page.respondentDetails.cancelLink).click();

    cy.get('@rejectAliasAdditionConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(respondentPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.respondentDetails()).to.deep.equal(SAVED_RESPONDENT);
    });
  });

  it('AC4, AC5. should guard alias-only removal and focus the remaining alias', { tags: buildTags() }, () => {
    setupRespondentDetails({ savedRespondent: SAVED_RESPONDENT });
    const rejectCancelConfirm = cy.stub().as('rejectAliasRemovalConfirm').returns(false);
    cy.on('window:confirm', rejectCancelConfirm);

    cy.get(Page.respondentDetails.removeAliasLink).click();
    cy.get(Page.respondentDetails.aliasFirstName(0)).should('be.focused');
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.unsavedChanges()).to.equal(true);
    });
    cy.get(Page.respondentDetails.cancelLink).click();

    cy.get('@rejectAliasRemovalConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(respondentPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.respondentDetails()).to.deep.equal(SAVED_RESPONDENT);
    });
  });

  it('AC5. should prevent activation and allow retry when Countries resolves empty', { tags: buildTags() }, () => {
    setupRespondentDetails({
      initialChildPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
      countries: EMPTY_COUNTRIES_RESPONSE,
      useAppShell: true,
    });

    assertRouterPath(taskListPath);
    cy.get(Page.caseDetails.respondentLink).click();
    cy.wait('@getCountries').its('response.statusCode').should('equal', 200);
    assertRouterPath(taskListPath);
    cy.get('@globalStore').then((globalStore: GlobalStoreInstance) => {
      expect(globalStore.bannerError()).to.deep.equal({
        error: true,
        title: GENERIC_HTTP_ERROR_TITLE,
        message: GENERIC_HTTP_ERROR_MESSAGE,
        operationId: null,
      });
    });
    cy.get(Page.globalErrorBanner).should('be.visible');
    cy.get(Page.globalErrorBannerHeading).should('have.text', GENERIC_HTTP_ERROR_TITLE);
    cy.get(Page.globalErrorBannerContent)
      .should('contain.text', GENERIC_HTTP_ERROR_MESSAGE)
      .and('not.contain.text', 'Error code:');

    cy.get(Page.caseDetails.respondentLink).click();
    cy.wait('@getCountries').its('response.statusCode').should('equal', 200);
    assertRouterPath(taskListPath);
    cy.get('@getCountries.all').should('have.length', 2);
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
        useAppShell: true,
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
      cy.get(Page.globalErrorBanner).should('be.visible');
      cy.get(Page.globalErrorBannerHeading).should('have.text', problem.title);
      cy.get(Page.globalErrorBannerContent)
        .should('contain.text', problem.detail)
        .and('contain.text', `Error code: ${problem.operation_id}`);
      cy.get('@appInsightsLogException').should('have.been.calledOnce');
    },
  );

  it(
    'AC5. should support keyboard operation through aliases, conditions, Return and Cancel',
    { tags: buildTags() },
    () => {
      setupRespondentDetails();
      const rejectCancelConfirm = cy.stub().as('rejectCancelConfirm').returns(false);
      cy.on('window:confirm', rejectCancelConfirm);

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
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.get('@rejectCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
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
