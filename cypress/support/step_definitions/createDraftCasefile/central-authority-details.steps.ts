import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { CentralAuthorityDetailsFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/central-authority-details.flow';

const flow = new CentralAuthorityDetailsFlow();

When('I open Central Authority details in a new REMO Out casefile', () => flow.openInNewRemoOutCasefile());
When(
  'I save Central Authority details with references {string} and {string} and authority {string}',
  (remo: string, reference: string, authority: string) => flow.saveDetails(remo, reference, authority),
);
Then('Central Authority is marked Provided on Case details', () => flow.assertTaskProvided());
When('I reopen Central Authority details', () => flow.reopen());
Then(
  'the references {string} and {string} and authority {string} are editable',
  (remo: string, reference: string, authority: string) => flow.assertEditableDetails(remo, reference, authority),
);
When('I submit over-limit Central Authority references', () => flow.submitOverLimitReferences());
