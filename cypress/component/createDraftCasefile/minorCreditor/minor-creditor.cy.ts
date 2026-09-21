import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_ERRORS as ERRORS } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/constants/cases-create-casefile-minor-creditor-field-errors.constant';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/constants/cases-create-casefile-minor-creditor-field-names.constant';
import type { ICasesCreateCasefileMinorCreditorDetails } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-minor-creditor-details.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { ERROR_SUMMARY_TITLE } from '../constants/create-casefile-test-copy.constant';
import {
  MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK,
  MINOR_CREDITOR_NON_UK_MOCK,
  MINOR_CREDITOR_UK_MOCK,
} from './mocks/minor-creditor.mock';
import { setupMinorCreditor, type MinorCreditorStore } from './setup/minor-creditor.setup';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9809', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;
const error = (field: keyof typeof F, key: string): string => (ERRORS[F[field]]?.[key] as { message: string }).message;

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

describe('Minor creditor details', () => {
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

  it('AC2, AC4. should save a non-UK bank when both international identifiers are blank', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_NON_UK_MOCK });

    cy.get(S.minorCreditor.bankNonUk).should('be.checked');
    cy.get(S.minorCreditor.nonUkBicSwiftCode).should('have.value', '');
    cy.get(S.minorCreditor.nonUkIban).should('have.value', '');
    cy.get(S.minorCreditor.nonUkPaymentReference).should('have.value', 'Example reference');
    cy.get(S.minorCreditor.save).click();

    assertAccepted(MINOR_CREDITOR_NON_UK_MOCK, 'Example creditor');
  });

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
      cy.get(S.errorSummary).should('be.focused').and('contain.text', ERROR_SUMMARY_TITLE);
      cy.get(S.errorSummaryLinks).then(($links) => {
        expect([...$links].map((link) => link.textContent?.trim())).to.deep.equal(expected);
      });

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
      details: MINOR_CREDITOR_UK_MOCK,
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
    cy.get(S.minorCreditor.navigationError).should('contain.text', ERROR_SUMMARY_TITLE);
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
    cy.get(S.minorCreditor.navigationError).should('exist');
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
