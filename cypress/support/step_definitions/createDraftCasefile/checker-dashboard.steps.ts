import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { CheckerDashboardFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/checker-dashboard.flow';
import {
  checkerRole,
  checkerDestination,
} from '../../../e2e/functional/opal/mocks/createDraftCasefile/checker-dashboard.mock';

const flow = new CheckerDashboardFlow();
Given('my checker dashboard session has role {string}', (role: string) => flow.prepare(checkerRole(role)));
When('I open Review cases from the Cases page', () => flow.enterFromCases());
Then("I see four checker queues and only other submitters' cases", () => flow.expectQueuesAndOtherWork());
Then('every checker list and count request uses my Business Unit identity exclusion', () => flow.expectRequestScope());
Given('I selected rejected page 2 sorted by applicant descending', () => flow.selectRejectedPage());
When('I view a rejected case and return after the collection shrinks', () => flow.viewRejectedAndShrink());
Then('the fresh rejected collection retains sorting and clamps to page 1', () => flow.expectFreshClampedReturn());
Given('the first checker list request fails once', () => flow.failFirstList());
Given('the first Failed count request fails once', () => flow.failFirstFailedCount());
Then('the existing error page handles the initial checker failure', () => flow.expectInitialError());
Then('the checker table remains usable without the unavailable Failed badge', () => flow.expectCountFailureWithTable());
When('I open the protected checker destination {string}', (destination: string) =>
  flow.openProtected(checkerDestination(destination)),
);
Then('checker access is denied without collection or persistence requests', () => flow.expectDenied());
Then('I cannot start or directly enter case creation', () => flow.prohibitCreation());
Then('each checker queue has its status and date contract and oldest original review order', () =>
  flow.inspectQueues(),
);
When('I open the safe checker {string} shell with identifier {string}', (kind: string, id: string) =>
  flow.safeShell(checkerDestination(kind), id),
);
Given('a Failed list response is pending', () => flow.pendingOutcome());
Then('leaving the pending outcome recovers its count and a newer list wins', () => flow.recoverPendingOutcome());
When('I lose checker permission while a consultation is pending', () => flow.revokePendingAccess());
Then('the two dashboard journeys retain independent return selections', () => flow.independentReturns());
Given('the checker dashboard is in the {string} state', (state: string) => flow.state(state));
Then('I capture the checker {string} state', (state: string) => flow.captureState(state));
When('I inspect Cases entry and each populated checker table', () => flow.screenshotTables());
Then('the checker dashboard reflows with a keyboard reachable scroll region', () => flow.reflow());
Then('I capture the {string} checker shell', (kind: string) => flow.captureShell(kind));

Then(
  'a later checker {string} failure with status {int} and reference {string} uses the existing error route',
  (kind: string, status: number, reference: string) => flow.laterFailure(kind, status, reference),
);
