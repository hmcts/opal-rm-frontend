import type { Router } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-bank-types.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileApplicantIndividual } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-applicant-individual.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from 'src/app/flows/cases/cases-create-casefile/services/interfaces/cases-create-casefile-country-reference-data-response.interface';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { setupApplicantIndividual } from './setup/applicant-individual.setup';
import type { CasesCreateCasefileStoreInstance, GlobalStoreInstance } from './setup/applicant-individual.setup';

const CREATE_CASEFILE_STORY_TAG = '@JIRA-STORY:PO-9802';
const CREATE_CASEFILE_EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (...tags: string[]): string[] => [...tags, CREATE_CASEFILE_STORY_TAG, CREATE_CASEFILE_EPIC_TAG];
const applicantPath =
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantIndividual;
const taskListPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
const UNSAVED_CHANGES_WARNING =
  'WARNING: Are you sure you want to leave this page? Any information you entered will be lost.';

const SAVED_APPLICANT: ICasesCreateCasefileApplicantIndividual = {
  title: 'Mx',
  firstNames: 'Test',
  lastName: 'Applicant',
  aliases: [
    { firstNames: 'Example', lastName: 'Alias' },
    { firstNames: 'Second', lastName: 'Alias' },
  ],
  dateOfBirth: '1990-01-31',
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
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
    nameOnAccount: 'Test Applicant',
    sortCode: '123456',
    accountNumber: '12345678',
    paymentReference: 'PAY-123',
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

const assertTabMovesTo = (selector: string): void => {
  cy.press(Cypress.Keyboard.Keys.TAB);
  cy.get(selector).then(($expected) => {
    cy.focused().should(($focused) => {
      expect($focused[0], `${selector} has focus`).to.equal($expected[0]);
    });
  });
};

const selectApplicantCountry = (countryName = 'United Kingdom', countryId = 826): void => {
  cy.get(Page.applicantIndividual.countryAutocomplete).should('be.visible').clear().type(countryName);
  cy.get(Page.applicantIndividual.countryOptions).contains(countryName).click();
  cy.get(Page.applicantIndividual.countryId).should('have.value', String(countryId));
};

const fillRequiredApplicant = (): void => {
  cy.get(Page.applicantIndividual.firstNames).type('Test');
  cy.get(Page.applicantIndividual.lastName).type('Applicant');
  cy.get(Page.applicantIndividual.addressLine1).type('1 Test Street');
  selectApplicantCountry();
};

const fillUkBank = (): void => {
  cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).check();
  cy.get(Page.applicantIndividual.ukBankNameOnAccount).type('Test Applicant');
  cy.get(Page.applicantIndividual.ukBankSortCode).type('11-22-33');
  cy.get(Page.applicantIndividual.ukBankAccountNumber).type('12345678');
  cy.get(Page.applicantIndividual.ukBankPaymentReference).type('PAY-123');
};

const fillValidExpandedApplicant = (): void => {
  fillRequiredApplicant();
  cy.get(Page.applicantIndividual.addAliases).check();
  cy.get(Page.applicantIndividual.aliasFirstName(0)).type('Example');
  cy.get(Page.applicantIndividual.aliasLastName(0)).type('Alias');
  cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).check();
  cy.get(Page.applicantIndividual.thirdPartyNameOrOrganisation).type('Test Support');
  cy.get(Page.applicantIndividual.thirdPartyRelationship).type('Representative');
  cy.get(Page.applicantIndividual.thirdPartyAddressLine1).type('2 Test Street');
  cy.get(Page.applicantIndividual.thirdPartyCountry).select(String(250));
  fillUkBank();
  cy.get(Page.applicantIndividual.restrictedInformation).check();
  cy.get(Page.applicantIndividual.restrictedInformationReason).type('Synthetic restricted-information reason');
};

describe('Create Casefile Applicant Individual', () => {
  it('AC1. should render all empty controls in the documented REMO In Individual order', { tags: buildTags() }, () => {
    setupApplicantIndividual();

    cy.wait('@getCountries').its('request.method').should('equal', 'GET');
    cy.get(Page.applicantIndividual.heading).should('have.text', 'Applicant details');
    cy.get(Page.applicantIndividual.sectionHeadings).then(($headings) => {
      expect([...$headings].map((heading) => normalizeText(heading.textContent))).to.deep.equal([
        'Contact details',
        'Address',
        'Third party details',
        'Bank details',
        'Restricted information',
      ]);
    });

    for (const selector of [
      Page.applicantIndividual.title,
      Page.applicantIndividual.firstNames,
      Page.applicantIndividual.lastName,
      Page.applicantIndividual.dateOfBirth,
      Page.applicantIndividual.mainEmailAddress,
      Page.applicantIndividual.otherEmailAddress,
      Page.applicantIndividual.mainTelephoneNumber,
      Page.applicantIndividual.otherTelephoneNumber,
      Page.applicantIndividual.addressLine1,
      Page.applicantIndividual.addressLine2,
      Page.applicantIndividual.addressLine3,
      Page.applicantIndividual.addressLine4,
      Page.applicantIndividual.addressLine5,
      Page.applicantIndividual.postalOrZipCode,
      Page.applicantIndividual.countryAutocomplete,
    ]) {
      cy.get(selector).should('be.visible').and('have.value', '');
    }
    cy.get(Page.applicantIndividual.countryId).should('have.value', '');
    for (const checkbox of [
      Page.applicantIndividual.addAliases,
      Page.applicantIndividual.sendCorrespondenceToThirdParty,
      Page.applicantIndividual.restrictedInformation,
    ]) {
      cy.get(checkbox).should('be.enabled').and('not.be.checked');
    }
    cy.get(Page.applicantIndividual.bankTypeRadios).should('have.length', 3).and('not.be.checked');
    for (const conditional of [
      Page.applicantIndividual.aliasesConditional,
      Page.applicantIndividual.thirdPartyConditional,
      Page.applicantIndividual.restrictedInformationConditional,
    ]) {
      cy.get(conditional).should('not.exist');
    }
    cy.get(Page.applicantIndividual.ukBankConditional).should('not.be.visible');
    cy.get(Page.applicantIndividual.nonUkBankConditional).should('not.be.visible');
    cy.get(Page.applicantIndividual.returnToCaseDetails).should('contain.text', 'Return to case details');
    cy.get(Page.applicantIndividual.cancelLink).should('have.text', 'Cancel');
    assertDocumentOrder([
      Page.applicantIndividual.title,
      Page.applicantIndividual.firstNames,
      Page.applicantIndividual.lastName,
      Page.applicantIndividual.addAliases,
      Page.applicantIndividual.dateOfBirth,
      Page.applicantIndividual.mainEmailAddress,
      Page.applicantIndividual.otherEmailAddress,
      Page.applicantIndividual.mainTelephoneNumber,
      Page.applicantIndividual.otherTelephoneNumber,
      Page.applicantIndividual.addressLine1,
      Page.applicantIndividual.addressLine2,
      Page.applicantIndividual.addressLine3,
      Page.applicantIndividual.addressLine4,
      Page.applicantIndividual.addressLine5,
      Page.applicantIndividual.postalOrZipCode,
      Page.applicantIndividual.countryAutocomplete,
      Page.applicantIndividual.sendCorrespondenceToThirdParty,
      Page.applicantIndividual.bankTypeGroup,
      Page.applicantIndividual.restrictedInformation,
      Page.applicantIndividual.returnToCaseDetails,
      Page.applicantIndividual.cancelLink,
    ]);
  });

  it('AC1. should restore every saved applicant value and active branch', { tags: buildTags() }, () => {
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT });

    cy.get(Page.applicantIndividual.title).should('have.value', 'Mx');
    cy.get(Page.applicantIndividual.firstNames).should('have.value', 'Test');
    cy.get(Page.applicantIndividual.lastName).should('have.value', 'Applicant');
    cy.get(Page.applicantIndividual.dateOfBirth).should('have.value', '31/01/1990');
    cy.get(Page.applicantIndividual.addAliases).should('be.checked');
    cy.get(Page.applicantIndividual.aliasFirstNames).should('have.length', 2);
    cy.get(Page.applicantIndividual.aliasLastNames).should('have.length', 2);
    cy.get(Page.applicantIndividual.aliasFirstName(0)).should('have.value', 'Example');
    cy.get(Page.applicantIndividual.aliasLastName(0)).should('have.value', 'Alias');
    cy.get(Page.applicantIndividual.aliasFirstName(1)).should('have.value', 'Second');
    cy.get(Page.applicantIndividual.aliasLastName(1)).should('have.value', 'Alias');
    cy.get(Page.applicantIndividual.mainEmailAddress).should('have.value', 'test@example.com');
    cy.get(Page.applicantIndividual.otherEmailAddress).should('have.value', 'other@example.com');
    cy.get(Page.applicantIndividual.mainTelephoneNumber).should('have.value', '01234567890');
    cy.get(Page.applicantIndividual.otherTelephoneNumber).should('have.value', '09876543210');
    cy.get(Page.applicantIndividual.addressLine1).should('have.value', '1 Test Street');
    cy.get(Page.applicantIndividual.addressLine2).should('have.value', 'Test Area');
    cy.get(Page.applicantIndividual.addressLine3).should('have.value', 'Test District');
    cy.get(Page.applicantIndividual.addressLine4).should('have.value', 'Test Town');
    cy.get(Page.applicantIndividual.addressLine5).should('have.value', 'Test County');
    cy.get(Page.applicantIndividual.postalOrZipCode).should('have.value', 'TE1 1ST');
    cy.get(Page.applicantIndividual.countryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(Page.applicantIndividual.countryId).should('have.value', '826');
    cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).should('be.checked');
    cy.get(Page.applicantIndividual.thirdPartyNameOrOrganisation).should('have.value', 'Test Support');
    cy.get(Page.applicantIndividual.thirdPartyRelationship).should('have.value', 'Representative');
    cy.get(Page.applicantIndividual.thirdPartyReference).should('have.value', 'REF-1');
    cy.get(Page.applicantIndividual.thirdPartyAddressLine1).should('have.value', '2 Test Street');
    cy.get(Page.applicantIndividual.thirdPartyAddressLine2).should('have.value', 'Support Area');
    cy.get(Page.applicantIndividual.thirdPartyAddressLine3).should('have.value', 'Support District');
    cy.get(Page.applicantIndividual.thirdPartyAddressLine4).should('have.value', 'Support Town');
    cy.get(Page.applicantIndividual.thirdPartyAddressLine5).should('have.value', 'Support County');
    cy.get(Page.applicantIndividual.thirdPartyPostalOrZipCode).should('have.value', 'SU2 2ST');
    cy.get(Page.applicantIndividual.thirdPartyCountry).should('have.value', '250');
    cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).should('be.checked');
    cy.get(Page.applicantIndividual.ukBankNameOnAccount).should('have.value', 'Test Applicant');
    cy.get(Page.applicantIndividual.ukBankSortCode).should('have.value', '123456');
    cy.get(Page.applicantIndividual.ukBankAccountNumber).should('have.value', '12345678');
    cy.get(Page.applicantIndividual.ukBankPaymentReference).should('have.value', 'PAY-123');
    cy.get(Page.applicantIndividual.ukBankConditional).should('be.visible');
    cy.get(Page.applicantIndividual.nonUkBankConditional).should('not.be.visible');
    cy.get(Page.applicantIndividual.restrictedInformation).should('be.checked');
    cy.get(Page.applicantIndividual.restrictedInformationReason).should(
      'have.value',
      'Synthetic restricted-information reason',
    );
  });

  for (const caseType of [CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT, CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS]) {
    it(`AC1. should permit ${caseType} on the Individual applicant route`, { tags: buildTags() }, () => {
      setupApplicantIndividual({ caseTypeSelection: { caseType } });

      cy.get(Page.applicantIndividual.heading).should('have.text', 'Applicant details');
      assertRouterPath(applicantPath);
    });
  }

  it('AC1. should block REMO In Organisation from the Individual applicant route', { tags: buildTags() }, () => {
    setupApplicantIndividual({
      caseTypeSelection: {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
      },
    });

    assertRouterPath(taskListPath);
    cy.get(Page.caseDetails.heading).should('have.text', 'Case details');
  });

  it('AC2. should add, remove and clear aliases and stop at five', { tags: buildTags() }, () => {
    setupApplicantIndividual();

    cy.get(Page.applicantIndividual.addAliases).check();
    cy.get(Page.applicantIndividual.aliasFirstName(0)).should('be.focused').type('First');
    cy.get(Page.applicantIndividual.aliasLastName(0)).type('Alias');
    cy.get(Page.applicantIndividual.addAliasButton).click();
    cy.get(Page.applicantIndividual.aliasFirstName(1)).should('be.focused').type('Second');
    cy.get(Page.applicantIndividual.aliasLastName(1)).type('Alias');
    cy.get(Page.applicantIndividual.removeAliasLink).click();
    cy.get(Page.applicantIndividual.aliasFirstNames).should('have.length', 1);
    cy.get(Page.applicantIndividual.aliasFirstName(0)).should('be.focused').and('have.value', 'First');

    for (let index = 1; index < 5; index += 1) {
      cy.get(Page.applicantIndividual.addAliasButton).click();
      cy.get(Page.applicantIndividual.aliasFirstName(index)).should('be.focused');
    }
    cy.get(Page.applicantIndividual.aliasFirstNames).should('have.length', 5);
    cy.get(Page.applicantIndividual.aliasLastNames).should('have.length', 5);
    cy.get(Page.applicantIndividual.addAliasButton).should('not.exist');

    cy.get(Page.applicantIndividual.addAliases).uncheck();
    cy.get(Page.applicantIndividual.aliasesConditional).should('not.exist');
    cy.get(Page.applicantIndividual.addAliases).check();
    cy.get(Page.applicantIndividual.aliasFirstNames).should('have.length', 1);
    cy.get(Page.applicantIndividual.aliasFirstName(0)).should('have.value', '');
    cy.get(Page.applicantIndividual.aliasLastName(0)).should('have.value', '');
  });

  it('AC2. should require and clear third-party and restriction branches', { tags: buildTags() }, () => {
    setupApplicantIndividual();

    cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).check();
    cy.get(Page.applicantIndividual.restrictedInformation).check();
    cy.get(Page.applicantIndividual.returnToCaseDetails).click();
    assertInlineError(Page.applicantIndividual.thirdPartyNameOrOrganisationError, 'Enter name or organisation');
    assertInlineError(Page.applicantIndividual.thirdPartyRelationshipError, 'Enter relationship to the applicant');
    assertInlineError(Page.applicantIndividual.thirdPartyAddressLine1Error, 'Enter an address');
    assertInlineError(Page.applicantIndividual.thirdPartyCountryError, 'Select a country');
    assertInlineError(Page.applicantIndividual.restrictedInformationReasonError, 'Enter a reason');

    cy.get(Page.applicantIndividual.thirdPartyNameOrOrganisation).type('Stale third party');
    cy.get(Page.applicantIndividual.thirdPartyRelationship).type('Stale relationship');
    cy.get(Page.applicantIndividual.thirdPartyAddressLine1).type('Stale address');
    cy.get(Page.applicantIndividual.thirdPartyCountry).select(String(250));
    cy.get(Page.applicantIndividual.restrictedInformationReason).type('Stale reason');
    cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).uncheck().check();
    cy.get(Page.applicantIndividual.thirdPartyNameOrOrganisation).should('have.value', '');
    cy.get(Page.applicantIndividual.thirdPartyRelationship).should('have.value', '');
    cy.get(Page.applicantIndividual.thirdPartyAddressLine1).should('have.value', '');
    cy.get(Page.applicantIndividual.thirdPartyCountry).should('not.have.value', '250');
    cy.get(Page.applicantIndividual.restrictedInformation).uncheck().check();
    cy.get(Page.applicantIndividual.restrictedInformationReason).should('have.value', '');
  });

  it('AC2, AC4. should save only active UK bank data and return with Applicant Provided', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('draftCasefilePost');
    const putRequestSpy = cy.spy().as('draftCasefilePut');
    cy.intercept({ method: 'POST', url: '**/draft-casefiles**' }, postRequestSpy);
    cy.intercept({ method: 'PUT', url: '**/draft-casefiles**' }, putRequestSpy);
    setupApplicantIndividual();
    fillRequiredApplicant();
    fillUkBank();

    cy.get(Page.applicantIndividual.returnToCaseDetails).click();
    assertRouterPath(taskListPath);
    cy.get(Page.caseDetails.applicantStatus)
      .invoke('text')
      .then((text) => expect(text.trim()).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED));
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.applicantDetails()).to.deep.equal({
        title: null,
        firstNames: 'Test',
        lastName: 'Applicant',
        aliases: [],
        dateOfBirth: null,
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
        thirdParty: null,
        bankDetails: {
          type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
          nameOnAccount: 'Test Applicant',
          sortCode: '112233',
          accountNumber: '12345678',
          paymentReference: 'PAY-123',
        },
        restrictedInformation: { restricted: false, reason: null },
      });
      expect(store.taskStatuses().applicant).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).to.equal(false);
      expect(store.stateChanges()).to.equal(true);
    });
    cy.get('@draftCasefilePost').should('not.have.been.called');
    cy.get('@draftCasefilePut').should('not.have.been.called');
  });

  it('AC2. should save non-UK bank data by BIC and clear inactive UK values', { tags: buildTags() }, () => {
    setupApplicantIndividual();
    fillRequiredApplicant();
    fillUkBank();
    cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK)).check();
    cy.get(Page.applicantIndividual.ukBankConditional).should('not.be.visible');
    cy.get(Page.applicantIndividual.nonUkBankConditional).should('be.visible');
    cy.get(Page.applicantIndividual.nonUkBankNameOnAccount).type('Test Applicant');
    cy.get(Page.applicantIndividual.nonUkBankAccountNumber).type('NONUK123');
    cy.get(Page.applicantIndividual.nonUkBankPaymentReference).type('PAY-NONUK');
    cy.get(Page.applicantIndividual.nonUkBankBicSwiftCode).type('ABCDEFGH');
    cy.get(Page.applicantIndividual.nonUkBankName).type('Test Bank');
    cy.get(Page.applicantIndividual.nonUkBankBranchSortCode).type('123456');

    cy.get(Page.applicantIndividual.returnToCaseDetails).click();
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.applicantDetails()?.bankDetails).to.deep.equal({
        type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        nameOnAccount: 'Test Applicant',
        accountNumber: 'NONUK123',
        paymentReference: 'PAY-NONUK',
        bicSwiftCode: 'ABCDEFGH',
        iban: null,
        bankName: 'Test Bank',
        branchSortCode: '123456',
      });
    });
  });

  it('AC2. should save non-UK bank data by IBAN without inactive BIC data', { tags: buildTags() }, () => {
    setupApplicantIndividual();
    fillRequiredApplicant();
    cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK)).check();
    cy.get(Page.applicantIndividual.nonUkBankNameOnAccount).type('Test Applicant');
    cy.get(Page.applicantIndividual.nonUkBankIban).type('GB82WEST12345698765432');

    cy.get(Page.applicantIndividual.returnToCaseDetails).click();
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.applicantDetails()?.bankDetails).to.deep.equal({
        type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        nameOnAccount: 'Test Applicant',
        accountNumber: null,
        paymentReference: null,
        bicSwiftCode: null,
        iban: 'GB82WEST12345698765432',
        bankName: null,
        branchSortCode: null,
      });
    });
  });

  it('AC2. should save None and discard previously entered bank values', { tags: buildTags() }, () => {
    setupApplicantIndividual();
    fillRequiredApplicant();
    fillUkBank();
    cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE)).check();
    cy.get(Page.applicantIndividual.ukBankConditional).should('not.be.visible');
    cy.get(Page.applicantIndividual.nonUkBankConditional).should('not.be.visible');

    cy.get(Page.applicantIndividual.returnToCaseDetails).click();
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.applicantDetails()?.bankDetails).to.deep.equal({
        type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE,
      });
    });
  });

  it(
    'AC3, EMAC. should show every active exact error and focus summary links on their fields',
    { tags: buildTags() },
    () => {
      setupApplicantIndividual();
      cy.get(Page.applicantIndividual.addAliases).check();
      cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).check();
      cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).check();
      cy.get(Page.applicantIndividual.restrictedInformation).check();
      cy.get(Page.applicantIndividual.returnToCaseDetails).click();

      const expectedErrors = [
        'Enter applicant’s first name(s)',
        'Enter applicant’s last name',
        'Enter alias first name(s)',
        'Enter alias last name',
        'Enter an address',
        'Select a country',
        'Enter name or organisation',
        'Enter relationship to the applicant',
        'Enter an address',
        'Select a country',
        'Enter name on account',
        'Enter sort code',
        'Enter account number',
        'Enter UK bank account payment reference',
        'Enter a reason',
      ];
      cy.get(Page.applicantIndividual.errorSummary).should('be.focused').and('contain.text', 'There is a problem');
      cy.get(Page.applicantIndividual.errorSummaryLinks).then(($links) => {
        expect([...$links].map((link) => normalizeText(link.textContent))).to.deep.equal(expectedErrors);
      });
      const inlineErrors: [string, string][] = [
        [Page.applicantIndividual.firstNamesError, expectedErrors[0]],
        [Page.applicantIndividual.lastNameError, expectedErrors[1]],
        [Page.applicantIndividual.aliasFirstNameError(0), expectedErrors[2]],
        [Page.applicantIndividual.aliasLastNameError(0), expectedErrors[3]],
        [Page.applicantIndividual.addressLine1Error, expectedErrors[4]],
        [Page.applicantIndividual.countryError, expectedErrors[5]],
        [Page.applicantIndividual.thirdPartyNameOrOrganisationError, expectedErrors[6]],
        [Page.applicantIndividual.thirdPartyRelationshipError, expectedErrors[7]],
        [Page.applicantIndividual.thirdPartyAddressLine1Error, expectedErrors[8]],
        [Page.applicantIndividual.thirdPartyCountryError, expectedErrors[9]],
        [Page.applicantIndividual.ukBankNameOnAccountError, expectedErrors[10]],
        [Page.applicantIndividual.ukBankSortCodeError, expectedErrors[11]],
        [Page.applicantIndividual.ukBankAccountNumberError, expectedErrors[12]],
        [Page.applicantIndividual.ukBankPaymentReferenceError, expectedErrors[13]],
        [Page.applicantIndividual.restrictedInformationReasonError, expectedErrors[14]],
      ];
      for (const [selector, message] of inlineErrors) {
        assertInlineError(selector, message);
      }

      const errorSummaryFocusMappings: Array<{ message: string; controlSelector: string }> = [
        { message: expectedErrors[0], controlSelector: Page.applicantIndividual.firstNames },
        { message: expectedErrors[1], controlSelector: Page.applicantIndividual.lastName },
        { message: expectedErrors[2], controlSelector: Page.applicantIndividual.aliasFirstName(0) },
        { message: expectedErrors[3], controlSelector: Page.applicantIndividual.aliasLastName(0) },
        { message: expectedErrors[4], controlSelector: Page.applicantIndividual.addressLine1 },
        { message: expectedErrors[5], controlSelector: Page.applicantIndividual.countryAutocomplete },
        { message: expectedErrors[6], controlSelector: Page.applicantIndividual.thirdPartyNameOrOrganisation },
        { message: expectedErrors[7], controlSelector: Page.applicantIndividual.thirdPartyRelationship },
        { message: expectedErrors[8], controlSelector: Page.applicantIndividual.thirdPartyAddressLine1 },
        { message: expectedErrors[9], controlSelector: Page.applicantIndividual.thirdPartyCountry },
        { message: expectedErrors[10], controlSelector: Page.applicantIndividual.ukBankNameOnAccount },
        { message: expectedErrors[11], controlSelector: Page.applicantIndividual.ukBankSortCode },
        { message: expectedErrors[12], controlSelector: Page.applicantIndividual.ukBankAccountNumber },
        { message: expectedErrors[13], controlSelector: Page.applicantIndividual.ukBankPaymentReference },
        { message: expectedErrors[14], controlSelector: Page.applicantIndividual.restrictedInformationReason },
      ];
      const remainingFocusMappings = [...errorSummaryFocusMappings];
      cy.get(Page.applicantIndividual.errorSummaryLinks)
        .should('have.length', errorSummaryFocusMappings.length)
        .each(($link) => {
          const mapping = remainingFocusMappings.shift();
          if (!mapping) {
            throw new Error('Expected a focus mapping for each rendered summary link');
          }
          expect(normalizeText($link.text())).to.equal(mapping.message);
          cy.wrap($link).click();
          cy.get(mapping.controlSelector).should('be.focused');
        })
        .then(() => {
          expect(remainingFocusMappings).to.be.empty;
        });
    },
  );

  it('AC4, RGAC. should reject dirty Cancel, warn exactly and preserve the last save', { tags: buildTags() }, () => {
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT });
    const rejectCancelConfirm = cy.stub().as('rejectCancelConfirm').returns(false);
    cy.on('window:confirm', rejectCancelConfirm);

    cy.get(Page.applicantIndividual.firstNames).clear().type('Dirty working copy');
    cy.get(Page.applicantIndividual.cancelLink).click();

    cy.get('@rejectCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(applicantPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.applicantDetails()).to.deep.equal(SAVED_APPLICANT);
      expect(store.taskStatuses().applicant).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).to.equal(true);
    });
  });

  it('AC4, RGAC. should guard alias-only edits and preserve the last save when rejected', { tags: buildTags() }, () => {
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT });
    const rejectAliasConfirm = cy.stub().as('rejectAliasConfirm').returns(false);
    cy.on('window:confirm', rejectAliasConfirm);

    cy.get(Page.applicantIndividual.addAliasButton).click();
    cy.get(Page.applicantIndividual.aliasFirstName(2)).should('be.focused');
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.unsavedChanges()).to.equal(true);
    });
    cy.get(Page.applicantIndividual.cancelLink).click();

    cy.get('@rejectAliasConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(applicantPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.applicantDetails()).to.deep.equal(SAVED_APPLICANT);
    });
  });

  it('AC5. should cancel empty-Countries activation, show the generic banner and retry', { tags: buildTags() }, () => {
    setupApplicantIndividual({
      initialChildPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
      countries: EMPTY_COUNTRIES_RESPONSE,
      useAppShell: true,
    });

    assertRouterPath(taskListPath);
    cy.get(Page.caseDetails.applicantLink).click();
    cy.wait('@getCountries').its('response.statusCode').should('equal', 200);
    assertRouterPath(taskListPath);
    cy.get('@globalStore').should((globalStore: GlobalStoreInstance) => {
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

    cy.get(Page.caseDetails.applicantLink).click();
    cy.wait('@getCountries').its('response.statusCode').should('equal', 200);
    assertRouterPath(taskListPath);
    cy.get('@getCountries.all').should('have.length', 2);
  });

  it(
    'AC5. should cancel failed-Countries activation and show the correlated Problem banner',
    { tags: buildTags() },
    () => {
      const problem = {
        type: 'https://example.test/problems/countries-unavailable',
        title: 'Countries service unavailable',
        status: 503,
        detail: 'Countries could not be loaded',
        instance: '/opal-maintenance-service/countries',
        operation_id: 'OP-9802-COUNTRIES',
        retriable: true,
      };
      setupApplicantIndividual({
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
      cy.get(Page.caseDetails.applicantLink).click();
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
      cy.get(Page.globalErrorBannerHeading).should('have.text', problem.title);
      cy.get(Page.globalErrorBannerContent)
        .should('contain.text', problem.detail)
        .and('contain.text', `Error code: ${problem.operation_id}`);
      cy.get('@appInsightsLogException').should('have.been.calledOnce');
    },
  );

  it('AC5. should support keyboard operation across branches, Return and Cancel', { tags: buildTags() }, () => {
    setupApplicantIndividual();
    const rejectCancelConfirm = cy.stub().as('rejectKeyboardCancelConfirm').returns(false);
    cy.on('window:confirm', rejectCancelConfirm);

    cy.get(Page.applicantIndividual.addAliases).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(Page.applicantIndividual.aliasFirstName(0)).should('be.focused').type('Example');
    assertTabMovesTo(Page.applicantIndividual.aliasLastName(0));
    cy.get(Page.applicantIndividual.aliasLastName(0)).type('Alias');
    assertTabMovesTo(Page.applicantIndividual.addAliasButton);
    for (const selector of [
      Page.applicantIndividual.dateOfBirth,
      Page.applicantIndividual.dateOfBirthCalendarButton,
      Page.applicantIndividual.mainEmailAddress,
      Page.applicantIndividual.otherEmailAddress,
      Page.applicantIndividual.mainTelephoneNumber,
      Page.applicantIndividual.otherTelephoneNumber,
      Page.applicantIndividual.addressLine1,
      Page.applicantIndividual.addressLine2,
      Page.applicantIndividual.addressLine3,
      Page.applicantIndividual.addressLine4,
      Page.applicantIndividual.addressLine5,
      Page.applicantIndividual.postalOrZipCode,
      Page.applicantIndividual.countryAutocomplete,
      Page.applicantIndividual.sendCorrespondenceToThirdParty,
    ]) {
      assertTabMovesTo(selector);
    }
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).should('be.checked');
    cy.get(Page.applicantIndividual.thirdPartyConditional).should('be.visible');
    for (const selector of [
      Page.applicantIndividual.thirdPartyNameOrOrganisation,
      Page.applicantIndividual.thirdPartyRelationship,
      Page.applicantIndividual.thirdPartyReference,
      Page.applicantIndividual.thirdPartyAddressLine1,
      Page.applicantIndividual.thirdPartyAddressLine2,
      Page.applicantIndividual.thirdPartyAddressLine3,
      Page.applicantIndividual.thirdPartyAddressLine4,
      Page.applicantIndividual.thirdPartyAddressLine5,
      Page.applicantIndividual.thirdPartyPostalOrZipCode,
      Page.applicantIndividual.thirdPartyCountry,
      Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK),
    ]) {
      assertTabMovesTo(selector);
    }
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).should('be.checked');
    cy.get(Page.applicantIndividual.ukBankConditional).should('be.visible');
    for (const selector of [
      Page.applicantIndividual.ukBankNameOnAccount,
      Page.applicantIndividual.ukBankSortCode,
      Page.applicantIndividual.ukBankAccountNumber,
      Page.applicantIndividual.ukBankPaymentReference,
      Page.applicantIndividual.restrictedInformation,
    ]) {
      assertTabMovesTo(selector);
    }
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(Page.applicantIndividual.restrictedInformation).should('be.checked');
    cy.get(Page.applicantIndividual.restrictedInformationConditional).should('be.visible');
    assertTabMovesTo(Page.applicantIndividual.restrictedInformationReason);
    assertTabMovesTo(Page.applicantIndividual.returnToCaseDetails);
    assertTabMovesTo(Page.applicantIndividual.cancelLink);
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get('@rejectKeyboardCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(applicantPath);
  });

  it('AC5. should have no detectable Axe violations in a valid expanded state', { tags: buildTags() }, () => {
    setupApplicantIndividual();
    fillValidExpandedApplicant();

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC5. should have no detectable Axe violations in the validation-error state', { tags: buildTags() }, () => {
    setupApplicantIndividual();
    cy.get(Page.applicantIndividual.addAliases).check();
    cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).check();
    cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).check();
    cy.get(Page.applicantIndividual.restrictedInformation).check();
    cy.get(Page.applicantIndividual.returnToCaseDetails).click();
    cy.get(Page.applicantIndividual.errorSummary).should('be.focused');

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it(
    'AC5. should retain content and operation at 320px without horizontal document overflow',
    { tags: buildTags() },
    () => {
      cy.viewport(320, 900);
      setupApplicantIndividual();
      cy.get(Page.applicantIndividual.addAliases).check();
      cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).check();
      cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK)).check();
      cy.get(Page.applicantIndividual.restrictedInformation).check();

      cy.get(Page.applicantIndividual.heading).should('be.visible');
      cy.get(Page.applicantIndividual.returnToCaseDetails).should('be.visible');
      cy.get(Page.applicantIndividual.cancelLink).should('be.visible');
      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
      });
    },
  );
});
