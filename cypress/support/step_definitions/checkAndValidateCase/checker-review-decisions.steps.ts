import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { CheckerReviewFlow } from '../../../e2e/functional/opal/flows/checkAndValidateCase/checker-review-decisions.flow';
import { CheckerDashboardWindowFlow } from '../../../e2e/functional/opal/flows/checkAndValidateCase/checker-dashboard-window.flow';

const checker = new CheckerReviewFlow();

Given('my live checker scenario owns a submitted case with two minor creditors', () =>
  checker.prepare('SUBMITTED', 'publication'),
);
Given('my live checker scenario owns a {string} case for {string}', (status: string, kind: string) =>
  checker.prepare(status, kind),
);
Given('my live checker scenario owns a {string} protected case', (kind: string) => checker.prepareProtection(kind));
When('its independent checker approves the case through review', () => checker.decide('approve'));
When('its independent checker chooses {string} through review', (decision: string) => checker.decide(decision));
When('its checker submits a blank rejection reason', () => checker.rejectBlank());
When('its checker attempts the protected review route', () => checker.attemptProtectedDecision());
When('its checker submits stale {string} after a competing rejection', (decision: string) => checker.compete(decision));
Then('the case leaves To review and confirms approval', () => checker.assertDecision('approve'));
Then('the case leaves To review and confirms rejection to its inputter', () => checker.assertDecision('reject'));
Then('actual publication supplies every generated account number on its inputter dashboard', () =>
  checker.assertPublication(),
);
Then('linked rejection validation prevents every change to the saved case', () => checker.assertValidation());
Then('checker protection exposes no decision and leaves the saved case unchanged', () => checker.assertProtected());
Then('the safe conflict preserves the competing checker decision', () => checker.assertConflict());
Then('the live checker {string} journey is accessible with its business outcome verified', (kind: string) =>
  checker.accessible(kind),
);

const checkerWindow = new CheckerDashboardWindowFlow();
Given('my live checker outcome scenario owns a {string} case', (status: string) => checkerWindow.prepare(status));
When('the checker consults its outcomes on inside boundary and outside calendar days', () => checkerWindow.consult());
Then('its real collection and dashboard follow the {string} rule', (window: string) =>
  checkerWindow.assertWindow(window),
);
Given('my live checker outcome collections are genuinely empty', () => checkerWindow.prepareEmpty());
When('the checker consults every empty outcome tab', () => checkerWindow.consultEmpty());
Then('all checker outcome tabs retain genuine empty states and zero counts', () => checkerWindow.assertEmpty());
When('the checker traverses its independent {string} outcome calendar accessibly', (status: string) =>
  checkerWindow.accessible(status),
);
When('the checker traverses genuinely empty outcome tabs accessibly', () => checkerWindow.accessibleEmpty());
