import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { CreateCaseFilesReleaseActions } from '../../../e2e/functional/opal/actions/releaseFlags/create-case-files-release.actions';

const actions = new CreateCaseFilesReleaseActions();

When('I open the RM path {string}', (path: string) => actions.openPath(path));
When('I refresh the RM page', () => actions.refresh());
When('I follow the create case entry point', () => actions.followCreateCase());
When('I return to the dashboard from Access Denied', () => actions.returnToDashboard());
Then('only the Cases section and create case entry point are available', () => actions.assertCasesOnly());
Then('the create case type page is available without primary navigation', () => actions.assertCaseType());
Then('RM access is denied without primary navigation or a create case entry point', () => actions.assertAccessDenied());
Then('the unreleased RM section is denied with only Cases in navigation', () =>
  actions.assertUnreleasedSectionDenied(),
);
