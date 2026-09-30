import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { CentralAuthorityDetailsFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/central-authority-details.flow';

const flow = new CentralAuthorityDetailsFlow();

When('I open Central Authority details in a new REMO Out casefile', () => flow.openInNewRemoOutCasefile());
When(
  'I save Central Authority details with references {string} and {string} using the first available authority',
  (remo: string, reference: string) => flow.saveDetails(remo, reference, 'first'),
);
When(
  'I save Central Authority details with references {string} and {string} using the second available authority',
  (remo: string, reference: string) => flow.saveDetails(remo, reference, 'second'),
);
Then('Central Authority is marked Provided on Case details', () => flow.assertTaskProvided());
When('I reopen Central Authority details', () => flow.reopen());
Then(
  'the references {string} and {string} and the first available authority are editable',
  (remo: string, reference: string) => flow.assertEditableDetails(remo, reference, 'first'),
);
Then(
  'the references {string} and {string} and the second available authority are editable',
  (remo: string, reference: string) => flow.assertEditableDetails(remo, reference, 'second'),
);
When('I submit over-limit Central Authority references', () => flow.submitOverLimitReferences());
