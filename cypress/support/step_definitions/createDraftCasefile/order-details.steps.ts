import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { OrderDetailsFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/order-details.flow';
const flow = new OrderDetailsFlow();
Given('I have completed the parties for a new REMO In casefile', () => flow.completeParties());
When('I open Order Details with available applications', () => flow.openAvailable());
When('I save an application, monthly payments and an arrears date without an order date', () =>
  flow.saveWithoutOrderDate(),
);
Then('Order Details is marked Provided and the remaining order tasks are available', () => flow.assertProvided());
When('I reopen Order Details', () => flow.reopen());
Then('my saved Order Details are editable', () => flow.assertEditable());
When('the Order Details applications lookup fails', () => flow.openWithFailure());
Then('Case Details retains my parties and announces a safe correlated error', () => flow.assertSafeFailure());
When('I retry opening Order Details using the keyboard', () => flow.retryUsingKeyboard());
Then('Order Details opens with the available applications', () => flow.assertAvailable());
When('I return from Order Details without entering required fields', () => flow.submitEmpty());
Then('the Order Details error summary receives focus', () => flow.assertErrorFocus());
When('no Order Details applications are available', () => flow.openEmpty());
Then('refreshing Order Details returns to Case Type with primary navigation hidden', () => flow.reloadJourney());
