import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { CheckerDeletionFlow } from '../../../e2e/functional/opal/flows/checkAndValidateCase/checker-deletion.flow';

const flow = new CheckerDeletionFlow();

Given('my live deletion scenario owns a submitted case for {string}', (kind: string) => flow.prepare(kind));
When('its independent checker completes the deletion interaction', () => flow.act());
Then('the deletion outcome preserves the owned case and records only its intended decision', () =>
  flow.assertOutcome(),
);
