import { Before, Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { InputterCasefileMonitoringFlow } from '../../../e2e/functional/opal/flows/checkAndValidateCase/inputter-casefile-monitoring.flow';

let flow: InputterCasefileMonitoringFlow;
Before({ tags: '@JIRA-STORY:PO-10628' }, () => {
  flow = new InputterCasefileMonitoringFlow();
});

Given('my live monitoring scenario owns one casefile in each lifecycle tab', () => flow.prepareLifecycle());
When('I inspect my live inputter lifecycle tabs', () => flow.inspectLifecycle());
Then('every owned casefile appears only in its matching lifecycle tab', () => flow.expectLifecycle());
Given('my live monitoring scenario owns a {string} casefile', (status: string) => flow.prepareStatus(status));
When('I consult its dashboard at seven and eight calendar days after its lifecycle date', () => flow.consultDates());
Then('its live visibility follows the {string} window', (window: string) => flow.expectWindow(window));
Given('my live personal rejection collection is {string} and another inputter owns a rejected case', (state: string) =>
  flow.prepareRejections(state),
);
When('I follow View all rejected cases from my live dashboard', () => flow.viewAllRejected());
Then('the real Business Unit rejection list contains the expected owned cases', () => flow.expectAllRejected());
Given("my live scenario owns paginated rejections and another inputter's rejected case", () =>
  flow.preparePagination(),
);
When('I open that case for amendment from All rejected and return', () => flow.amendAndReturn());
Then('the matching persisted draft and originating dashboard page and sort are retained', () => flow.expectRestored());
Given('my live monitoring scenario owns a published casefile with two minor creditors', () =>
  flow.prepareStatus('PUBLISHED'),
);
When('I inspect its Approved row', () => flow.inspectApproved());
Then('all generated respondent applicant and minor creditor numbers match the saved snapshot as read-only text', () =>
  flow.expectAccounts(false),
);
Given('my live monitoring scenario owns a verified pending casefile', () => flow.prepareStatus('PUBLISHING_PENDING'));
Then('the pending casefile does not appear in Approved', () => flow.expectAccounts(true));
Given('live authorised monitoring entry succeeds and my provisioned denied user lacks permission 21', () =>
  flow.prepareDenied(),
);
When('the denied user opens the inputter monitoring dashboard', () => flow.openDenied());
Then('access is denied without casefile counts or rows', () => flow.expectDenied());
When('I consult the live {string} monitoring tab with the keyboard', (tab: string) => flow.consultTab(tab));
Then('the live {string} monitoring tab contains its owned lifecycle row', (tab: string) => flow.expectTab(tab));
Given('my live personal monitoring dashboard is genuinely empty', () => flow.prepareEmpty());
Then('the live consulted monitoring tab is genuinely empty', () => flow.expectEmpty());
When('I open the other inputter owned rejection with the keyboard', () => flow.openOther());
When('I return from live amendment to All rejected with the keyboard', () => flow.returnList());
When('I return from live All rejected to my dashboard with the keyboard', () => flow.returnDashboard());

When('I sort my live personal rejections {string} by applicant with the keyboard', (direction: string) =>
  flow.sortPersonal(direction),
);
When('I visit the {string} live personal rejection page with the keyboard', (direction: string) =>
  flow.pagePersonal(direction),
);

Then('the real Business Unit rejection list contains the expected owned cases with every visited page accessible', () =>
  flow.expectAllRejected(true),
);
When('I open the other inputter owned rejection with every visited sort and page accessible', () =>
  flow.openOther(true),
);
