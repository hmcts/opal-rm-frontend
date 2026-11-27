import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import {
  assertApplicantBankRejected,
  assertApplicantBankSaved,
  assertBankFieldError,
} from './assertions/bank-length.assertions';
import { MINOR_CREDITOR_NON_UK_MOCK } from './minorCreditor/mocks/minor-creditor.mock';
import { setupMinorCreditor, type MinorCreditorStore } from './minorCreditor/setup/minor-creditor.setup';
import { APPLICANT_BANK_SCENARIOS, watchDraftCasefileWrites } from './setup/applicant-bank-length.setup';

const DEFECT_TAG = '@JIRA-DEFECT:PO-11896';
const EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (storyTag: string): string[] => [DEFECT_TAG, storyTag, EPIC_TAG, '@JIRA-LABEL:create-draft-casefile'];
const BANK_NAME_ERROR = 'Bank name must be 100 characters or fewer';
const BANK_NAME_AT_LIMIT = 'B'.repeat(100);
const BANK_NAME_OVER_LIMIT = BANK_NAME_AT_LIMIT + 'B';

describe('Non-UK bank name length', () => {
  for (const applicant of APPLICANT_BANK_SCENARIOS) {
    const { selectors } = applicant;
    const field = selectors.nonUkBankName;
    const savedApplicant = applicant.savedApplicant['non-uk'];

    it(
      `AC2, AC3. should block a 101-character bank name and save a 100-character name for an ${applicant.name} applicant`,
      { tags: buildTags(applicant.storyTag) },
      () => {
        watchDraftCasefileWrites();
        applicant.mount('non-uk');

        cy.get(field).clear().type(BANK_NAME_OVER_LIMIT);
        cy.get(selectors.returnToCaseDetails).click();

        assertBankFieldError(field, BANK_NAME_ERROR);
        cy.get(field).should('have.value', BANK_NAME_OVER_LIMIT);
        cy.get(selectors.addressLine1).should('have.value', savedApplicant.contactDetails.address.addressLine1);
        assertApplicantBankRejected(applicant.childPath, savedApplicant);

        cy.get(field).clear().type(BANK_NAME_AT_LIMIT);
        cy.get(selectors.returnToCaseDetails).click();
        assertApplicantBankSaved(savedApplicant, 'bankName', BANK_NAME_AT_LIMIT);
      },
    );

    it(
      `AC2. should save without a non-UK bank name for an ${applicant.name} applicant`,
      { tags: buildTags(applicant.storyTag) },
      () => {
        applicant.mount('non-uk');
        cy.get(field).clear();
        cy.get(selectors.returnToCaseDetails).click();
        assertApplicantBankSaved(savedApplicant, 'bankName', null);
      },
    );
  }

  it(
    'AC2, AC3. should block a 101-character bank name and save a 100-character name for a minor creditor',
    { tags: buildTags('@JIRA-STORY:PO-9809') },
    () => {
      watchDraftCasefileWrites();
      setupMinorCreditor({ details: MINOR_CREDITOR_NON_UK_MOCK });
      const field = Page.minorCreditor.nonUkBankName;

      cy.get(field).type(BANK_NAME_OVER_LIMIT);
      cy.get(Page.minorCreditor.save).click();

      assertBankFieldError(field, BANK_NAME_ERROR);
      cy.get(field).should('have.value', BANK_NAME_OVER_LIMIT);
      cy.get(Page.minorCreditor.nonUkNameOnAccount).should('have.value', MINOR_CREDITOR_NON_UK_MOCK.bank.nameOnAccount);
      cy.get('@routerNavigate').should('not.have.been.called');
      cy.get<MinorCreditorStore>('@casesCreateCasefileStore').should((store) => {
        expect(store.creditorDraft()?.details).to.be.undefined;
        expect(store.minorCreditors()).to.be.empty;
      });
      cy.get('@draftCasefileWrite').should('not.have.been.called');

      cy.get(field).clear().type(BANK_NAME_AT_LIMIT);
      cy.get(Page.minorCreditor.save).click();

      cy.get(Page.errorSummary).should('not.exist');
      cy.get<MinorCreditorStore>('@casesCreateCasefileStore').should((store) => {
        expect(store.creditorDraft()?.details).to.deep.equal({
          ...MINOR_CREDITOR_NON_UK_MOCK,
          bank: { ...MINOR_CREDITOR_NON_UK_MOCK.bank, bankName: BANK_NAME_AT_LIMIT },
        });
      });
      cy.get('@routerNavigate').should(
        'have.been.calledOnceWith',
        '/' + PATHS.root + '/' + PATHS.children.minorCreditorSummary,
      );
    },
  );

  it(
    'AC2. should save without a non-UK bank name for a minor creditor',
    { tags: buildTags('@JIRA-STORY:PO-9809') },
    () => {
      setupMinorCreditor({ details: MINOR_CREDITOR_NON_UK_MOCK });
      cy.get(Page.minorCreditor.nonUkBankName).should('have.value', '');
      cy.get(Page.minorCreditor.save).click();

      cy.get(Page.errorSummary).should('not.exist');
      cy.get<MinorCreditorStore>('@casesCreateCasefileStore').should((store) => {
        expect(store.creditorDraft()?.details).to.deep.equal(MINOR_CREDITOR_NON_UK_MOCK);
      });
      cy.get('@routerNavigate').should(
        'have.been.calledOnceWith',
        '/' + PATHS.root + '/' + PATHS.children.minorCreditorSummary,
      );
    },
  );
});
