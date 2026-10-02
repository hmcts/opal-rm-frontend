import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { CheckCaseDetailsFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/check-case-details.flow';

const flow = new CheckCaseDetailsFlow();
Given('I am reviewing a complete casefile for submission', () => flow.open());
When('I correct the respondent from casefile review', () => flow.correctRespondent());
Then('review shows the corrected respondent and unchanged orders', () => flow.assertCorrection());
When('I submit the casefile for submission', () => flow.submit());
Then('the submitted case reference is shown after one create request', () => flow.assertConfirmation());
When('I refresh the submission confirmation', () => flow.refreshConfirmation());
When('I open cancellation and return to the reviewed draft', () => flow.cancel());
Then('refresh starts a new journey without repeating the submission', () => flow.assertRestartedJourney());
Then('the accepted draft is retained without a submission', () => flow.assertRetainedDraft());
