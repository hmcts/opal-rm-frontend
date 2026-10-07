import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { AllRejectedFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/all-rejected.flow';

const flow = new AllRejectedFlow();
Given('other inputters have rejected casefiles in my RM business unit', () => flow.available());
When('I open all rejected cases from my Rejected tab', () => flow.openFromRejected());
Then('I see the complete other-inputter collection with six sortable columns and no case counts', () =>
  flow.expectCollection(),
);
Given('my dashboard and all rejected list have different page and sort selections', () => flow.independentSelections());
When('I view an all rejected case and return to that list', () => flow.visitDetailsAndReturn());
Then('my all rejected selection is restored with fresh rows', () => flow.expectRestoredList());
When('I return to my cases', () => flow.returnDashboard());
Then('my originating Rejected dashboard selection is restored with fresh rows', () => flow.expectRestoredDashboard());
Given('I selected a later all rejected page and a different sort', () => flow.laterSelection());
When('I refresh all rejected cases', () => flow.refresh());
Then('the list starts with the oldest rejection on page one', () => flow.expectDefaults());
Given('my all rejected consultation fails once', () => flow.failOnce());
When('I open all rejected cases', () => flow.openDirect());
Then('I see a recoverable list failure without an empty message', () => flow.expectFailure());
When('I retry the rejected consultation', () => flow.retry());
Then('I see the refreshed other-inputter collection', () => flow.expectRecovered());
Given('I have RM inputter permissions while the RM create casefiles release is disabled', () => flow.available());
When('I open the all rejected cases URL directly', () => flow.openDirect());
Then('access is denied without rejected collection or persisted case requests', () => flow.expectDenied());
When('I return from a rejected details shell through browser history', () => flow.browserReturn());
When('the rejected collection shrinks during my details visit', () => flow.shrinkReturn());
Then('the rejected selection retains its sort and clamps to the remaining page', () => flow.expectClamp());
Given('there are no other-inputter rejected cases', () => flow.empty());
Then('the rejected consultation shows its empty result without table or pagination', () => flow.expectEmpty());
When('I retry while the rejected provider response is pending', () => flow.pendingRetry());
When('the rejected provider completes the pending consultation', () => flow.releaseRetry());
When('the provider revokes access during the pending rejected consultation', () => flow.loseAccess());
Then('the rejected table remains contained at 320 CSS pixels', () => flow.reflow());
Then('I capture the populated rejected consultation', () => flow.capturePopulated());
Then('I capture the failed rejected consultation', () => flow.captureFailure());
Then('I capture the empty rejected consultation', () => flow.captureEmpty());
Then('I capture the pending rejected consultation', () => flow.capturePending());
When('I view the selected rejected details shell', () => flow.openDetails());
When('I return from the rejected shell to the refreshed consultation', () => flow.returnList());
Given('my rejected consultation role is {string}', (role: string) => flow.deniedRole(role));
When('I open a rejected {string} shell without a remembered origin', (kind: string) => flow.directShell(kind));

Then('the denied pending consultation exposes no rejected rows or retry control', () => flow.expectPendingDenied());
Then('the protected rejected {string} shell offers the safe dashboard fallback', (kind: string) =>
  flow.expectDirectShell(kind),
);
