import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { MinorCreditorManagementFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/minor-creditor-management.flow';
import type { MinorCreditorKind } from '../../../e2e/functional/opal/types/createDraftCasefile/minor-creditor-kind.type';
const flow = new MinorCreditorManagementFlow();

Given('I have reviewed a new {string} Minor Creditor', (kind: MinorCreditorKind) => flow.createReviewed(kind));
When('I continue from the reviewed Minor Creditor', () => flow.acceptReviewed());
Then('the {string} Minor Creditor is retained for its Order Term', (kind: MinorCreditorKind) =>
  flow.assertAccepted(kind),
);
When('I change the reviewed {string} Minor Creditor', (kind: MinorCreditorKind) => flow.changeReviewed(kind));
Then('the updated {string} Minor Creditor is in the local review', (kind: MinorCreditorKind) =>
  flow.assertReviewed(kind, true),
);
Then('the updated {string} Minor Creditor is retained for its Order Term', (kind: MinorCreditorKind) =>
  flow.assertAccepted(kind, true),
);
When('I open removal for the reviewed Minor Creditor', () => flow.openRemoval());
When('I confirm removal of the reviewed Minor Creditor', () => flow.confirmRemoval());
When('I abandon removal of the reviewed Minor Creditor', () => flow.cancelRemoval());
Then('the {string} Minor Creditor review is unchanged', (kind: MinorCreditorKind) => flow.assertReviewed(kind));
Then('the removed {string} Minor Creditor is not restored', (kind: MinorCreditorKind) => flow.assertRemoved(kind));
When('I check Minor Creditor bank branches for accessibility', () => flow.scanBankBranches());

When('I reopen Minor Creditor details for accessibility', () => flow.reopenDetails());
When('I save the {string} Minor Creditor after accessibility checks', (kind: MinorCreditorKind) =>
  flow.saveReviewed(kind),
);
