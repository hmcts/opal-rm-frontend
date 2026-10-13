import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { CasePartiesFlow } from '../../../e2e/functional/opal/flows/createDraftCasefile/case-parties.flow';

const flow = new CasePartiesFlow();

Given('I am an authorised RM casefile inputter', () => flow.authenticate('authorised'));
Given('I have started a live REMO In casefile with an {string} applicant', (path: string) => {
  if (path !== 'Individual' && path !== 'Organisation') throw new Error('Unsupported RM applicant path');
  flow.start(path);
});
When('I capture the respondent and individual applicant', () => flow.captureIndividual());
Then('both individual party tasks are complete with their details retained locally', () => flow.verifyIndividual());
When('I capture the respondent and organisation applicant', () => flow.captureOrganisation());
Then('both organisation party tasks are complete with their details retained locally', () => flow.verifyOrganisation());
