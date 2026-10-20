import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { PaymentsFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/payments.flow';

const flow = new PaymentsFlow();

Given('I have reached the payment tasks with completed mandatory parties and Order Details', () => flow.start());
When('I open Interest and Indexation', () => flow.openInterest());
When('I reopen Interest and Indexation', () => flow.openInterest());
When('I choose interest {string} and indexation {string}', (interest: string, indexation: string) =>
  flow.chooseInterest(interest, indexation),
);
When('I save Interest and Indexation to Case Details', () => flow.saveInterest());
Then(
  'interest {string} and indexation {string} are retained without submitting the casefile',
  (interest: string, indexation: string) => flow.assertInterest(interest, indexation),
);
Given('I have saved interest {string} and indexation {string}', (interest: string, indexation: string) =>
  flow.prepareInterest(interest, indexation),
);
When('I open Managing Payments', () => flow.openPayments());
When('I choose {string} payments', (arrangement: string) => flow.chooseArrangement(arrangement));
When('I save Managing Payments to Case Details', () => flow.savePayments());
Then(
  '{string} payments and the saved interest and indexation are retained without submitting the casefile',
  (arrangement: string) => flow.assertPaymentsAndInterest(arrangement),
);
When('I select no interest and RPI indexation using the keyboard', () => flow.chooseInterestUsingKeyboard());
When('I select direct payments using the keyboard', () => flow.chooseDirectUsingKeyboard());
