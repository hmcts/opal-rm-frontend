import type { Router } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-applicant-individual/constants/cases-create-casefile-applicant-individual-field-names.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-bank-types.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import {
  APPLICANT_INDIVIDUAL_ERROR_MESSAGES,
  APPLICANT_INDIVIDUAL_REQUIRED_ERROR_SUMMARY,
} from './constants/applicant-individual-errors.constant';
import { ERROR_SUMMARY_TITLE, UNSAVED_CHANGES_WARNING } from './constants/create-casefile-test-copy.constant';
import {
  SAVED_APPLICANT_INDIVIDUAL,
  VALID_NON_UK_BIC_APPLICANT_INDIVIDUAL,
  VALID_NON_UK_IBAN_APPLICANT_INDIVIDUAL,
  VALID_UK_APPLICANT_INDIVIDUAL,
} from './mocks/applicant-individual.mock';
import { createCountriesUnavailableProblem, EMPTY_COUNTRIES_RESPONSE } from './mocks/countries.mock';
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

const assertCanonicalIdentifierContract = (
  prefix: string,
  expectedControlNames: readonly string[],
  submitSelector: string,
  errorLinksSelector: string,
): void => {
  cy.get('form input, form select, form textarea').then(($controls) => {
    const controls = [...$controls] as HTMLElement[];
    const ids = controls.map((control) => control.id);
    const names = controls.map((control) => control.getAttribute('name') ?? '');

    expect(ids.every((id) => id.startsWith(prefix))).to.equal(true);
    expect(names.every((name) => name.startsWith(prefix))).to.equal(true);
    expect(new Set(ids).size).to.equal(ids.length);
    expect(expectedControlNames.every((name) => names.includes(name))).to.equal(true);
  });
  cy.get(submitSelector).click();
  cy.get(errorLinksSelector).each(($link) => {
    cy.wrap($link).click();
    cy.focused().should(($focused) => {
      const targetId = $focused.attr('id') ?? '';
      expect(targetId.startsWith(prefix)).to.equal(true);
      expect(Cypress.$(`#${targetId}`)).to.have.length(1);
    });
  });
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

  it(
    'AC1, AC2. should use canonical unique control identifiers with exact error targets',
    { tags: buildTags() },
    () => {
      setupApplicantIndividual();
      cy.get(Page.applicantIndividual.addAliases).check();
      cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).check();
      cy.get(Page.applicantIndividual.restrictedInformation).check();

      const controlFieldNames = Object.entries(CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES)
        .filter(([key]) => !['aliases', 'aliasFirstNames', 'aliasLastName'].includes(key))
        .map(([, value]) => value);

      assertCanonicalIdentifierContract(
        'create_casefile_applicant_individual_',
        controlFieldNames,
        Page.applicantIndividual.returnToCaseDetails,
        Page.applicantIndividual.errorSummaryLinks,
      );
    },
  );

  it('AC1. should restore every saved applicant value and active branch', { tags: buildTags() }, () => {
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT_INDIVIDUAL });

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
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT_INDIVIDUAL });

    cy.get(Page.applicantIndividual.removeAliasLink).click();
    cy.get(Page.applicantIndividual.aliasFirstNames).should('have.length', 1);
    cy.get(Page.applicantIndividual.aliasFirstName(0)).should('be.focused').and('have.value', 'Example');

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

  it('AC2. should require and clear preloaded third-party and restriction branches', { tags: buildTags() }, () => {
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT_INDIVIDUAL });

    cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).uncheck().check();
    cy.get(Page.applicantIndividual.restrictedInformation).uncheck().check();
    cy.get(Page.applicantIndividual.returnToCaseDetails).click();
    assertInlineError(
      Page.applicantIndividual.thirdPartyNameOrOrganisationError,
      APPLICANT_INDIVIDUAL_ERROR_MESSAGES.thirdPartyNameOrOrganisation,
    );
    assertInlineError(
      Page.applicantIndividual.thirdPartyRelationshipError,
      APPLICANT_INDIVIDUAL_ERROR_MESSAGES.thirdPartyRelationship,
    );
    assertInlineError(
      Page.applicantIndividual.thirdPartyAddressLine1Error,
      APPLICANT_INDIVIDUAL_ERROR_MESSAGES.address,
    );
    assertInlineError(Page.applicantIndividual.thirdPartyCountryError, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.country);
    assertInlineError(
      Page.applicantIndividual.restrictedInformationReasonError,
      APPLICANT_INDIVIDUAL_ERROR_MESSAGES.restrictedInformationReason,
    );

    cy.get(Page.applicantIndividual.thirdPartyNameOrOrganisation).should('have.value', '');
    cy.get(Page.applicantIndividual.thirdPartyRelationship).should('have.value', '');
    cy.get(Page.applicantIndividual.thirdPartyAddressLine1).should('have.value', '');
    cy.get(Page.applicantIndividual.thirdPartyCountry).should('not.have.value', '250');
    cy.get(Page.applicantIndividual.restrictedInformationReason).should('have.value', '');
  });

  it('AC2, AC4. should save only active UK bank data and return with Applicant Provided', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('draftCasefilePost');
    const putRequestSpy = cy.spy().as('draftCasefilePut');
    cy.intercept({ method: 'POST', url: '**/draft-casefiles**' }, postRequestSpy);
    cy.intercept({ method: 'PUT', url: '**/draft-casefiles**' }, putRequestSpy);
    setupApplicantIndividual({ savedApplicant: VALID_UK_APPLICANT_INDIVIDUAL });

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

  it('AC2. should save only active non-UK bank data by BIC', { tags: buildTags() }, () => {
    setupApplicantIndividual({ savedApplicant: VALID_NON_UK_BIC_APPLICANT_INDIVIDUAL });

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
    setupApplicantIndividual({ savedApplicant: VALID_NON_UK_IBAN_APPLICANT_INDIVIDUAL });

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
    setupApplicantIndividual({ savedApplicant: VALID_UK_APPLICANT_INDIVIDUAL });
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

      const expectedErrors = APPLICANT_INDIVIDUAL_REQUIRED_ERROR_SUMMARY;
      cy.get(Page.applicantIndividual.errorSummary).should('be.focused').and('contain.text', ERROR_SUMMARY_TITLE);
      cy.get(Page.applicantIndividual.errorSummaryLinks).then(($links) => {
        expect([...$links].map((link) => normalizeText(link.textContent))).to.deep.equal(expectedErrors);
      });
      const inlineErrors: [string, string][] = [
        [Page.applicantIndividual.firstNamesError, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.applicantFirstNames],
        [Page.applicantIndividual.lastNameError, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.applicantLastName],
        [Page.applicantIndividual.aliasFirstNameError(0), APPLICANT_INDIVIDUAL_ERROR_MESSAGES.aliasFirstNames],
        [Page.applicantIndividual.aliasLastNameError(0), APPLICANT_INDIVIDUAL_ERROR_MESSAGES.aliasLastName],
        [Page.applicantIndividual.addressLine1Error, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.address],
        [Page.applicantIndividual.countryError, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.country],
        [
          Page.applicantIndividual.thirdPartyNameOrOrganisationError,
          APPLICANT_INDIVIDUAL_ERROR_MESSAGES.thirdPartyNameOrOrganisation,
        ],
        [
          Page.applicantIndividual.thirdPartyRelationshipError,
          APPLICANT_INDIVIDUAL_ERROR_MESSAGES.thirdPartyRelationship,
        ],
        [Page.applicantIndividual.thirdPartyAddressLine1Error, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.address],
        [Page.applicantIndividual.thirdPartyCountryError, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.country],
        [Page.applicantIndividual.ukBankNameOnAccountError, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.bankNameOnAccount],
        [Page.applicantIndividual.ukBankSortCodeError, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.bankSortCode],
        [Page.applicantIndividual.ukBankAccountNumberError, APPLICANT_INDIVIDUAL_ERROR_MESSAGES.bankAccountNumber],
        [
          Page.applicantIndividual.ukBankPaymentReferenceError,
          APPLICANT_INDIVIDUAL_ERROR_MESSAGES.bankPaymentReference,
        ],
        [
          Page.applicantIndividual.restrictedInformationReasonError,
          APPLICANT_INDIVIDUAL_ERROR_MESSAGES.restrictedInformationReason,
        ],
      ];
      for (const [selector, message] of inlineErrors) {
        assertInlineError(selector, message);
      }

      const errorSummaryFocusMappings: Array<{ message: string; controlSelector: string }> = [
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.applicantFirstNames,
          controlSelector: Page.applicantIndividual.firstNames,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.applicantLastName,
          controlSelector: Page.applicantIndividual.lastName,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.aliasFirstNames,
          controlSelector: Page.applicantIndividual.aliasFirstName(0),
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.aliasLastName,
          controlSelector: Page.applicantIndividual.aliasLastName(0),
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.address,
          controlSelector: Page.applicantIndividual.addressLine1,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.country,
          controlSelector: Page.applicantIndividual.countryAutocomplete,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.thirdPartyNameOrOrganisation,
          controlSelector: Page.applicantIndividual.thirdPartyNameOrOrganisation,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.thirdPartyRelationship,
          controlSelector: Page.applicantIndividual.thirdPartyRelationship,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.address,
          controlSelector: Page.applicantIndividual.thirdPartyAddressLine1,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.country,
          controlSelector: Page.applicantIndividual.thirdPartyCountry,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.bankNameOnAccount,
          controlSelector: Page.applicantIndividual.ukBankNameOnAccount,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.bankSortCode,
          controlSelector: Page.applicantIndividual.ukBankSortCode,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.bankAccountNumber,
          controlSelector: Page.applicantIndividual.ukBankAccountNumber,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.bankPaymentReference,
          controlSelector: Page.applicantIndividual.ukBankPaymentReference,
        },
        {
          message: APPLICANT_INDIVIDUAL_ERROR_MESSAGES.restrictedInformationReason,
          controlSelector: Page.applicantIndividual.restrictedInformationReason,
        },
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
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT_INDIVIDUAL });
    const rejectCancelConfirm = cy.stub().as('rejectCancelConfirm').returns(false);
    cy.on('window:confirm', rejectCancelConfirm);

    cy.get(Page.applicantIndividual.addAliases).uncheck();
    cy.get(Page.applicantIndividual.cancelLink).click();

    cy.get('@rejectCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(applicantPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.applicantDetails()).to.deep.equal(SAVED_APPLICANT_INDIVIDUAL);
      expect(store.taskStatuses().applicant).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).to.equal(true);
    });
  });

  it('AC4, RGAC. should guard alias-only edits and preserve the last save when rejected', { tags: buildTags() }, () => {
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT_INDIVIDUAL });
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
      expect(store.applicantDetails()).to.deep.equal(SAVED_APPLICANT_INDIVIDUAL);
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
      const problem = createCountriesUnavailableProblem('OP-9802-COUNTRIES');
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
      cy.get('@globalStore').should((globalStore: GlobalStoreInstance) => {
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

  it('AC5. should support keyboard operation across aliases, branches and Return', { tags: buildTags() }, () => {
    setupApplicantIndividual();

    cy.get(Page.applicantIndividual.addAliases).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(Page.applicantIndividual.aliasFirstName(0)).should('be.focused').type('Example');
    assertTabMovesTo(Page.applicantIndividual.aliasLastName(0));
    cy.get(Page.applicantIndividual.aliasLastName(0)).type('Alias');
    assertTabMovesTo(Page.applicantIndividual.addAliasButton);
    cy.get(Page.applicantIndividual.addAliasButton).type('{enter}');
    cy.get(Page.applicantIndividual.aliasFirstName(1)).should('be.focused');

    cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(Page.applicantIndividual.thirdPartyConditional).should('be.visible');
    cy.get(Page.applicantIndividual.sendCorrespondenceToThirdParty).should('be.focused');
    assertTabMovesTo(Page.applicantIndividual.thirdPartyNameOrOrganisation);

    cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(Page.applicantIndividual.ukBankConditional).should('be.visible');
    cy.get(Page.applicantIndividual.bankTypeRadio(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK)).should('be.focused');
    assertTabMovesTo(Page.applicantIndividual.ukBankNameOnAccount);

    cy.get(Page.applicantIndividual.restrictedInformation).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(Page.applicantIndividual.restrictedInformationConditional).should('be.visible');
    cy.get(Page.applicantIndividual.restrictedInformation).should('be.focused');
    assertTabMovesTo(Page.applicantIndividual.restrictedInformationReason);

    cy.get(Page.applicantIndividual.returnToCaseDetails).focus().type('{enter}');
    cy.get(Page.applicantIndividual.errorSummary).should('be.focused');
  });

  it('AC5. should support keyboard activation of Cancel with unsaved changes', { tags: buildTags() }, () => {
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT_INDIVIDUAL });
    const rejectCancelConfirm = cy.stub().as('rejectKeyboardCancelConfirm').returns(false);
    cy.on('window:confirm', rejectCancelConfirm);

    cy.get(Page.applicantIndividual.addAliases).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(Page.applicantIndividual.aliasesConditional).should('not.exist');
    cy.get(Page.applicantIndividual.addAliases).should('be.focused');
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.unsavedChanges()).to.equal(true);
    });
    cy.get(Page.applicantIndividual.cancelLink).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get('@rejectKeyboardCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(applicantPath);
  });

  it('AC5. should have no detectable Axe violations in a valid expanded state', { tags: buildTags() }, () => {
    setupApplicantIndividual({ savedApplicant: SAVED_APPLICANT_INDIVIDUAL });

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
