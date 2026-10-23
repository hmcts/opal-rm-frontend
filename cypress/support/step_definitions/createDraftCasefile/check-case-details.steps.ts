import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { CheckCaseDetailsFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/check-case-details.flow';

const flow = new CheckCaseDetailsFlow();
Given('I am reviewing a live completed Draft Casefile', () => flow.openLive());
When('I submit the live Draft Casefile', () => flow.submitLive());
Then('the live Draft Casefile submission is confirmed', () => flow.assertLiveConfirmation());
Then('the submitted Create Draft Casefile journey is cleared', () => flow.clearSubmittedJourney());
Given('I am reviewing a complete casefile for submission', () => flow.open());
Given('I have completed a casefile ready for review', () => flow.prepareReadyForReview());
When('I open the completed casefile review', () => flow.openReview());
When('I open casefile comments and notes', () => flow.openComments());
When('I save optional casefile comments and notes', () => flow.saveComments());
When('I save optional casefile comments and notes using the keyboard', () => flow.saveCommentsUsingKeyboard());
Then('review includes the saved casefile comments and notes', () => flow.assertReviewWithComments());
When('I reopen comments and notes from casefile review', () => flow.reopenComments());
Then('the saved casefile comments and notes are retained', () => flow.assertRetainedComments());
When('I return to review from comments and notes', () => flow.returnFromComments());
Then('review has no optional casefile comments or notes', () => flow.assertReviewWithoutComments());
Then('the submission omits optional casefile comments and notes', () => flow.assertNoOptionalSubmission());
When('the next casefile submission is definitely rejected', () => flow.prepareRejectedSubmission());
Then('the casefile submission failure is shown', () => flow.assertRejectedSubmission());
Then('the complete reviewed casefile is retained', () => flow.assertRetainedReviewAfterFailure());
Then('the corrected casefile is submitted after the rejection', () => flow.assertCorrectedRetry());
When('I correct the respondent from casefile review', () => flow.correctRespondent());
Then('review shows the corrected respondent and unchanged orders', () => flow.assertCorrection());
When('I submit the casefile for submission', () => flow.submit());
Then('submission confirmation is shown after one create request', () => flow.assertConfirmation());
When('I refresh the submission confirmation', () => flow.refreshConfirmation());
When('I open cancellation and return to the reviewed draft', () => flow.cancel());
When('I open case creation cancellation', () => flow.openCancellation());
When('I confirm discarding the local case', () => flow.discard());
Then('an empty new case journey is shown without submitting data', () => flow.assertRestartedJourney());
Then('the accepted draft is retained without a submission', () => flow.assertRetainedDraft());
Then('case creation starts with no selected case or applicant type', () => flow.assertFreshCase());
Then('browser history cannot recover the discarded case', () => flow.assertHistoryStaysEmpty());
Then('I cannot reach Draft Casefile cancellation or create a case', () => flow.assertCancellationUnavailable());

When('I create a new case from casefile confirmation', () => flow.startNextCase());
When('I go back from casefile confirmation', () => flow.backFromConfirmation());
Then('the submitted case journey is empty without another create request', () =>
  flow.assertClearedJourneyAfterSubmission(),
);

When('I open casefile confirmation without submitting a case', () => flow.openFreshConfirmation());

Then('the submitted party forms and review cannot be reopened', () => flow.assertSubmittedFormsBlocked());
