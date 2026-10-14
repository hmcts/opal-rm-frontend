import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { CreditorSelectionFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/creditor-selection.flow';
const flow = new CreditorSelectionFlow();

Given('I am choosing a creditor for an Order Term', () => flow.startChoice());
Given('I am choosing a creditor for a second term with an existing Minor Creditor', () => flow.prepareReuse());
When('I accept the applicant as the creditor', () => flow.acceptApplicant());
Then('the applicant creditor is retained', () => flow.assertApplicant());
When('I accept an available Major Creditor', () => flow.acceptMajor());
Then('the selected Major Creditor is retained', () => flow.assertMajor());
When('I choose the existing Minor Creditor', () => flow.chooseExistingMinor());
When('I accept the existing Minor Creditor', () => flow.acceptExistingMinor());
Then('both Order Terms retain the same Minor Creditor', () => flow.assertReuse());
Then('the existing Minor Creditor has not been duplicated', () => flow.assertNoDuplicate());
Then('no existing Minor Creditor choice is displayed', () => flow.assertHidden());
When('I reveal the Major Creditor choices', () => flow.showMajorConditional());
Then('the Major Creditor choices are visible', () => flow.assertMajorConditional());
