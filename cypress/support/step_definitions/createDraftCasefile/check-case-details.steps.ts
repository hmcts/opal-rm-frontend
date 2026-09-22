import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { CheckCaseDetailsFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/check-case-details.flow';

const flow = new CheckCaseDetailsFlow();
Given('I am reviewing a complete casefile in the local mock', () => flow.open());
When('I correct the respondent from casefile review', () => flow.correctRespondent());
Then('review shows the corrected respondent and unchanged orders', () => flow.assertCorrection());
When('I submit the casefile using the local mock', () => flow.submit());
Then('a mock receipt is shown without a backend create request', () => flow.assertReceipt());
When('I refresh the mock receipt', () => flow.refreshReceipt());
When('I open cancellation and return to the reviewed draft', () => flow.cancel());
Then('the mock receipt expires without another submission', () => flow.assertExpiredReceipt());
Then('the accepted draft is retained without a submission', () => flow.assertRetainedDraft());
