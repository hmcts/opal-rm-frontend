import {
  assertApplicantBankRejected,
  assertApplicantBankSaved,
  assertBankFieldError,
} from './assertions/bank-length.assertions';
import { APPLICANT_BANK_SCENARIOS, watchDraftCasefileWrites } from './setup/applicant-bank-length.setup';

const DEFECT_TAG = '@JIRA-DEFECT:PO-11893';
const EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (storyTag: string): string[] => [DEFECT_TAG, storyTag, EPIC_TAG, '@JIRA-LABEL:create-draft-casefile'];
const NAME_ON_ACCOUNT_ERROR = 'Name on account must be 18 characters or fewer';
const NAME_AT_LIMIT = 'Test Account Owner';
const NAME_OVER_LIMIT = NAME_AT_LIMIT + 's';

describe('Applicant name on account length', () => {
  for (const applicant of APPLICANT_BANK_SCENARIOS) {
    const { selectors } = applicant;
    for (const bankType of ['uk', 'non-uk'] as const) {
      const field = bankType === 'uk' ? selectors.ukBankNameOnAccount : selectors.nonUkBankNameOnAccount;
      const savedApplicant = applicant.savedApplicant[bankType];

      it(
        `AC2, AC3. should block a 19-character ${bankType.toUpperCase()} name on account and save an 18-character name for an ${applicant.name} applicant`,
        { tags: buildTags(applicant.storyTag) },
        () => {
          watchDraftCasefileWrites();
          applicant.mount(bankType);

          cy.get(field).clear().type(NAME_OVER_LIMIT);
          cy.get(selectors.returnToCaseDetails).click();

          assertBankFieldError(field, NAME_ON_ACCOUNT_ERROR);
          cy.get(field).should('have.value', NAME_OVER_LIMIT);
          cy.get(selectors.addressLine1).should('have.value', savedApplicant.contactDetails.address.addressLine1);
          assertApplicantBankRejected(applicant.childPath, savedApplicant);

          cy.get(field).clear().type(NAME_AT_LIMIT);
          cy.get(selectors.returnToCaseDetails).click();
          assertApplicantBankSaved(savedApplicant, 'nameOnAccount', NAME_AT_LIMIT);
        },
      );
    }
  }
});
