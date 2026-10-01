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
