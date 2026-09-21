import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { OrderTermsFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/order-terms.flow';

const flow = new OrderTermsFlow();

Given('I open the Order Terms Summary for a new casefile', () => flow.openSummary());
When('I start adding an order term', () => flow.startAdd());
When('I choose order term {string}', (id: string) => flow.choose(id));
When('I continue from order term selection', () => flow.continue());
When('I return from the order term input destination', () => flow.back());
Then('the input destination identifies order term {string} without creating a draft', (id: string) =>
  flow.assertInput(id),
);
Then('order term {string} is selected', (id: string) => flow.assertSelection(id));
Then('the order term validation summary links to the required choice', () => flow.assertValidation());
Then('reloading the order term destination returns to Case Type with navigation hidden', () => flow.reload());
When('I enter order term amount {string}', (amount: string) => flow.enterAmount(amount));
When('I continue from order term input', () => flow.continueInput());
Then('I reach Creditor without creating a draft casefile', () => flow.assertCreditor());
Then('the amount validation summary links to Amount', () => flow.assertAmountRequired());
Given('I have two accepted maintenance orders with different amounts', () => flow.givenTwoAcceptedMaintenanceOrders());
When('I change the second maintenance order and complete its creditor selection', () =>
  flow.amendSecondMaintenanceOrder(),
);
Then('only the second maintenance order has the amended amount', () => flow.assertOnlySecondOrderAmended());
Then('the casefile has not been submitted', () => flow.assertCasefileNotSubmitted());
Given('I am amending an accepted order with a shared minor creditor', () => flow.givenSharedMinorCreditorAmendment());
When('I enter a new minor creditor and cancel its review', () => flow.enterNewCreditorAndCancelReview());
Then('the original order and shared creditor remain unchanged', () => flow.assertOriginalOrderAndCreditor());
Then('the new minor creditor is not selectable', () => flow.assertNewCreditorUnavailable());
When('I open removal for the second order and return to order terms', () => flow.openSecondRemovalAndReturn());
Then('both original orders remain on the summary', () => flow.assertBothOriginalOrders());
When('I open removal for the second maintenance order', () => flow.openSecondRemoval());
When('I return from the order term removal placeholder', () => flow.returnFromRemoval());
