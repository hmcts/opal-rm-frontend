import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { IndividualCasePartiesFlow } from 'cypress/e2e/functional/opal/flows/createDraftCasefile/individual-case-parties.flow';

const flow = new IndividualCasePartiesFlow();

When('I start a REMO In case with an Individual applicant', () => flow.startRemoInIndividual());
Then('the respondent Country options show United Kingdom first and the next three alphabetically', () =>
  flow.assertRespondentCountrySampleOrdered(),
);
When('I complete the minimum respondent details', () => flow.completeMinimumRespondent());
When('I complete the minimum individual applicant details', () => flow.completeMinimumApplicant());
Then('the Respondent and Applicant tasks are Provided', () => flow.assertMandatoryPartyTasksProvided());
Then('the respondent and applicant details are retained when reopened', () => flow.assertBothPartiesRetained());
