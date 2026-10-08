import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GENERIC_HTTP_ERROR_MESSAGE } from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import {
  COUNTRIES_RESPONSE,
  EMPTY_COUNTRIES_RESPONSE,
  createCountriesUnavailableProblem,
} from '../mocks/countries.mock';
import { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/constants/cases-create-casefile-minor-creditor-field-names.constant';
import type { ICasesCreateCasefileMinorCreditorDetails } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-minor-creditor-details.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import {
  ERROR_SUMMARY_TITLE,
  UNSAVED_CHANGES_WARNING,
} from '../../../shared/constants/create-casefile-test-copy.constant';
import {
  MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK,
  MINOR_CREDITOR_NON_UK_MOCK,
  MINOR_CREDITOR_UK_MOCK,
  MINOR_CREDITOR_SAVED_STATE_MOCK,
  MINOR_CREDITOR_BIC_MOCK,
  MINOR_CREDITOR_IBAN_MOCK,
  MINOR_CREDITOR_RESTORATION_CASES,
  MINOR_CREDITOR_RESTORED_ADDRESS_FIELDS,
} from './mocks/minor-creditor.mock';
import {
  MINOR_CREDITOR_BRANCH_MOCKS,
  MINOR_CREDITOR_REQUIRED_FIELDS,
  MINOR_CREDITOR_LENGTH_BOUNDARIES,
  MINOR_CREDITOR_INVALID_FORMATS,
  MINOR_CREDITOR_VALID_FORMATS,
} from './mocks/minor-creditor-validation.mock';
import { MINOR_CREDITOR_ERROR_MESSAGES as COPY } from './constants/minor-creditor-errors.constant';
import { setupCreditor, type CreditorStore } from '../creditor/setup/creditor.setup';
import { setupMinorCreditor, type MinorCreditorStore } from './setup/minor-creditor.setup';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9809', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;
const error = (field: keyof typeof F, key: string): string => COPY[field][key];

const assertAccepted = (details: ICasesCreateCasefileMinorCreditorDetails, displayName: string): void => {
  cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
    expect(store.minorCreditors()).to.deep.equal([{ sequenceNumber: 1, displayName, details }]);
    expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 1 });
    expect(store.nextMinorCreditorSequence()).to.eq(2);
    expect(store.creditorDraft()).to.eq(null);
    expect(store.unsavedChanges()).to.eq(false);
    expect(store.stateChanges()).to.eq(true);
  });
  cy.get('@routerNavigate').should('have.been.calledWith', route(PATHS.children.minorCreditorSummary));
};

const assertNotAccepted = (): void => {
  cy.get('@routerNavigate').should('not.have.been.called');
  cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
    expect(store.minorCreditors()).to.deep.equal([]);
    expect(store.orderTerms()[0].creditor).to.eq(null);
    expect(store.nextMinorCreditorSequence()).to.eq(1);
  });
};

const assertFieldErrors = (fields: Array<{ field: keyof typeof F; selector: string; message: string }>): void => {
  cy.get(S.errorSummary).should('be.focused').and('contain.text', ERROR_SUMMARY_TITLE);
  for (const { field, selector, message } of fields) {
    cy.get(S.minorCreditor.fieldError(field)).should(($error) => {
      expect($error.text().replace(/\s+/g, ' ').trim(), field).to.eq('Error: ' + message);
    });
    cy.get(S.errorSummaryLinks).contains(message).click();
    cy.get(selector)
      .should('be.focused')
      .and('have.attr', 'aria-describedby')
      .and('include', F[field] + '-error-message');
  }
};

const assertFieldError = (field: keyof typeof F, selector: string, message: string): void => {
  assertFieldErrors([{ field, selector, message }]);
};

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const scan = (): void => {
  cy.document().its('documentElement.lang').should('eq', 'en');
  cy.get('[role="main"], main').should('exist');
  cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
  cy.checkA11y(undefined, { runOnly: { type: 'tag', values: axeTags } }, (violations) => {
    if (violations.length) {
      throw new Error(
        JSON.stringify(
          violations.map(({ id, help, nodes }) => ({ id, help, targets: nodes.map(({ target }) => target) })),
        ),
      );
    }
  });
};

describe('Minor creditor details', () => {
  describe('Countries resolver retry', () => {
    for (const failure of ['empty response', 'service failure'] as const) {
      it(
        `AC3. should retain saved creditors and enter Details after retrying Countries ${failure}`,
        { tags: buildTags() },
        () => {
          const problem = createCountriesUnavailableProblem('PO-9809-COUNTRIES');
          let requests = 0;
          cy.intercept('GET', '**/opal-maintenance-service/countries?active=true', (request) => {
            requests += 1;
            if (requests > 1) {
              request.reply({ statusCode: 200, body: COUNTRIES_RESPONSE });
            } else if (failure === 'empty response') {
              request.reply({ statusCode: 200, body: EMPTY_COUNTRIES_RESPONSE });
            } else {
              request.reply({
                statusCode: 503,
                headers: { 'content-type': 'application/problem+json' },
                body: problem,
              });
            }
          }).as('getMinorCreditorCountries');
          setupCreditor({ shell: true, useHttpCountries: true, state: MINOR_CREDITOR_SAVED_STATE_MOCK });
          cy.get(S.creditor.addNew).check();
          cy.get(S.creditor.continueButton).click();
          cy.wait('@getMinorCreditorCountries')
            .its('response.statusCode')
            .should('eq', failure === 'empty response' ? 200 : 503);
          cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermCreditor));
          cy.get(S.minorCreditor.save).should('not.exist');
          cy.get(S.globalErrorBanner).should('be.visible');
          if (failure === 'service failure') {
            cy.get(S.globalErrorBannerHeading).should('have.text', problem.title);
            cy.get(S.globalErrorBannerContent)
              .should('contain.text', problem.detail)
              .and('contain.text', problem.operation_id);
            cy.get<InstanceType<typeof GlobalStore>>('@globalStore').then((store) => {
              expect(store.bannerError().operationId).to.eq(problem.operation_id);
            });
          } else {
            cy.get(S.globalErrorBannerContent).should('contain.text', GENERIC_HTTP_ERROR_MESSAGE);
          }
          cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
            expect(store.minorCreditors()).to.deep.equal(MINOR_CREDITOR_SAVED_STATE_MOCK.minorCreditors);
            expect(store.creditorDraft()).to.deep.equal({ termId: 1, branch: 'add-new' });
          });
          cy.get(S.creditor.continueButton).click();
          cy.wait('@getMinorCreditorCountries').its('response.statusCode').should('eq', 200);
          cy.get('@getMinorCreditorCountries.all').should('have.length', 2);
          cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.minorCreditorDetails));
          cy.get(S.minorCreditor.countryAutocomplete).should('be.visible').and('be.enabled');
          cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
            expect(store.minorCreditors()).to.deep.equal(MINOR_CREDITOR_SAVED_STATE_MOCK.minorCreditors);
          });
        },
      );
    }
  });

  for (const { name, state, fields, identityRadio, bankRadio } of MINOR_CREDITOR_RESTORATION_CASES) {
    it(`AC1. should rehydrate every saved field for ${name} from the real store`, { tags: buildTags() }, () => {
      setupMinorCreditor({ state });
      cy.get(S.minorCreditor[identityRadio]).should('be.checked');
      cy.get(S.minorCreditor[bankRadio]).should('be.checked');
      for (const [field, value] of [...fields, ...MINOR_CREDITOR_RESTORED_ADDRESS_FIELDS]) {
        cy.get(S.minorCreditor[field]).should('have.value', value);
      }
      cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.unsavedChanges()).to.eq(false);
        expect(store.minorCreditors()).to.deep.equal(state.minorCreditors);
      });
      cy.get('@routerNavigate').should('not.have.been.called');
    });
  }

  it('AC1. should render the exact initial choices without revealing inactive fields', { tags: buildTags() }, () => {
    setupMinorCreditor();
    cy.get(S.heading).should('have.text', 'Minor creditor details');
    cy.get(S.minorCreditor.typeLabels).should(($labels) => {
      expect([...$labels].map((label) => label.textContent?.trim())).to.deep.equal(['Individual', 'Organisation']);
    });
    cy.get(S.minorCreditor.bankLabels).should(($labels) => {
      expect([...$labels].map((label) => label.textContent?.trim())).to.deep.equal([
        'UK bank account',
        'Non-UK bank account',
        'None or not applicable',
      ]);
    });
    for (const selector of [
      S.minorCreditor.individual,
      S.minorCreditor.organisation,
      S.minorCreditor.bankUk,
      S.minorCreditor.bankNonUk,
      S.minorCreditor.bankNone,
    ]) {
      cy.get(selector).should('not.be.checked');
    }
    cy.get(S.minorCreditor.firstNames).should('not.exist');
    cy.get(S.minorCreditor.organisationName).should('not.exist');
    cy.get(S.minorCreditor.ukNameOnAccount).should('not.be.visible');
    cy.get(S.minorCreditor.nonUkNameOnAccount).should('not.be.visible');
    for (const field of [
      'addressLine1',
      'addressLine2',
      'addressLine3',
      'addressLine4',
      'addressLine5',
      'postalOrZipCode',
      'countryAutocomplete',
    ] as const) {
      cy.get(S.minorCreditor[field]).should('be.visible').and('have.value', '');
    }
    cy.get(S.minorCreditor.save).should('be.visible').and('contain.text', 'Save details');
    cy.get(S.minorCreditor.cancel).should('be.visible');
  });

  describe('Required fields, formats and length boundaries', () => {
    for (const branch of ['individual', 'uk', 'nonUk'] as const) {
      const requiredFields = MINOR_CREDITOR_REQUIRED_FIELDS.filter((scenario) => scenario.branch === branch);
      const lengthBoundaries = MINOR_CREDITOR_LENGTH_BOUNDARIES.filter((scenario) => scenario.branch === branch);

      it(
        `AC2, AC3. should reject blank and whitespace-only required fields for ${branch}`,
        { tags: buildTags() },
        () => {
          setupMinorCreditor({
            details: MINOR_CREDITOR_BRANCH_MOCKS[branch],
            formData: Object.fromEntries(requiredFields.map(({ field }) => [F[field], ''])),
          });
          cy.get(S.minorCreditor.save).click();
          assertFieldErrors(
            requiredFields.map(({ field }) => ({
              field,
              selector: S.minorCreditor[field],
              message: COPY[field]['required'],
            })),
          );
          cy.get(S.errorSummaryLinks).should('have.length', requiredFields.length);
          assertNotAccepted();

          for (const { field } of requiredFields) {
            cy.get(S.minorCreditor[field]).clear().type(' ');
          }
          cy.get(S.minorCreditor.save).click();
          assertFieldErrors(
            requiredFields.map(({ field }) => ({
              field,
              selector: S.minorCreditor[field],
              message: COPY[field]['required'],
            })),
          );
          cy.get(S.errorSummaryLinks).should('have.length', requiredFields.length);
          assertNotAccepted();
        },
      );

      it(`AC2, AC3. should reject all over-limit fields for ${branch}`, { tags: buildTags() }, () => {
        setupMinorCreditor({
          details: MINOR_CREDITOR_BRANCH_MOCKS[branch],
          formData: Object.fromEntries(
            lengthBoundaries.map(({ field, maximum, character }) => [F[field], character.repeat(maximum + 1)]),
          ),
        });
        for (const { field, maximum, character } of lengthBoundaries) {
          cy.get(S.minorCreditor[field]).should('have.value', character.repeat(maximum + 1));
        }
        cy.get(S.minorCreditor.save).click();
        assertFieldErrors(
          lengthBoundaries.map(({ field }) => ({
            field,
            selector: S.minorCreditor[field],
            message: COPY[field]['maxlength'],
          })),
        );
        cy.get(S.errorSummaryLinks).should('have.length', lengthBoundaries.length);
        assertNotAccepted();
      });

      it(`AC2, AC4. should save every field at its character limit for ${branch}`, { tags: buildTags() }, () => {
        setupMinorCreditor({
          details: MINOR_CREDITOR_BRANCH_MOCKS[branch],
          formData: Object.fromEntries(
            lengthBoundaries.map(({ field, maximum, character }) => [F[field], character.repeat(maximum)]),
          ),
        });
        cy.get(S.minorCreditor.save).click();
        cy.get(S.errorSummary).should('not.exist');
        cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.minorCreditors()).to.have.length(1);
          expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 1 });
          for (const { maximum, character, storedPath } of lengthBoundaries) {
            cy.wrap(store.minorCreditors()[0].details).its(storedPath).should('eq', character.repeat(maximum));
          }
        });
        cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.minorCreditorSummary));
      });
    }

    for (const { field, branch, value, storedPath } of MINOR_CREDITOR_VALID_FORMATS) {
      it(`AC2, AC4. should save ${field} at valid format boundary ${value.length}`, { tags: buildTags() }, () => {
        setupMinorCreditor({ details: MINOR_CREDITOR_BRANCH_MOCKS[branch], formData: { [F[field]]: value } });
        cy.get(S.minorCreditor.save).click();
        cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.minorCreditors()).to.have.length(1);
          cy.wrap(store.minorCreditors()[0].details).its(storedPath).should('eq', value);
        });
        cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.minorCreditorSummary));
      });
    }

    for (const branch of ['uk', 'nonUk'] as const) {
      it(
        `AC2, AC3, AC4. should reject invalid ${branch} bank formats and save corrected values`,
        { tags: buildTags() },
        () => {
          setupMinorCreditor({ details: MINOR_CREDITOR_BRANCH_MOCKS[branch] });
          for (const { field, value, errorKey } of MINOR_CREDITOR_INVALID_FORMATS.filter(
            (scenario) => scenario.branch === branch,
          )) {
            cy.get(S.minorCreditor[field]).then(($input) => {
              const originalValue = String($input.val() ?? '');
              cy.wrap($input).clear().type(value);
              cy.get(S.minorCreditor.save).click();
              assertFieldError(field, S.minorCreditor[field], COPY[field][errorKey]);
              cy.get(S.errorSummaryLinks).should('have.length', 1);
              assertNotAccepted();
              cy.get(S.minorCreditor[field]).clear();
              if (originalValue) cy.get(S.minorCreditor[field]).type(originalValue);
            });
          }
          cy.get(S.minorCreditor.save).click();
          cy.get(S.errorSummary).should('not.exist');
          assertAccepted(MINOR_CREDITOR_BRANCH_MOCKS[branch], 'Example creditor');
        },
      );
    }
  });

  for (const [identifier, details] of [
    ['BIC/SWIFT only', MINOR_CREDITOR_BIC_MOCK],
    ['IBAN only', MINOR_CREDITOR_IBAN_MOCK],
  ] as const) {
    it(`AC2, AC4. should save a non-UK bank with ${identifier}`, { tags: buildTags() }, () => {
      setupMinorCreditor({ details });
      cy.get(S.minorCreditor.save).click();
      assertAccepted(details, 'Example creditor');
    });
  }

  it(
    'AC3. should retain valid identity, address and bank values when another field is invalid',
    { tags: buildTags() },
    () => {
      setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });
      cy.get(S.minorCreditor.ukSortCode).clear().type('12345');
      cy.get(S.minorCreditor.save).click();
      assertFieldError('ukSortCode', S.minorCreditor.ukSortCode, COPY['ukSortCode']['sortCodeLength']);
      cy.get(S.minorCreditor.organisationName).should('have.value', 'Example creditor');
      cy.get(S.minorCreditor.addressLine1).should('have.value', '1 Test Street');
      cy.get(S.minorCreditor.countryAutocomplete).should('have.value', 'United Kingdom');
      cy.get(S.minorCreditor.ukAccountNumber).should('have.value', '00112233');
      cy.get(S.minorCreditor.ukPaymentReference).should('have.value', 'Example reference');
      assertNotAccepted();
    },
  );

  it(
    'AC2, AC4. should normalise a formatted UK sort code and preserve account leading zeros',
    { tags: buildTags() },
    () => {
      setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });
      cy.get(S.minorCreditor.ukSortCode).clear().type('00-11-22');
      cy.get(S.minorCreditor.save).click();
      assertAccepted(MINOR_CREDITOR_UK_MOCK, 'Example creditor');
    },
  );

  it(
    'AC2, AC4. should save None with only the active identity after changing both branches',
    { tags: buildTags() },
    () => {
      setupMinorCreditor({ details: MINOR_CREDITOR_BIC_MOCK });
      cy.get(S.minorCreditor.individual).check();
      cy.get(S.minorCreditor.firstNames).type('Example');
      cy.get(S.minorCreditor.lastName).type('Person');
      cy.get(S.minorCreditor.bankNone).check();
      cy.get(S.minorCreditor.save).click();
      cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.minorCreditors()[0].details).to.deep.equal({
          identity: { type: 'individual', title: null, firstNames: 'Example', lastName: 'Person' },
          address: MINOR_CREDITOR_BIC_MOCK.address,
          bank: { type: 'none' },
        });
      });
      cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.minorCreditorSummary));
    },
  );

  it('AC2, AC3. should reject an unrecognised Country instead of saving the previous ID', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });
    cy.get(S.minorCreditor.countryAutocomplete).clear().type('Unlisted country').blur();
    cy.get(S.minorCreditor.save).click();
    cy.get(S.errorSummary).should('be.focused').and('contain.text', COPY['countryId']['required']);
    cy.get(S.minorCreditor.fieldError('countryId')).should('contain.text', COPY['countryId']['required']);
    cy.get(S.errorSummaryLinks).contains(COPY['countryId']['required']).click();
    cy.get(S.minorCreditor.countryAutocomplete).should('be.focused');
    assertNotAccepted();
  });

  it(
    'AC2, AC4. should clear non-UK validation errors and discard that branch when None is selected',
    { tags: buildTags() },
    () => {
      setupMinorCreditor({ details: MINOR_CREDITOR_BIC_MOCK });
      cy.get(S.minorCreditor.nonUkBicSwiftCode).clear().type('INVALID');
      cy.get(S.minorCreditor.save).click();
      assertFieldError('nonUkBicSwiftCode', S.minorCreditor.nonUkBicSwiftCode, COPY['nonUkBicSwiftCode']['pattern']);
      cy.get(S.minorCreditor.bankNone).check();
      cy.get(S.minorCreditor.nonUkNameOnAccount).should('not.be.visible').and('be.disabled');
      cy.get(S.minorCreditor.save).click();
      cy.get(S.errorSummary).should('not.exist');
      assertAccepted({ ...MINOR_CREDITOR_BIC_MOCK, bank: { type: 'none' } }, 'Example creditor');
    },
  );

  it('AC4. should save locally without a POST, PUT or PATCH Draft Casefile request', { tags: buildTags() }, () => {
    const write = cy.spy().as('draftCasefileWrite');
    cy.intercept({ method: '+(POST|PUT|PATCH)', url: /\/draft-casefiles(?:\/[^?]*)?(?:\?.*)?$/ }, write);
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });
    cy.get(S.minorCreditor.save).click();
    assertAccepted(MINOR_CREDITOR_UK_MOCK, 'Example creditor');
    cy.get('@draftCasefileWrite').should('not.have.been.called');
  });

  it('AC1, AC4. should create and assign a new Individual creditor with no bank details', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK });

    cy.get(S.minorCreditor.individual).should('be.checked');
    cy.get(S.minorCreditor.firstNames).should('have.value', 'Example');
    cy.get(S.minorCreditor.bankNone).should('be.checked');
    cy.get(S.minorCreditor.save).click();

    assertAccepted(MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK, 'Dr Example Person');
  });

  it('AC1, AC4. should save Organisation, UK bank and the Country ID', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });

    cy.get(S.minorCreditor.organisation).should('be.checked');
    cy.get(S.minorCreditor.countryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(S.minorCreditor.countryId).should('have.value', '826');
    cy.get(S.minorCreditor.ukSortCode).should('have.value', '001122');
    cy.get(S.minorCreditor.save).click();

    assertAccepted(MINOR_CREDITOR_UK_MOCK, 'Example creditor');
  });

  it(
    'AC2, AC4. should save non-UK bank details when both optional identifiers are blank',
    { tags: buildTags() },
    () => {
      setupMinorCreditor({ details: MINOR_CREDITOR_NON_UK_MOCK });

      cy.get(S.minorCreditor.bankNonUk).should('be.checked');
      cy.get(S.minorCreditor.nonUkBicSwiftCode).should('have.value', '');
      cy.get(S.minorCreditor.nonUkIban).should('have.value', '');
      cy.get(S.minorCreditor.nonUkPaymentReference).should('have.value', 'Example reference');
      cy.get(S.minorCreditor.save).click();

      assertAccepted(MINOR_CREDITOR_NON_UK_MOCK, 'Example creditor');
      cy.get(S.errorSummary).should('not.exist');
    },
  );

  it(
    'AC3. should show exact ordered errors, focus the summary and link to each invalid control',
    { tags: buildTags() },
    () => {
      setupMinorCreditor();
      cy.get(S.minorCreditor.save).click();

      const expected = [
        error('creditorType', 'required'),
        error('addressLine1', 'required'),
        error('countryId', 'required'),
        error('bankType', 'required'),
      ];
      assertNotAccepted();
      cy.get(S.errorSummary).should('be.focused').and('contain.text', ERROR_SUMMARY_TITLE);
      cy.get(S.errorSummaryLinks).then(($links) => {
        expect([...$links].map((link) => link.textContent?.trim())).to.deep.equal(expected);
      });
      for (const field of ['creditorType', 'addressLine1', 'countryId', 'bankType'] as const) {
        cy.get(S.minorCreditor.fieldError(field)).should(($error) => {
          expect($error.text().replace(/\s+/g, ' ').trim()).to.eq('Error: ' + COPY[field]['required']);
        });
      }

      for (const [message, selector] of [
        [expected[0], S.minorCreditor.individual],
        [expected[1], S.minorCreditor.addressLine1],
        [expected[2], S.minorCreditor.countryAutocomplete],
        [expected[3], S.minorCreditor.bankUk],
      ]) {
        cy.get(S.errorSummaryLinks).contains(message).click();
        cy.get(selector).should('be.focused');
      }
    },
  );

  it(
    'AC2. should clear identity values and preserve address and bank values when identity changes',
    { tags: buildTags() },
    () => {
      setupMinorCreditor({
        details: { ...MINOR_CREDITOR_UK_MOCK, identity: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK.identity },
      });

      cy.get(S.minorCreditor.organisation).check();
      cy.get(S.minorCreditor.organisationName).type('Replacement creditor');
      cy.get(S.minorCreditor.individual).check();
      cy.get(S.minorCreditor.title).should('have.value', '');
      cy.get(S.minorCreditor.firstNames).should('have.value', '');
      cy.get(S.minorCreditor.lastName).should('have.value', '');
      cy.get(S.minorCreditor.addressLine1).should('have.value', '1 Test Street');
      cy.get(S.minorCreditor.ukNameOnAccount).should('have.value', 'Example creditor');
    },
  );

  it(
    'AC2. should discard UK values when None is selected while preserving identity and address',
    { tags: buildTags() },
    () => {
      setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });

      cy.get(S.minorCreditor.bankNone).check();
      cy.get(S.minorCreditor.bankUk).check();
      cy.get(S.minorCreditor.ukNameOnAccount).should('have.value', '');
      cy.get(S.minorCreditor.ukSortCode).should('have.value', '');
      cy.get(S.minorCreditor.ukAccountNumber).should('have.value', '');
      cy.get(S.minorCreditor.ukPaymentReference).should('have.value', '');
      cy.get(S.minorCreditor.organisationName).should('have.value', 'Example creditor');
      cy.get(S.minorCreditor.addressLine1).should('have.value', '1 Test Street');
    },
  );

  it('AC1. should restore the assigned saved creditor without making the form dirty', { tags: buildTags() }, () => {
    setupMinorCreditor({
      state: {
        orderTerms: [
          {
            termId: 1,
            resultId: 'MAT',
            parameters: { amount: '12.30' },
            creditor: { type: 'minor', sequenceNumber: 7 },
          },
        ],
        minorCreditors: [{ sequenceNumber: 7, displayName: 'Example creditor', details: MINOR_CREDITOR_UK_MOCK }],
        nextMinorCreditorSequence: 8,
        creditorDraft: null,
      },
    });

    cy.get(S.minorCreditor.organisationName).should('have.value', 'Example creditor');
    cy.get(S.minorCreditor.ukAccountNumber).should('have.value', '00112233');
    cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.unsavedChanges()).to.eq(false);
      expect(store.minorCreditors()).to.have.length(1);
    });
  });

  it('AC4. should retry failed navigation without allocating another creditor', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) =>
      navigate.onFirstCall().resolves(false),
    );

    cy.get(S.minorCreditor.save).click();
    cy.get(S.minorCreditor.save).should('be.visible');
    cy.get(S.minorCreditor.save).click();

    cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.minorCreditors()).to.have.length(1);
      expect(store.nextMinorCreditorSequence()).to.eq(2);
      expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 1 });
    });
    cy.get('@routerNavigate').should('have.been.calledTwice');
  });

  it('AC4. should save new edits to the same creditor after navigation failure', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) =>
      navigate.onFirstCall().rejects(new Error('Synthetic navigation failure')),
    );

    cy.get(S.minorCreditor.save).click();
    cy.get(S.minorCreditor.save).should('be.visible');
    cy.get(S.minorCreditor.organisationName).clear().type('Updated creditor');
    cy.get(S.minorCreditor.save).click();

    cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.minorCreditors()).to.have.length(1);
      expect(store.minorCreditors()[0].sequenceNumber).to.eq(1);
      expect(store.minorCreditors()[0].displayName).to.eq('Updated creditor');
      expect(store.minorCreditors()[0].details.identity).to.deep.equal({
        type: 'organisation',
        organisationName: 'Updated creditor',
      });
      expect(store.nextMinorCreditorSequence()).to.eq(2);
    });
  });

  it('AC4. should Cancel without edits or creating a creditor', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });
    const confirmation = cy.spy().as('unexpectedConfirmation');
    cy.on('window:confirm', confirmation);

    cy.get(S.minorCreditor.cancel).click();

    cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.orderTermCreditor));
    cy.get('@unexpectedConfirmation').should('not.have.been.called');
    cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.minorCreditors()).to.deep.equal([]);
      expect(store.creditorDraft()).to.eq(null);
      expect(store.unsavedChanges()).to.eq(false);
    });
  });
});

describe('Minor creditor details accessibility', () => {
  for (const [label, radio, firstControl] of [
    ['Organisation', S.minorCreditor.organisation, S.minorCreditor.organisationName],
    ['non-UK bank', S.minorCreditor.bankNonUk, S.minorCreditor.nonUkNameOnAccount],
  ] as const) {
    it(`AC5. should select ${label} by keyboard and focus its revealed fields`, { tags: buildTags() }, () => {
      setupMinorCreditor();
      cy.get(radio).focus();
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(firstControl).should('be.visible');
      cy.get(radio).should('be.checked').and('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(firstControl).should('be.focused');
    });
  }

  it('AC5. should skip hidden bank fields and reach Save and Cancel in logical order', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK });
    cy.get(S.minorCreditor.bankNone).focus();
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.minorCreditor.save).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.minorCreditor.cancel).should('be.focused');
  });

  it(
    'AC4, AC5. should confirm dirty Cancel by keyboard and discard the unsaved new creditor',
    { tags: buildTags() },
    () => {
      setupCreditor({
        initialChild: PATHS.children.minorCreditorDetails,
        state: { creditorDraft: { termId: 1, branch: 'add-new' } },
      });
      cy.get(S.minorCreditor.organisation).check();
      cy.get(S.minorCreditor.organisationName).type('Unsaved creditor');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
      cy.window().then((window) => {
        cy.stub(window, 'confirm').as('unsavedChangesConfirm').returns(true);
      });
      cy.get(S.minorCreditor.cancel).focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.get('@unsavedChangesConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermCreditor));
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.minorCreditors()).to.deep.equal([]);
        expect(store.creditorDraft()).to.eq(null);
        expect(store.unsavedChanges()).to.eq(false);
      });
    },
  );

  it(
    'RGAC1, RGAC2. should request a reload warning while Minor Details has unsaved edits',
    { tags: buildTags() },
    () => {
      setupCreditor({
        shell: true,
        initialChild: PATHS.children.minorCreditorDetails,
        state: MINOR_CREDITOR_SAVED_STATE_MOCK,
      });
      cy.get(S.minorCreditor.organisationName).clear().type('Unsaved creditor');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
      cy.window().then((window) => {
        const event = new Event('beforeunload', { cancelable: true });
        expect(window.dispatchEvent(event)).to.eq(false);
        expect(event.defaultPrevented).to.eq(true);
      });
      cy.get(S.minorCreditor.organisationName).should('have.value', 'Unsaved creditor');
    },
  );

  it('AC5. should move from keyboard type selection into the revealed identity fields', { tags: buildTags() }, () => {
    setupMinorCreditor();

    cy.get(S.minorCreditor.individual).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.minorCreditor.title).should('be.visible');
    cy.get(S.minorCreditor.individual).should('be.checked').and('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.minorCreditor.title).should('be.focused');
  });

  it('AC5. should move from keyboard bank selection into the revealed bank fields', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK });

    cy.get(S.minorCreditor.bankUk).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.minorCreditor.ukNameOnAccount).should('be.visible');
    cy.get(S.minorCreditor.bankUk).should('be.checked').and('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.minorCreditor.ukNameOnAccount).should('be.focused');
  });

  it('AC5. should select Country through the autocomplete keyboard interaction', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });

    // The autocomplete requires element-bound native key events to update and accept its active option.
    cy.get(S.minorCreditor.countryAutocomplete).clear().type('Fra').type('{downarrow}{enter}');
    cy.get(S.minorCreditor.countryAutocomplete).should('have.value', 'France');
    cy.get(S.minorCreditor.countryId).should('have.value', '250');
  });

  it('AC3, AC5. should activate an error-summary link and move focus to its control', { tags: buildTags() }, () => {
    setupMinorCreditor();
    // Element-bound Enter reliably exercises the button activation path in the component runner.
    cy.get(S.minorCreditor.save).focus().type('{enter}');
    cy.get(S.errorSummary).should('be.focused');
    cy.get(S.errorSummaryLinks).contains('Enter an address').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.minorCreditor.addressLine1).should('be.focused');
  });

  it('AC4, AC5. should activate Save with Enter', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });

    // Element-bound Enter reliably exercises the button activation path in the component runner.
    cy.get(S.minorCreditor.save).focus().type('{enter}');
    cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.minorCreditorSummary));
    cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 1 });
    });
  });

  it('AC4, AC5. should activate dirty Cancel by keyboard and retain data when declined', { tags: buildTags() }, () => {
    setupCreditor({ initialChild: PATHS.children.minorCreditorDetails, state: MINOR_CREDITOR_SAVED_STATE_MOCK });
    cy.get(S.minorCreditor.organisationName).clear().type('Unsaved creditor');
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
    cy.window().then((window) => {
      cy.stub(window, 'confirm').as('unsavedChangesConfirm').returns(false);
    });

    cy.get(S.minorCreditor.cancel).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);

    cy.get('@unsavedChangesConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.minorCreditorDetails));
    cy.get(S.minorCreditor.organisationName).should('have.value', 'Unsaved creditor');
  });

  for (const [name, details] of [
    ['Individual and UK bank', { ...MINOR_CREDITOR_UK_MOCK, identity: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK.identity }],
    ['Organisation and non-UK bank', MINOR_CREDITOR_BIC_MOCK],
  ] as const) {
    it(`AC5. should pass Axe for ${name}`, { tags: buildTags() }, () => {
      setupMinorCreditor({ details });
      scan();
      cy.screenshot(`po-9809-minor-creditor-${name.toLowerCase().replaceAll(' ', '-')}`);
    });
  }

  it('AC5. should pass Axe in the empty and validation-error states', { tags: buildTags() }, () => {
    setupMinorCreditor();
    scan();
    cy.screenshot('po-9809-minor-creditor-empty');
    cy.get(S.minorCreditor.save).click();
    cy.get(S.errorSummary).should('be.focused');
    scan();
    cy.screenshot('po-9809-minor-creditor-errors');
  });

  it('AC5. should pass Axe on the routed Summary', { tags: buildTags() }, () => {
    setupCreditor({
      shell: true,
      initialChild: PATHS.children.minorCreditorSummary,
      state: MINOR_CREDITOR_SAVED_STATE_MOCK,
    });
    cy.get(S.heading).should('have.text', 'Minor creditor summary');
    scan();
    cy.screenshot('po-9809-minor-creditor-summary');
  });
});
