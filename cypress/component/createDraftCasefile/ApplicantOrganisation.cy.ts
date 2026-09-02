import type { Router } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-bank-types.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileApplicantOrganisation } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-applicant-organisation.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from 'src/app/flows/cases/cases-create-casefile/services/interfaces/cases-create-casefile-country-reference-data-response.interface';
import type { CasesCreateCasefileCaseTypeSelection } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-case-type-selection.type';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { setupApplicantOrganisation } from './setup/applicant-organisation.setup';
import type { CasesCreateCasefileStoreInstance, GlobalStoreInstance } from './setup/applicant-organisation.setup';

const STORY_TAG = '@JIRA-STORY:PO-9803';
const EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (...tags: string[]): string[] => [...tags, STORY_TAG, EPIC_TAG];
const applicantPath =
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantOrganisation;
const taskListPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
const UNSAVED_CHANGES_WARNING =
  'WARNING: Are you sure you want to leave this page? Any information you entered will be lost.';
const DRAFT_CASEFILE_WRITE_URL = /\/draft-casefiles(?:[/?#]|$)/;

const SAVED_APPLICANT: ICasesCreateCasefileApplicantOrganisation = {
  organisationName: 'Test Organisation',
  foreignAuthorityReference: 'FA-9803',
  contactDetails: {
    mainEmailAddress: 'main@example.com',
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
  bankDetails: {
    type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
    nameOnAccount: 'Test Organisation',
    sortCode: '112233',
    accountNumber: '12345678',
    paymentReference: 'PAY-9803',
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
  cy.get(Page.applicantOrganisation.countryAutocomplete).should('be.visible').clear().type(countryName);
  cy.get(Page.applicantOrganisation.countryOptions).contains(countryName).click();
  cy.get(Page.applicantOrganisation.countryId).should('have.value', String(countryId));
};

const fillRequiredApplicant = (): void => {
  cy.get(Page.applicantOrganisation.organisationName).type('Test Organisation');
  cy.get(Page.applicantOrganisation.foreignAuthorityReference).type('FA-9803');
  cy.get(Page.applicantOrganisation.addressLine1).type('1 Test Street');
  selectApplicantCountry();
};

const fillUkBank = (sortCode = '112233'): void => {
  cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).check();
  cy.get(Page.applicantOrganisation.ukBankNameOnAccount).type('Test Organisation');
  cy.get(Page.applicantOrganisation.ukBankSortCode).type(sortCode);
  cy.get(Page.applicantOrganisation.ukBankAccountNumber).type('12345678');
  cy.get(Page.applicantOrganisation.ukBankPaymentReference).type('PAY-9803');
};

const fillValidUkApplicant = (): void => {
  fillRequiredApplicant();
  fillUkBank();
};

const assertOrganisationRouteBlocked = (selection: CasesCreateCasefileCaseTypeSelection): void => {
  cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
    store.setCaseTypeSelection(selection);
  });
  cy.get('@angularRouter').then((router: Router) => router.navigateByUrl(applicantPath));
  assertRouterPath(taskListPath);
  cy.get(Page.caseDetails.heading).should('have.text', 'Case details');
};

describe('Create Casefile Applicant Organisation', () => {
  it(
    'AC1. should render every empty control in the documented REMO In Organisation order',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation();

      cy.wait('@getCountries').its('request.method').should('equal', 'GET');
      cy.get(Page.applicantOrganisation.heading).should('have.text', 'Applicant details');
      cy.get(Page.applicantOrganisation.sectionHeadings).then(($headings) => {
        expect([...$headings].map((heading) => normalizeText(heading.textContent))).to.deep.equal([
          'Contact details',
          'Address',
          'Bank details',
        ]);
      });

      for (const selector of [
        Page.applicantOrganisation.organisationName,
        Page.applicantOrganisation.foreignAuthorityReference,
        Page.applicantOrganisation.mainEmailAddress,
        Page.applicantOrganisation.otherEmailAddress,
        Page.applicantOrganisation.mainTelephoneNumber,
        Page.applicantOrganisation.otherTelephoneNumber,
        Page.applicantOrganisation.addressLine1,
        Page.applicantOrganisation.addressLine2,
        Page.applicantOrganisation.addressLine3,
        Page.applicantOrganisation.addressLine4,
        Page.applicantOrganisation.addressLine5,
        Page.applicantOrganisation.postalOrZipCode,
        Page.applicantOrganisation.countryAutocomplete,
      ]) {
        cy.get(selector).should('be.visible').and('have.value', '');
      }
      cy.get(Page.applicantOrganisation.countryId).should('have.value', '');
      cy.get(Page.applicantOrganisation.bankTypeRadios).should('have.length', 3).and('not.be.checked');
      cy.get(Page.applicantOrganisation.ukBankConditional).should('not.be.visible');
      cy.get(Page.applicantOrganisation.nonUkBankConditional).should('not.be.visible');
      cy.get(Page.applicantOrganisation.returnToCaseDetails).should('contain.text', 'Return to case details');
      cy.get(Page.applicantOrganisation.cancelLink).should('have.text', 'Cancel');
      assertDocumentOrder([
        Page.applicantOrganisation.organisationName,
        Page.applicantOrganisation.foreignAuthorityReference,
        Page.applicantOrganisation.mainEmailAddress,
        Page.applicantOrganisation.otherEmailAddress,
        Page.applicantOrganisation.mainTelephoneNumber,
        Page.applicantOrganisation.otherTelephoneNumber,
        Page.applicantOrganisation.addressLine1,
        Page.applicantOrganisation.addressLine2,
        Page.applicantOrganisation.addressLine3,
        Page.applicantOrganisation.addressLine4,
        Page.applicantOrganisation.addressLine5,
        Page.applicantOrganisation.postalOrZipCode,
        Page.applicantOrganisation.countryAutocomplete,
        Page.applicantOrganisation.bankTypeGroup,
        Page.applicantOrganisation.returnToCaseDetails,
        Page.applicantOrganisation.cancelLink,
      ]);
    },
  );

  it('AC1. should restore every saved Organisation, contact, address and UK-bank value', { tags: buildTags() }, () => {
    setupApplicantOrganisation({ savedApplicant: SAVED_APPLICANT });

    cy.get(Page.applicantOrganisation.organisationName).should('have.value', 'Test Organisation');
    cy.get(Page.applicantOrganisation.foreignAuthorityReference).should('have.value', 'FA-9803');
    cy.get(Page.applicantOrganisation.mainEmailAddress).should('have.value', 'main@example.com');
    cy.get(Page.applicantOrganisation.otherEmailAddress).should('have.value', 'other@example.com');
    cy.get(Page.applicantOrganisation.mainTelephoneNumber).should('have.value', '01234567890');
    cy.get(Page.applicantOrganisation.otherTelephoneNumber).should('have.value', '09876543210');
    cy.get(Page.applicantOrganisation.addressLine1).should('have.value', '1 Test Street');
    cy.get(Page.applicantOrganisation.addressLine2).should('have.value', 'Test Area');
    cy.get(Page.applicantOrganisation.addressLine3).should('have.value', 'Test District');
    cy.get(Page.applicantOrganisation.addressLine4).should('have.value', 'Test Town');
    cy.get(Page.applicantOrganisation.addressLine5).should('have.value', 'Test County');
    cy.get(Page.applicantOrganisation.postalOrZipCode).should('have.value', 'TE1 1ST');
    cy.get(Page.applicantOrganisation.countryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(Page.applicantOrganisation.countryId).should('have.value', '826');
    cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).should(
      'be.checked',
    );
    cy.get(Page.applicantOrganisation.ukBankNameOnAccount).should('have.value', 'Test Organisation');
    cy.get(Page.applicantOrganisation.ukBankSortCode).should('have.value', '112233');
    cy.get(Page.applicantOrganisation.ukBankAccountNumber).should('have.value', '12345678');
    cy.get(Page.applicantOrganisation.ukBankPaymentReference).should('have.value', 'PAY-9803');
    cy.get(Page.applicantOrganisation.ukBankConditional).should('be.visible');
    cy.get(Page.applicantOrganisation.nonUkBankConditional).should('not.be.visible');
  });

  it(
    'AC1. should block REMO In Individual and both outbound selections from the Organisation route',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation({ initialChildPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList });

      for (const selection of [
        {
          caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
          applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
        },
        { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT },
        { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS },
      ] satisfies CasesCreateCasefileCaseTypeSelection[]) {
        assertOrganisationRouteBlocked(selection);
      }
    },
  );

  it('AC2. should reveal bank branches in exact order and remove stale inactive data', { tags: buildTags() }, () => {
    setupApplicantOrganisation();

    cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).check();
    cy.get(Page.applicantOrganisation.ukBankConditional).should('be.visible');
    cy.get(Page.applicantOrganisation.nonUkBankConditional).should('not.be.visible');
    assertDocumentOrder([
      Page.applicantOrganisation.ukBankNameOnAccount,
      Page.applicantOrganisation.ukBankSortCode,
      Page.applicantOrganisation.ukBankAccountNumber,
      Page.applicantOrganisation.ukBankPaymentReference,
    ]);
    cy.get(Page.applicantOrganisation.ukBankNameOnAccount).type('Stale UK name');
    cy.get(Page.applicantOrganisation.ukBankSortCode).type('112233');
    cy.get(Page.applicantOrganisation.ukBankAccountNumber).type('12345678');
    cy.get(Page.applicantOrganisation.ukBankPaymentReference).type('STALE-UK');

    cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK)).check();
    cy.get(Page.applicantOrganisation.ukBankConditional).should('not.be.visible');
    cy.get(Page.applicantOrganisation.nonUkBankConditional).should('be.visible');
    for (const selector of [
      Page.applicantOrganisation.ukBankNameOnAccount,
      Page.applicantOrganisation.ukBankSortCode,
      Page.applicantOrganisation.ukBankAccountNumber,
      Page.applicantOrganisation.ukBankPaymentReference,
    ]) {
      cy.get(selector).should('be.disabled').and('have.value', '');
    }
    assertDocumentOrder([
      Page.applicantOrganisation.nonUkBankNameOnAccount,
      Page.applicantOrganisation.nonUkBankBicSwiftCode,
      Page.applicantOrganisation.nonUkBankIban,
      Page.applicantOrganisation.nonUkBankPaymentReference,
      Page.applicantOrganisation.nonUkBankName,
      Page.applicantOrganisation.nonUkBankBranchSortCode,
      Page.applicantOrganisation.nonUkBankAccountNumber,
    ]);
    cy.get(Page.applicantOrganisation.nonUkBankNameOnAccount).type('Stale non-UK name');
    cy.get(Page.applicantOrganisation.nonUkBankBicSwiftCode).type('EXAMGB2L');
    cy.get(Page.applicantOrganisation.nonUkBankIban).type('GB29NWBK60161331926819');
    cy.get(Page.applicantOrganisation.nonUkBankPaymentReference).type('STALE-NONUK');
    cy.get(Page.applicantOrganisation.nonUkBankName).type('Stale Bank');
    cy.get(Page.applicantOrganisation.nonUkBankBranchSortCode).type('123456');
    cy.get(Page.applicantOrganisation.nonUkBankAccountNumber).type('STALE123');

    cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).check();
    cy.get(Page.applicantOrganisation.ukBankConditional).should('be.visible');
    cy.get(Page.applicantOrganisation.nonUkBankConditional).should('not.be.visible');
    for (const selector of [
      Page.applicantOrganisation.nonUkBankNameOnAccount,
      Page.applicantOrganisation.nonUkBankBicSwiftCode,
      Page.applicantOrganisation.nonUkBankIban,
      Page.applicantOrganisation.nonUkBankPaymentReference,
      Page.applicantOrganisation.nonUkBankName,
      Page.applicantOrganisation.nonUkBankBranchSortCode,
      Page.applicantOrganisation.nonUkBankAccountNumber,
    ]) {
      cy.get(selector).should('be.disabled').and('have.value', '');
    }
  });

  it(
    'AC2, AC4. should save a valid UK applicant with digit-only sort code and Applicant Provided',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation();
      fillRequiredApplicant();
      fillUkBank('112233');

      cy.get(Page.applicantOrganisation.returnToCaseDetails).click();
      assertRouterPath(taskListPath);
      cy.get(Page.caseDetails.applicantStatus)
        .invoke('text')
        .then((text) => expect(text.trim()).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED));
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.applicantDetails()).to.deep.equal({
          organisationName: 'Test Organisation',
          foreignAuthorityReference: 'FA-9803',
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
          bankDetails: {
            type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
            nameOnAccount: 'Test Organisation',
            sortCode: '112233',
            accountNumber: '12345678',
            paymentReference: 'PAY-9803',
          },
        });
        expect(store.taskStatuses().applicant).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
        expect(store.unsavedChanges()).to.equal(false);
        expect(store.stateChanges()).to.equal(true);
      });
    },
  );

  it('AC2. should save a valid non-UK applicant by BIC with optional fields', { tags: buildTags() }, () => {
    setupApplicantOrganisation();
    fillRequiredApplicant();
    cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK)).check();
    cy.get(Page.applicantOrganisation.nonUkBankNameOnAccount).type('Test Organisation');
    cy.get(Page.applicantOrganisation.nonUkBankBicSwiftCode).type('EXAMGB2L');
    cy.get(Page.applicantOrganisation.nonUkBankPaymentReference).type('PAY-NONUK');
    cy.get(Page.applicantOrganisation.nonUkBankName).type('Test Bank');
    cy.get(Page.applicantOrganisation.nonUkBankBranchSortCode).type('123456');
    cy.get(Page.applicantOrganisation.nonUkBankAccountNumber).type('NONUK123');

    cy.get(Page.applicantOrganisation.returnToCaseDetails).click();
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.applicantDetails()?.bankDetails).to.deep.equal({
        type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        nameOnAccount: 'Test Organisation',
        accountNumber: 'NONUK123',
        paymentReference: 'PAY-NONUK',
        bicSwiftCode: 'EXAMGB2L',
        iban: null,
        bankName: 'Test Bank',
        branchSortCode: '123456',
      });
    });
  });

  it(
    'AC2. should save a valid non-UK applicant by IBAN and exclude inactive BIC and UK values',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation();
      fillRequiredApplicant();
      fillUkBank();
      cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK)).check();
      cy.get(Page.applicantOrganisation.nonUkBankNameOnAccount).type('Stale non-UK name');
      cy.get(Page.applicantOrganisation.nonUkBankBicSwiftCode).type('EXAMGB2L');
      cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).check();
      cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK)).check();
      cy.get(Page.applicantOrganisation.nonUkBankNameOnAccount).type('Test Organisation');
      cy.get(Page.applicantOrganisation.nonUkBankIban).type('GB29NWBK60161331926819');

      cy.get(Page.applicantOrganisation.returnToCaseDetails).click();
      assertRouterPath(taskListPath);
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.applicantDetails()?.bankDetails).to.deep.equal({
          type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
          nameOnAccount: 'Test Organisation',
          accountNumber: null,
          paymentReference: null,
          bicSwiftCode: null,
          iban: 'GB29NWBK60161331926819',
          bankName: null,
          branchSortCode: null,
        });
      });
    },
  );

  it('AC2. should save None and discard previously entered bank values', { tags: buildTags() }, () => {
    setupApplicantOrganisation();
    fillRequiredApplicant();
    fillUkBank();
    cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE)).check();
    cy.get(Page.applicantOrganisation.ukBankConditional).should('not.be.visible');
    cy.get(Page.applicantOrganisation.nonUkBankConditional).should('not.be.visible');

    cy.get(Page.applicantOrganisation.returnToCaseDetails).click();
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.applicantDetails()?.bankDetails).to.deep.equal({
        type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE,
      });
    });
  });

  it(
    'AC3, EMAC. should show required and representative format and length errors, focus and link the summary, and retain valid values',
    { tags: buildTags() },
    () => {
      const bankTypeRequiredError = 'Select an option';
      setupApplicantOrganisation();
      cy.get(Page.applicantOrganisation.mainEmailAddress).type('not-an-email');
      cy.get(Page.applicantOrganisation.otherEmailAddress).type('valid@example.com');
      cy.get(Page.applicantOrganisation.mainTelephoneNumber).type('1'.repeat(36));
      cy.get(Page.applicantOrganisation.otherTelephoneNumber).type('02079460000');
      cy.get(Page.applicantOrganisation.addressLine2).type('A'.repeat(31));
      cy.get(Page.applicantOrganisation.addressLine3).type('Retained district');
      cy.get(Page.applicantOrganisation.postalOrZipCode).type('1'.repeat(11));
      cy.get(Page.applicantOrganisation.returnToCaseDetails).click();

      assertInlineError(Page.applicantOrganisation.bankTypeError, bankTypeRequiredError);
      cy.get(Page.applicantOrganisation.errorSummaryLinks)
        .contains(bankTypeRequiredError)
        .should(($link) => {
          expect(normalizeText($link.text())).to.equal(bankTypeRequiredError);
        })
        .click();
      cy.get(Page.applicantOrganisation.bankTypeRadios)
        .first()
        .should('be.focused')
        .and('have.value', CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK);

      cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).check();
      cy.get(Page.applicantOrganisation.ukBankSortCode).type('11 22 33');
      cy.get(Page.applicantOrganisation.ukBankAccountNumber).type('12345');
      cy.get(Page.applicantOrganisation.returnToCaseDetails).click();

      const expectedErrors = [
        'Enter organisation name',
        'Enter a foreign authority reference number',
        'Enter an email address in the correct format, like name@example.com',
        'Main telephone number must be 35 characters or fewer',
        'Enter an address',
        'Address line 2 must be 30 characters or fewer',
        'Postal or zip code must be 10 characters or fewer',
        'Select a country',
        'Enter name on account',
        'Enter correct sort code',
        'Account number must be between 6 and 8 numbers',
        'Enter UK bank account payment reference',
      ];
      cy.get(Page.applicantOrganisation.errorSummary).should('be.focused').and('contain.text', 'There is a problem');
      cy.get(Page.applicantOrganisation.errorSummaryLinks).then(($links) => {
        expect([...$links].map((link) => normalizeText(link.textContent))).to.deep.equal(expectedErrors);
      });

      const errorMappings: Array<{ inlineSelector: string; controlSelector: string; message: string }> = [
        {
          inlineSelector: Page.applicantOrganisation.organisationNameError,
          controlSelector: Page.applicantOrganisation.organisationName,
          message: expectedErrors[0],
        },
        {
          inlineSelector: Page.applicantOrganisation.foreignAuthorityReferenceError,
          controlSelector: Page.applicantOrganisation.foreignAuthorityReference,
          message: expectedErrors[1],
        },
        {
          inlineSelector: Page.applicantOrganisation.mainEmailAddressError,
          controlSelector: Page.applicantOrganisation.mainEmailAddress,
          message: expectedErrors[2],
        },
        {
          inlineSelector: Page.applicantOrganisation.mainTelephoneNumberError,
          controlSelector: Page.applicantOrganisation.mainTelephoneNumber,
          message: expectedErrors[3],
        },
        {
          inlineSelector: Page.applicantOrganisation.addressLine1Error,
          controlSelector: Page.applicantOrganisation.addressLine1,
          message: expectedErrors[4],
        },
        {
          inlineSelector: Page.applicantOrganisation.addressLine2Error,
          controlSelector: Page.applicantOrganisation.addressLine2,
          message: expectedErrors[5],
        },
        {
          inlineSelector: Page.applicantOrganisation.postalOrZipCodeError,
          controlSelector: Page.applicantOrganisation.postalOrZipCode,
          message: expectedErrors[6],
        },
        {
          inlineSelector: Page.applicantOrganisation.countryError,
          controlSelector: Page.applicantOrganisation.countryAutocomplete,
          message: expectedErrors[7],
        },
        {
          inlineSelector: Page.applicantOrganisation.ukBankNameOnAccountError,
          controlSelector: Page.applicantOrganisation.ukBankNameOnAccount,
          message: expectedErrors[8],
        },
        {
          inlineSelector: Page.applicantOrganisation.ukBankSortCodeError,
          controlSelector: Page.applicantOrganisation.ukBankSortCode,
          message: expectedErrors[9],
        },
        {
          inlineSelector: Page.applicantOrganisation.ukBankAccountNumberError,
          controlSelector: Page.applicantOrganisation.ukBankAccountNumber,
          message: expectedErrors[10],
        },
        {
          inlineSelector: Page.applicantOrganisation.ukBankPaymentReferenceError,
          controlSelector: Page.applicantOrganisation.ukBankPaymentReference,
          message: expectedErrors[11],
        },
      ];
      for (const mapping of errorMappings) {
        assertInlineError(mapping.inlineSelector, mapping.message);
      }
      cy.get(Page.applicantOrganisation.errorSummaryLinks)
        .should('have.length', errorMappings.length)
        .each(($link, index) => {
          const mapping = errorMappings[index];
          expect(normalizeText($link.text())).to.equal(mapping.message);
          cy.wrap($link).click();
          cy.get(mapping.controlSelector).should('be.focused');
        });
      cy.get(Page.applicantOrganisation.otherEmailAddress).should('have.value', 'valid@example.com');
      cy.get(Page.applicantOrganisation.otherTelephoneNumber).should('have.value', '02079460000');
      cy.get(Page.applicantOrganisation.addressLine3).should('have.value', 'Retained district');
      assertRouterPath(applicantPath);
    },
  );

  it(
    'AC4, RGAC. should return directly to the task list when no edits are made before Cancel',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation();
      const cleanCancelConfirm = cy.stub().as('cleanCancelConfirm').returns(true);
      cy.on('window:confirm', cleanCancelConfirm);

      cy.get(Page.applicantOrganisation.cancelLink).click();

      cy.get('@cleanCancelConfirm').should('not.have.been.called');
      assertRouterPath(taskListPath);
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.applicantDetails()).to.equal(null);
        expect(store.unsavedChanges()).to.equal(false);
      });
    },
  );

  it(
    'AC4, RGAC. should reject dirty Cancel with the exact warning and preserve edited controls plus the last saved applicant',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation({ savedApplicant: SAVED_APPLICANT });
      const rejectCancelConfirm = cy.stub().as('rejectCancelConfirm').returns(false);
      cy.on('window:confirm', rejectCancelConfirm);

      cy.get(Page.applicantOrganisation.organisationName).clear().type('Dirty working copy');
      cy.get(Page.applicantOrganisation.otherEmailAddress).clear().type('edited@example.com');
      cy.get(Page.applicantOrganisation.cancelLink).click();

      cy.get('@rejectCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      assertRouterPath(applicantPath);
      cy.get(Page.applicantOrganisation.organisationName).should('have.value', 'Dirty working copy');
      cy.get(Page.applicantOrganisation.otherEmailAddress).should('have.value', 'edited@example.com');
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.applicantDetails()).to.deep.equal(SAVED_APPLICANT);
        expect(store.taskStatuses().applicant).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
        expect(store.unsavedChanges()).to.equal(true);
      });
    },
  );

  it(
    'AC4, RGAC. should accept dirty Cancel, leave the route and preserve only the last saved applicant',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation({ savedApplicant: SAVED_APPLICANT });
      const acceptCancelConfirm = cy.stub().as('acceptCancelConfirm').returns(true);
      cy.on('window:confirm', acceptCancelConfirm);

      cy.get(Page.applicantOrganisation.organisationName).clear().type('Discarded working copy');
      cy.get(Page.applicantOrganisation.cancelLink).click();

      cy.get('@acceptCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      assertRouterPath(taskListPath);
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.applicantDetails()).to.deep.equal(SAVED_APPLICANT);
        expect(store.taskStatuses().applicant).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
        expect(store.unsavedChanges()).to.equal(false);
      });
    },
  );

  it('AC4. should make no POST or PUT Draft Casefile request on a valid Return', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('draftCasefilePost');
    const putRequestSpy = cy.spy().as('draftCasefilePut');
    expect(DRAFT_CASEFILE_WRITE_URL.test('/draft-casefiles'), 'matches the Draft Casefile collection URL').to.equal(
      true,
    );
    expect(DRAFT_CASEFILE_WRITE_URL.test('/draft-casefiles/123'), 'matches a Draft Casefile item URL').to.equal(true);
    cy.intercept({ method: 'POST', url: DRAFT_CASEFILE_WRITE_URL }, postRequestSpy);
    cy.intercept({ method: 'PUT', url: DRAFT_CASEFILE_WRITE_URL }, putRequestSpy);
    setupApplicantOrganisation();
    fillRequiredApplicant();
    cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE)).check();

    cy.get(Page.applicantOrganisation.returnToCaseDetails).click();

    assertRouterPath(taskListPath);
    cy.get('@draftCasefilePost').should('not.have.been.called');
    cy.get('@draftCasefilePut').should('not.have.been.called');
  });

  it(
    'AC5. should cancel empty-Countries activation, display the generic global banner and retry on next Applicant navigation',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation({
        initialChildPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
        countries: EMPTY_COUNTRIES_RESPONSE,
        useAppShell: true,
      });

      assertRouterPath(taskListPath);
      cy.get(Page.caseDetails.applicantLink).click();
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

      cy.get(Page.caseDetails.applicantLink).click();
      cy.wait('@getCountries').its('response.statusCode').should('equal', 200);
      assertRouterPath(taskListPath);
      cy.get('@getCountries.all').should('have.length', 2);
    },
  );

  it(
    'AC5. should display correlated Problem title, detail and operation ID after failed Countries activation',
    { tags: buildTags() },
    () => {
      const problem = {
        type: 'https://example.test/problems/countries-unavailable',
        title: 'Countries service unavailable',
        status: 503,
        detail: 'Countries could not be loaded',
        instance: '/opal-maintenance-service/countries',
        operation_id: 'OP-9803-COUNTRIES',
        retriable: true,
      };
      setupApplicantOrganisation({
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

  it(
    'AC5. should traverse base controls, the active UK branch, Return and Cancel by keyboard',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation();
      const rejectCancelConfirm = cy.stub().as('rejectUkKeyboardCancelConfirm').returns(false);
      cy.on('window:confirm', rejectCancelConfirm);

      cy.get(Page.applicantOrganisation.organisationName).focus();
      for (const selector of [
        Page.applicantOrganisation.foreignAuthorityReference,
        Page.applicantOrganisation.mainEmailAddress,
        Page.applicantOrganisation.otherEmailAddress,
        Page.applicantOrganisation.mainTelephoneNumber,
        Page.applicantOrganisation.otherTelephoneNumber,
        Page.applicantOrganisation.addressLine1,
        Page.applicantOrganisation.addressLine2,
        Page.applicantOrganisation.addressLine3,
        Page.applicantOrganisation.addressLine4,
        Page.applicantOrganisation.addressLine5,
        Page.applicantOrganisation.postalOrZipCode,
        Page.applicantOrganisation.countryAutocomplete,
        Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK),
      ]) {
        assertTabMovesTo(selector);
      }
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).should(
        'be.checked',
      );
      cy.get(Page.applicantOrganisation.ukBankConditional).should('be.visible');
      cy.get(Page.applicantOrganisation.ukBankNameOnAccount).should('be.enabled');
      for (const selector of [
        Page.applicantOrganisation.ukBankNameOnAccount,
        Page.applicantOrganisation.ukBankSortCode,
        Page.applicantOrganisation.ukBankAccountNumber,
        Page.applicantOrganisation.ukBankPaymentReference,
        Page.applicantOrganisation.returnToCaseDetails,
        Page.applicantOrganisation.cancelLink,
      ]) {
        assertTabMovesTo(selector);
      }
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.get('@rejectUkKeyboardCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      assertRouterPath(applicantPath);
    },
  );

  it(
    'AC5. should traverse the active non-UK branch by keyboard while the UK branch stays out of tab order',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation();
      const rejectCancelConfirm = cy.stub().as('rejectNonUkKeyboardCancelConfirm').returns(false);
      cy.on('window:confirm', rejectCancelConfirm);

      cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).focus();
      cy.press(Cypress.Keyboard.Keys.DOWN);
      cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK)).should(
        'be.checked',
      );
      cy.get(Page.applicantOrganisation.nonUkBankConditional).should('be.visible');
      cy.get(Page.applicantOrganisation.nonUkBankNameOnAccount).should('be.enabled');
      for (const selector of [
        Page.applicantOrganisation.ukBankNameOnAccount,
        Page.applicantOrganisation.ukBankSortCode,
        Page.applicantOrganisation.ukBankAccountNumber,
        Page.applicantOrganisation.ukBankPaymentReference,
      ]) {
        cy.get(selector).should('be.disabled');
      }
      for (const selector of [
        Page.applicantOrganisation.nonUkBankNameOnAccount,
        Page.applicantOrganisation.nonUkBankBicSwiftCode,
        Page.applicantOrganisation.nonUkBankIban,
        Page.applicantOrganisation.nonUkBankPaymentReference,
        Page.applicantOrganisation.nonUkBankName,
        Page.applicantOrganisation.nonUkBankBranchSortCode,
        Page.applicantOrganisation.nonUkBankAccountNumber,
        Page.applicantOrganisation.returnToCaseDetails,
        Page.applicantOrganisation.cancelLink,
      ]) {
        assertTabMovesTo(selector);
      }
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.get('@rejectNonUkKeyboardCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      assertRouterPath(applicantPath);
    },
  );

  it(
    'AC5. should have no detectable Axe violations in valid expanded and validation-error states',
    { tags: buildTags() },
    () => {
      setupApplicantOrganisation();
      fillValidUkApplicant();

      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();

      cy.get(Page.applicantOrganisation.organisationName).clear();
      cy.get(Page.applicantOrganisation.returnToCaseDetails).click();
      cy.get(Page.applicantOrganisation.errorSummary).should('be.focused');
      cy.checkA11y();
    },
  );

  it(
    'AC5. should retain content and operation at 320 CSS pixels without horizontal document overflow',
    { tags: buildTags() },
    () => {
      cy.viewport(320, 900);
      setupApplicantOrganisation();
      cy.get(Page.applicantOrganisation.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK)).check();

      cy.get(Page.applicantOrganisation.heading).should('be.visible');
      cy.get(Page.applicantOrganisation.nonUkBankConditional).should('be.visible');
      cy.get(Page.applicantOrganisation.returnToCaseDetails).should('be.visible');
      cy.get(Page.applicantOrganisation.cancelLink).should('be.visible');
      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
      });
    },
  );
});
