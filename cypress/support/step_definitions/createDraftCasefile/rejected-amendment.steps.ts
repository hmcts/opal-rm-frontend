import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { RejectedAmendmentActions } from '../../../e2e/functional/opal/actions/createDraftCasefile/rejected-amendment.actions';

const actions = new RejectedAmendmentActions();
Given('a rejected casefile was submitted by {string} in my RM business unit', (submitter: string) =>
  actions.prepare(submitter),
);
When('I amend that case from the rejected cases list', () => actions.openRejectedAmendment());
When('I correct the respondent and check the corrected case details', () => actions.correctRespondentAndReview());
Then('the corrected respondent and unchanged case details are shown', () => actions.expectCorrectedDetails());
When('I resubmit the corrected case', () => actions.resubmitCorrectedCase());
Then('one replacement request uses the same case identifier and saved version', () => actions.expectReplacement());
Given('rejected amendment entry is unavailable because of {string}', (reason: string) => actions.prepare('me', reason));
When('I open the rejected amendment URL directly', () => actions.openDirect());
Then('rejected amendment entry is denied for {string}', (reason: string) => actions.expectDenied(reason));
Then('the rejected amendment state is accessible at {int} CSS pixels', (width: number) =>
  actions.expectAccessibleReflow(width),
);
Then('the amendment review actions are reachable using the keyboard', () => actions.expectKeyboardActions());

Given('I have corrected a rejected case with an uncertain submission outcome', () => actions.prepareUncertain());
When('I go Back and choose to keep my corrections', () => actions.declineBack());
When('I go Back and choose to discard my corrections', () => actions.acceptBack());
Then('one fresh read restores the saved respondent without resubmitting', () => actions.expectReloaded());
Then('my corrections remain and no replacement request is replayed', () => actions.expectUncertainRetention());
