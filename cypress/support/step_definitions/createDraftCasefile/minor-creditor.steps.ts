import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { MinorCreditorFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/minor-creditor.flow';

const flow = new MinorCreditorFlow();

Given('I am adding a minor creditor to an accepted order term', () => flow.openMinorCreditor());
When('I provide valid organisation creditor details with a non-UK bank and no international identifiers', () =>
  flow.enterInternationalOrganisation(),
);
When('I save the minor creditor details', () => flow.saveDetails());
Then('the minor creditor validation summary shows all required errors', () => flow.assertRequiredValidation());
Then('I reach Minor Creditor Summary without creating a draft casefile', () => flow.assertSummaryWithoutDraftWrite());
When('I enter an unsaved minor creditor name', () => flow.enterUnsavedName());
When('I cancel minor creditor details and decline the warning', () => flow.cancelDetails(false));
When('I cancel minor creditor details and accept the warning', () => flow.cancelDetails(true));
Then('my minor creditor name remains on the details page', () => flow.assertUnsavedNameRetained());
Then('I return to Creditor without a new minor creditor', () => flow.assertCreditorWithoutNewMinor());
