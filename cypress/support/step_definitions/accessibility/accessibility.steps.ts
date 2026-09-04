import { Then } from '@badeball/cypress-cucumber-preprocessor';
import { accessibilityActions } from '../../../e2e/functional/opal/actions/accessibility/accessibility.actions';

Then('I check the page for accessibility', () => {
  accessibilityActions.checkAccessibilityOnly();
});
