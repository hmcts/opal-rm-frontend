/// <reference path="../../src/app/flows/cases/cases-create-casefile/cases-create-casefile-order-terms-input/types/accessible-autocomplete.d.ts" />
/// <reference types="@cypress/grep" />
import { register as registerCypressGrep } from '@cypress/grep';
import 'cypress-axe';
import 'cypress-mochawesome-reporter/register';
import { addGdsBodyClass } from '@hmcts/opal-frontend-common/components/govuk/helpers';

registerCypressGrep();

beforeEach(function () {
  const test = this.currentTest;

  // @ts-expect-error Cypress test metadata is untyped here
  const tags = test?._testConfig.unverifiedTestConfig.tags;

  if (tags && tags.length > 0) {
    test.title = `${test.title} [${tags.join(', ')}]`;
  }

  addGdsBodyClass();
});
