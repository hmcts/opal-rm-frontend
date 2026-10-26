import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { RejectedCasefileAmendmentFlow } from '../../../e2e/functional/opal/flows/checkAndValidateCase/rejected-casefile-amendment.flow';

const flow = new RejectedCasefileAmendmentFlow();

Given('an owned rejected case is ready for the {string} amendment outcome', (kind: string) => flow.prepare(kind));
Given('an owned rejected case is ready for the accessible {string} amendment outcome', (kind: string) =>
  flow.prepare(kind, true),
);
When('I resubmit the complete corrected rejected case', () => flow.resubmit());
When('I explicitly retry the complete correction after a definite failure', () => flow.retryResubmission());
When('I submit my old correction after another correction has returned the case to review', () =>
  flow.submitStaleReplacement(),
);
When('I attempt to amend the protected rejected case', () => flow.attemptDeniedEntry());
Then(
  'the corrected case returns to review with its original identifier and the originating rejection list no longer contains the case',
  () => flow.assertResubmitted(),
);
Then(
  'the corrected case returns to review with its original identifier, leaves the originating rejection list, and the correcting inputter becomes latest submitter and cannot review that case',
  () => flow.assertResubmitted(),
);
Then('I recover the saved winning correction without replay', () => flow.assertStaleRecovery());
Then('amendment is denied without exposing or changing the case', () => flow.assertDenied());
