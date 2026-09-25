import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { CreditorFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/creditor.flow';

const flow = new CreditorFlow();

Given('active non-Central-Authority Major creditors are available', () => flow.prepareMajorCreditors());
Given('Countries are available for minor creditor details', () => flow.prepareCountries());
Then('the creditor page is ready with the scoped Major creditor query', () => flow.assertReady());
When('I choose the applicant as creditor', () => flow.chooseApplicant());
When('I choose a Major creditor', () => flow.chooseMajor());
When('I choose to add a new minor creditor', () => flow.chooseAddNew());
When('I continue from creditor selection', () => flow.continue());
Then('I reach Order Terms Summary without creating a draft casefile', () => flow.assertSummaryWithoutPersistence());
Then('the creditor validation summary links to the required choice', () => flow.assertValidation());
Then('the selected Major creditor remains identified by ID', () => flow.assertMajorSelected());
When('I cancel minor creditor details without edits', () => flow.cancelMinorDetailsWithoutEdits());
Then('I return to Creditor without a selected creditor', () => flow.assertNoNewMinorCreditor());
When('I cancel creditor selection and decline the warning', () => flow.cancel(false));
When('I cancel creditor selection and accept the warning', () => flow.cancel(true));
Then('my Applicant creditor edit remains selected', () => flow.assertCreditorRetained());
When('I reload the creditor page without journey state', () => flow.reloadWithoutJourneyState());
Then('the creditor route rejects the missing term context', () => flow.assertMissingContextRejected());
