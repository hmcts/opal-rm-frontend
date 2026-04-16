/// <reference types="@cypress/grep" />
import './commands';
import { register as registerCypressGrep } from '@cypress/grep';
import { addGdsBodyClass } from '@hmcts/opal-frontend-common/components/govuk/helpers';

registerCypressGrep();

beforeEach(() => {
  addGdsBodyClass();
});
