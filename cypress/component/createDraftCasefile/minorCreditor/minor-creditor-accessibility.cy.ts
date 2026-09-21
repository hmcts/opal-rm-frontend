import { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { UNSAVED_CHANGES_WARNING } from '../constants/create-casefile-test-copy.constant';
import { setupCreditor, type CreditorStore } from '../creditor/setup/creditor.setup';
import {
  MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK,
  MINOR_CREDITOR_NON_UK_MOCK,
  MINOR_CREDITOR_PENDING_STATE_MOCK,
  MINOR_CREDITOR_SAVED_STATE_MOCK,
  MINOR_CREDITOR_UK_MOCK,
} from './mocks/minor-creditor.mock';
import { setupMinorCreditor, type MinorCreditorStore } from './setup/minor-creditor.setup';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9809', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const scan = (): void => {
  cy.document().its('documentElement.lang').should('eq', 'en');
  cy.get('[role="main"], main').should('exist');
  cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
  cy.checkA11y(undefined, { runOnly: { type: 'tag', values: axeTags } }, (violations) => {
    if (violations.length) {
      throw new Error(
        JSON.stringify(
          violations.map(({ id, help, nodes }) => ({ id, help, targets: nodes.map(({ target }) => target) })),
        ),
      );
    }
  });
};
describe('Minor creditor details accessibility', () => {
  it('AC5. should move from keyboard type selection into the revealed identity fields', { tags: buildTags() }, () => {
    setupMinorCreditor();

    cy.get(S.minorCreditor.individual).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.minorCreditor.title).should('be.visible');
    cy.get(S.minorCreditor.individual).should('be.checked').and('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.minorCreditor.title).should('be.focused');
  });

  it('AC5. should move from keyboard bank selection into the revealed bank fields', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK });

    cy.get(S.minorCreditor.bankUk).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.minorCreditor.ukNameOnAccount).should('be.visible');
    cy.get(S.minorCreditor.bankUk).should('be.checked').and('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.minorCreditor.ukNameOnAccount).should('be.focused');
  });

  it('AC5. should select Country through the autocomplete keyboard interaction', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });

    // The autocomplete requires element-bound native key events to update and accept its active option.
    cy.get(S.minorCreditor.countryAutocomplete).clear().type('Fra').type('{downarrow}{enter}');
    cy.get(S.minorCreditor.countryAutocomplete).should('have.value', 'France');
    cy.get(S.minorCreditor.countryId).should('have.value', '250');
  });

  it('AC3, AC5. should activate an error-summary link and move focus to its control', { tags: buildTags() }, () => {
    setupMinorCreditor();
    // Element-bound Enter reliably exercises the button activation path in the component runner.
    cy.get(S.minorCreditor.save).focus().type('{enter}');
    cy.get(S.errorSummary).should('be.focused');
    cy.get(S.errorSummaryLinks).contains('Enter an address').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.minorCreditor.addressLine1).should('be.focused');
  });

  it('AC4, AC5. should activate Save with Enter', { tags: buildTags() }, () => {
    setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });

    // Element-bound Enter reliably exercises the button activation path in the component runner.
    cy.get(S.minorCreditor.save).focus().type('{enter}');
    cy.get('@routerNavigate').should('have.been.calledOnceWith', route(PATHS.children.minorCreditorSummary));
    cy.get<MinorCreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()[0].creditor).to.eq(null);
      expect(store.creditorDraft()?.details).to.deep.equal(MINOR_CREDITOR_UK_MOCK);
    });
  });

  it('AC4, AC5. should activate dirty Cancel by keyboard and retain data when declined', { tags: buildTags() }, () => {
    setupCreditor({ initialChild: PATHS.children.minorCreditorDetails, state: MINOR_CREDITOR_SAVED_STATE_MOCK });
    cy.get(S.minorCreditor.organisationName).clear().type('Unsaved creditor');
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
    cy.once('window:confirm', (message) => {
      expect(message).to.eq(UNSAVED_CHANGES_WARNING);
      return false;
    });

    cy.get(S.minorCreditor.cancel).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);

    cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.minorCreditorDetails));
    cy.get(S.minorCreditor.organisationName).should('have.value', 'Unsaved creditor');
  });

  for (const [name, details] of [
    ['Individual and UK bank', { ...MINOR_CREDITOR_UK_MOCK, identity: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK.identity }],
    ['Organisation and non-UK bank', MINOR_CREDITOR_NON_UK_MOCK],
  ] as const) {
    it(`AC5. should pass Axe for ${name}`, { tags: buildTags() }, () => {
      setupMinorCreditor({ details });
      scan();
      cy.screenshot(`po-9809-minor-creditor-${name.toLowerCase().replaceAll(' ', '-')}`);
    });
  }

  it('AC5. should pass Axe in the empty and validation-error states', { tags: buildTags() }, () => {
    setupMinorCreditor();
    scan();
    cy.screenshot('po-9809-minor-creditor-empty');
    cy.get(S.minorCreditor.save).click();
    cy.get(S.errorSummary).should('be.focused');
    scan();
    cy.screenshot('po-9809-minor-creditor-errors');
  });

  it('AC5. should pass Axe on the routed Summary', { tags: buildTags() }, () => {
    setupCreditor({
      shell: true,
      initialChild: PATHS.children.minorCreditorSummary,
      state: MINOR_CREDITOR_PENDING_STATE_MOCK,
    });
    cy.get(S.heading).should('have.text', 'Minor creditor summary');
    scan();
    cy.screenshot('po-9809-minor-creditor-summary');
  });

  it(
    'AC5. should reflow Details and Summary at 320 CSS pixels without horizontal overflow',
    { tags: buildTags() },
    () => {
      cy.viewport(320, 900);
      setupMinorCreditor({ details: MINOR_CREDITOR_UK_MOCK });
      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.defaultView!.innerWidth);
      });
      cy.get(S.minorCreditor.save).should('be.visible');
      cy.get(S.minorCreditor.cancel).should('be.visible');
      cy.screenshot('po-9809-minor-creditor-details-320px');

      setupCreditor({
        shell: true,
        initialChild: PATHS.children.minorCreditorSummary,
        state: MINOR_CREDITOR_PENDING_STATE_MOCK,
      });
      cy.get(S.heading).should('be.visible').and('have.text', 'Minor creditor summary');
      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.defaultView!.innerWidth);
      });
      cy.screenshot('po-9809-minor-creditor-summary-320px');
    },
  );
});
