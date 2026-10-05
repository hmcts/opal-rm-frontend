import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { InputterDashboardFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/inputter-dashboard.flow';

const flow = new InputterDashboardFlow();
Given('my inputter casefile collection is available', () => flow.available());
When('I open Create cases from the Cases page', () => flow.enterFromCases());
Then('I see the four inputter lifecycle tabs', () => flow.expectTabs());
Then('I see an empty Case Type page', () => flow.expectEmptyCaseType());
Given('my rejected inputter list contains more than one page', () => flow.rejected());
Given('I have selected rejected page 2 sorted by applicant descending', () => flow.selectRejectedPage());
When("I open a rejected case's details", () => flow.openRejectedDetails());
When('I return to Create cases', () => flow.returnFromPlaceholder());
Then('my rejected page and sort are restored with refreshed rows', () => flow.expectRestored());
When('I view all rejected cases', () => flow.viewAllRejected());
Then('the protected all rejected cases page is shown in the same tab', () => flow.expectAllRejectedPlaceholder());
Given('my approved collection contains a published case and an unexpected pending case', () => flow.approved());
When('I select Approved cases', () => flow.selectApproved());
Then('I see only the published account numbers as text', () => flow.expectPublished());
Then('the request is bounded by publication status date', () => flow.expectDateBoundary());
Given('I started a new case from the rejected inputter dashboard', () => flow.startFromRejected());
Then('the rejected inputter dashboard selection is restored', () => flow.expectOriginRestored());
Given('my inputter list and rejected count temporarily fail', () => flow.temporaryFailures());
When('I open the inputter dashboard', () => flow.open());
Then('the list error is announced and both retries are available', () => flow.expectErrors());
When('I retry the inputter list using the keyboard', () => flow.retryList());
Then('my inputter list is restored while the count error remains', () => flow.expectListRecovered());
When('I retry the rejected count using the keyboard', () => flow.retryBadge());
Then('the rejected count is restored without reloading the list', () => flow.expectBadgeRecovered());
Given('my create permission belongs only to another business unit', () => flow.crossBusinessUnit());
Then('inputter access is denied without collection or persistence requests', () => flow.expectDenied());
When('I return to the inputter dashboard from confirmation', () => flow.returnFromConfirmation());
Then('In review starts on its default page and sort', () => flow.expectDefaultReview());
When('I inspect each populated inputter table', () => flow.screenshotTables());
Then('the inputter dashboard reflows at 320 CSS pixels', () => flow.reflow());
Given('my rejected inputter list is {string}', (state: string) => flow.rejected(state));
When('I cancel a dirty Case Type page and {string} leaving', (decision: string) => flow.cancelCaseType(decision));
Then('the Case Type cancellation outcome is {string}', (outcome: string) => flow.expectCaseTypeCancellation(outcome));
When('I open the persisted {string} destination with identifier {string}', (kind: string, id: string) =>
  flow.openPersisted(kind, id),
);
Then('the {string} shell shows {string} without persistence requests', (kind: string, message: string) =>
  flow.expectShell(kind, message),
);
When('I open the protected inputter path {string}', (path: string) => flow.openProtected(path));
Given('the inputter dashboard is in the {string} state', (state: string) => flow.state(state));
Then('I capture the {string} inputter shell', (kind: string) => flow.screenshotShell(kind));

Then('I capture the fresh Case Type page', () => flow.captureCaseType());
