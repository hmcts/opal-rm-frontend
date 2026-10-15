import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { OrderTermsManagementFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/order-terms-management.flow';
const flow = new OrderTermsManagementFlow();

Given('I have started Order Terms with completed Order Details', () => flow.start());
Given('I have two applicant Order Terms', () => flow.prepareTwo());
When('I open Order Term selection', () => flow.openSelection());
When('I continue Order Term selection to MAT input', () => flow.continueSelectedInput());
When('I open the MAT input', () => flow.openInput());
When('I complete the MAT input with amount {string}', (amount: string) => flow.completeInput(amount));
When('I accept the applicant for Order Term {string} with amount {string}', (alias: string, amount: string) =>
  flow.acceptApplicant(alias, amount),
);
When('I add a applicant Order Term with amount {string} as {string}', (amount: string, alias: string) =>
  flow.addApplicantTerm(amount, alias),
);
Then('Order Term {string} retains amount {string}', (alias: string, amount: string) => flow.assertTerm(alias, amount));
When('I reopen Order Term {string} with amount {string}', (alias: string, amount: string) =>
  flow.replay(alias, amount),
);
When('I amend only the second Order Term', () => flow.amendSecond());
Then('the two Order Terms retain amounts {string} and {string}', (first: string, second: string) =>
  flow.assertBoth(first, second),
);
When('I open removal for Order Term {string}', (alias: string) => flow.openRemoval(alias));
When('I abandon Order Term removal', () => flow.cancelRemoval());
When('I confirm removal of Order Term {string}', (alias: string) => flow.confirmRemoval(alias));
