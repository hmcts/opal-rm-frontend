import {
  assertApplicantBankRejected,
  assertApplicantBankSaved,
  assertBankFieldError,
} from './assertions/bank-length.assertions';
import { APPLICANT_BANK_SCENARIOS, watchDraftCasefileWrites } from './setup/applicant-bank-length.setup';

const DEFECT_TAG = '@JIRA-DEFECT:PO-11895';
const EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (storyTag: string): string[] => [DEFECT_TAG, storyTag, EPIC_TAG, '@JIRA-LABEL:create-draft-casefile'];
const PAYMENT_REFERENCE_ERROR = 'Payment reference must be 18 characters or fewer';
const REFERENCE_AT_LIMIT = 'PAY-12345678901234';
const REFERENCE_OVER_LIMIT = REFERENCE_AT_LIMIT + '5';

describe('Applicant payment reference length', () => {
  for (const applicant of APPLICANT_BANK_SCENARIOS) {
    const { selectors } = applicant;
    for (const bankType of ['uk', 'non-uk'] as const) {
      const field = bankType === 'uk' ? selectors.ukBankPaymentReference : selectors.nonUkBankPaymentReference;
      const savedApplicant = applicant.savedApplicant[bankType];

      it(
        `AC2, AC3. should block a 19-character ${bankType.toUpperCase()} payment reference and save an 18-character reference for an ${applicant.name} applicant`,
        { tags: buildTags(applicant.storyTag) },
        () => {
          watchDraftCasefileWrites();
          applicant.mount(bankType);

          cy.get(field).clear().type(REFERENCE_OVER_LIMIT);
          cy.get(selectors.returnToCaseDetails).click();

          assertBankFieldError(field, PAYMENT_REFERENCE_ERROR);
          cy.get(field).should('have.value', REFERENCE_OVER_LIMIT);
          cy.get(selectors.addressLine1).should('have.value', savedApplicant.contactDetails.address.addressLine1);
          assertApplicantBankRejected(applicant.childPath, savedApplicant);

          cy.get(field).clear().type(REFERENCE_AT_LIMIT);
          cy.get(selectors.returnToCaseDetails).click();
          assertApplicantBankSaved(savedApplicant, 'paymentReference', REFERENCE_AT_LIMIT);
        },
      );
    }
  }
});
