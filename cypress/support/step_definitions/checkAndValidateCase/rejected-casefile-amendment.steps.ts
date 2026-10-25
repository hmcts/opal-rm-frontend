import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { RejectedCasefileAmendmentFlow } from '../../../e2e/functional/opal/flows/checkAndValidateCase/rejected-casefile-amendment.flow';

const flow = new RejectedCasefileAmendmentFlow();

Given('an owned rejected case is ready for the {string} amendment outcome', (kind: string) => flow.prepare(kind));
Given('an owned rejected case is ready for the accessible {string} amendment outcome', (kind: string) =>
  flow.prepare(kind, true),
);
When('I complete the real {string} rejected amendment journey', (kind: string) => flow.complete(kind));
Then('the real {string} rejected amendment outcome is retained', (kind: string) => flow.assertOutcome(kind));
