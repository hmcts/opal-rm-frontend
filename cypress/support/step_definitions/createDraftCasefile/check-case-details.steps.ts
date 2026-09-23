import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { CheckCaseDetailsFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/check-case-details.flow';

const flow = new CheckCaseDetailsFlow();
Given('I am reviewing a complete casefile for simulated submission', () => flow.open());
When('I correct the respondent from casefile review', () => flow.correctRespondent());
Then('review shows the corrected respondent and unchanged orders', () => flow.assertCorrection());
When('I submit the casefile for simulated submission', () => flow.submit());
Then('a submission confirmation is shown without a backend create request', () => flow.assertConfirmation());
When('I refresh the submission confirmation', () => flow.refreshConfirmation());
When('I open cancellation and return to the reviewed draft', () => flow.cancel());
When('I open case creation cancellation', () => flow.openCancellation());
When('I confirm discarding the local case', () => flow.discard());
Then('an empty new case journey is shown without submitting data', () => flow.assertRestartedJourney());
Then('the accepted draft is retained without a submission', () => flow.assertRetainedDraft());
Then('case creation starts with no selected case or applicant type', () => flow.assertFreshCase());
Then('browser history cannot recover the discarded case', () => flow.assertHistoryStaysEmpty());

When('I choose {string} from casefile confirmation', (link: 'Create a new case' | 'See your cases in review') =>
  flow.startNextCase(link),
);
When('I go back from casefile confirmation', () => flow.backFromConfirmation());

When('I open casefile confirmation without submitting a case', () => flow.openFreshConfirmation());
