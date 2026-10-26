import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { CheckerDeletionFlow } from '../../../e2e/functional/opal/flows/checkAndValidateCase/checker-deletion.flow';

const flow = new CheckerDeletionFlow();

Given('my live deletion scenario owns a submitted case for {string}', (kind: string) => flow.prepare(kind));
Given('my accessible deletion scenario owns a submitted case for {string}', (kind: string) =>
  flow.prepareAccessible(kind),
);
When('I confirm deletion with the prepared 250-character reason', () => flow.confirm());
When('I confirm deletion without a reason', () => flow.submitValidation());
When('I confirm deletion with the prepared 251-character reason', () => flow.submitValidation());
When('I enter a {int}-character deletion reason', (length: number) => flow.enterReasonWithLength(length));
When('I cancel deletion', () => flow.cancel());
When('I explicitly retry deletion after a definite failure', () => flow.retry());
Then('the linked deletion validation says {string}', (message: string) => flow.assertValidation(message));
Then('the saved case remains unchanged without a deletion decision', () => flow.assertUnchanged());
Then('the owned case is retained in Deleted with its recorded reason', () => flow.assertDeleted());
