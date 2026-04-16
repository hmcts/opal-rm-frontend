import { Then } from '@badeball/cypress-cucumber-preprocessor';
import { CommonLocators as Common } from '../../shared/selectors/common.locators';
import { log } from '../utils/log.helper';

Then('the URL should contain {string}', (urlPart: string) => {
  log('assert', 'Checking the current URL', { urlPart });
  cy.location('pathname').should('include', urlPart);
});

Then('I should see the header containing text {string}', (expectedHeader: string) => {
  log('assert', 'Checking the page heading', { expectedHeader });
  cy.get(Common.mainHeading, { timeout: 20_000 }).should('contain.text', expectedHeader);
});

Then('I should see the service header containing text {string}', (expectedHeader: string) => {
  log('assert', 'Checking the service header', { expectedHeader });
  cy.get(Common.serviceName, { timeout: 20_000 }).should('contain.text', expectedHeader);
});

Then('I see the following text on the page {string}', (text: string) => {
  log('assert', 'Checking visible text on the current page', { text });
  cy.get(Common.pageContent, { timeout: 20_000 }).should('contain.text', text);
});
