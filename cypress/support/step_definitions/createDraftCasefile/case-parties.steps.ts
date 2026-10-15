import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { CasePartiesFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/case-parties.flow';

const flow = new CasePartiesFlow();

Given('I have the live RM casefile permission', () => flow.assertPermission(true));
Given('I do not have the live RM casefile permission', () => flow.assertPermission(false));
Given('the released RM casefile entry is available', () => flow.assertReleasedEntry());
When('I attempt to open the protected casefile task {string}', (path: string) => flow.openDeniedTask(path));
Then('I cannot access the Draft Casefile task', () => flow.assertDenied());

Given('I have started a live REMO In casefile with an {string} applicant', (path: string) => {
  if (path !== 'Individual' && path !== 'Organisation') throw new Error('Unsupported RM applicant path');
  flow.start(path);
});
When('I capture the respondent and individual applicant', () => flow.captureIndividual());
Then('both individual party tasks are complete with their details retained locally', () => flow.verifyIndividual());
When('I capture the respondent and organisation applicant', () => flow.captureOrganisation());
Then('both organisation party tasks are complete with their details retained locally', () => flow.verifyOrganisation());

When('I open the respondent page for accessibility', () => flow.openRespondentForAccessibility());
When('I populate the respondent details for accessibility', () => flow.populateRespondentForAccessibility());
When('I save the respondent details for accessibility', () => flow.saveRespondentForAccessibility());
When('I exercise the respondent optional details for accessibility', () => flow.scanRespondentOptionalControls());
When('I open the individual applicant page for accessibility', () => flow.openIndividualForAccessibility());
When('I populate the individual applicant details for accessibility', () => flow.populateIndividualForAccessibility());
When('I save the individual applicant details for accessibility', () => flow.saveIndividualForAccessibility());
When('I exercise the individual applicant bank choices for accessibility', () => flow.scanIndividualBankControls());
When('I open the organisation applicant page for accessibility', () => flow.openOrganisationForAccessibility());
When('I populate the organisation applicant details for accessibility', () =>
  flow.populateOrganisationForAccessibility(),
);
When('I save the organisation applicant details for accessibility', () => flow.saveOrganisationForAccessibility());
When('I exercise the organisation applicant bank choices for accessibility', () => flow.scanOrganisationBankControls());
