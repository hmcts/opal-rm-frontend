import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { CheckCaseDetailsModesFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/check-case-details-modes.flow';

const flow = new CheckCaseDetailsModesFlow();
Given(
  'my persisted casefile session has role {string}, status {string} and submitter {string}',
  (role: string, status: string, submitter: string) => flow.prepare(role, status, submitter),
);
Given('the saved casefile has a {string} failure', (failure: string) => flow.fail(failure));
When('I open saved casefile {string} through {string}', (id: string, destination: string) =>
  flow.open(destination, id),
);
When('I open saved details from my In review dashboard', () => flow.openFromInputter());
When('I open saved {string} with untrusted mode query flags', (destination: string) => flow.openWithQuery(destination));
Then('I see the saved parties, order terms and chronological case history', () => flow.expectSummary());
Then('the saved case is in {string} mode without summary editing', (mode: string) => flow.expectMode(mode));
When('I continue with saved decision {string} and reason {string}', (decision: string, reason: string) =>
  flow.decide(decision, reason),
);
Then('the saved decision error {string} is linked from the focused summary', (message: string) =>
  flow.expectError(message),
);
When('I change the saved review decision to Approve and continue', () => flow.switchToApprove());
When('I return from the saved case details', () => flow.back());
Then('the saved case stays unchanged when the {string} dashboard is shown', (dashboard: string) =>
  flow.expectReturn(dashboard),
);
When('I choose Delete casefile from saved review', () => flow.chooseDelete());
Then('the interim Delete casefile walkthrough is shown', () => flow.expectDelete());
When('I return from the interim Delete walkthrough', () => flow.returnFromDelete());
Then('saved case access is denied after {int} selected GET requests', (count: number) => flow.expectDenied(count));
When('I attempt saved casefile {string} through {string} from the Cases page', (id: string, destination: string) =>
  flow.attempt(destination, id),
);
Then('saved details fail safely after {int} selected GET requests', (count: number) => flow.expectFailure(count));
Then('switching to another saved draft and starting creation clears the previous saved state', () =>
  flow.switchThenCreate(),
);
Then('no saved casefile mutation has been requested', () => flow.expectNoWrites());
