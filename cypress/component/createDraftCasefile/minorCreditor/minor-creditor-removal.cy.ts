import { Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { UNSAVED_CHANGES_WARNING } from '../constants/create-casefile-test-copy.constant';
import { setupCreditor, type CreditorStore } from '../creditor/setup/creditor.setup';
import {
  MINOR_CREDITOR_PENDING_STATE_MOCK,
  MINOR_CREDITOR_PENDING_NONE_STATE_MOCK,
  MINOR_CREDITOR_PENDING_NON_UK_STATE_MOCK,
  MINOR_CREDITOR_ASSIGNED_REMOVAL_STATE_MOCK,
  MINOR_CREDITOR_SHARED_REMOVAL_STATE_MOCK,
  MINOR_CREDITOR_PENDING_REPLACEMENT_STATE_MOCK,
  MINOR_CREDITOR_STAGED_REMOVAL_STATE_MOCK,
} from './mocks/minor-creditor.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9813', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const R = S.minorCreditorRemoval;
const route = (child: string): string => '/' + PATHS.root + '/' + child;

describe('Minor creditor removal', () => {
  it(
    'AC2. should remove the pending creditor and consume success on real Creditor arrival',
    { tags: buildTags() },
    () => {
      setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
      cy.get(S.minorCreditorSummary.remove).click();
      cy.get(R.heading)
        .invoke('text')
        .then((text) => expect(text.trim()).to.eq('Are you sure you want to remove this minor creditor?'));
      cy.get(R.confirm).click();
      cy.get(R.success).should('contain.text', 'Minor creditor removed.');
      cy.get(R.dismiss).should('have.text', 'Dismiss');
      cy.get(S.creditor.addNew).should('not.be.checked');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.creditorDraft()).to.eq(null);
        expect(store.minorCreditors()).to.deep.equal([]);
        expect(store.orderTerms()).to.deep.equal(MINOR_CREDITOR_PENDING_STATE_MOCK.orderTerms);
        expect(store.minorCreditorRemovalOutcome()).to.eq(null);
      });
      cy.get(R.dismiss).click();
      cy.get(R.success).should('not.exist');
      cy.get(R.creditorHeading).should('be.focused');
      cy.get<Router>('@angularRouter').then(async (router) => {
        await router.navigateByUrl(route(PATHS.children.orderTermsSummary));
        await router.navigateByUrl(route(PATHS.children.orderTermCreditor));
      });
      cy.get(R.success).should('not.exist');
    },
  );

  it(
    'AC2. should redirect a later removal URL without resurrecting the removed target or alert',
    { tags: buildTags() },
    () => {
      setupCreditor({ initialChild: PATHS.children.minorCreditorRemove, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
      cy.get(R.confirm).click();
      cy.get(R.success).should('be.visible');
      cy.get<Router>('@angularRouter').then((router) =>
        router.navigateByUrl(route(PATHS.children.minorCreditorRemove)),
      );
      cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermCreditor));
      cy.get(R.confirm).should('not.exist');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.minorCreditorRemoval()).to.eq(null);
        expect(store.minorCreditorRemovalOutcome()).to.eq(null);
        expect(store.creditorDraft()).to.eq(null);
      });
    },
  );

  it(
    'AC3. should cancel with the entire business state unchanged without focusing Remove',
    { tags: buildTags() },
    () => {
      setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        const before = structuredClone(getState(store));
        cy.get(S.minorCreditorSummary.remove).click();
        cy.get(R.cancel).click();
        cy.get(S.minorCreditorSummary.remove).should('be.visible').and('not.be.focused');
        cy.then(() => expect(getState(store)).to.deep.equal(before));
      });
    },
  );

  for (const [name, state, bankType] of [
    ['organisation UK', MINOR_CREDITOR_PENDING_STATE_MOCK, 'UK'],
    ['individual no bank', MINOR_CREDITOR_PENDING_NONE_STATE_MOCK, 'None'],
    ['organisation non-UK', MINOR_CREDITOR_PENDING_NON_UK_STATE_MOCK, 'Non-UK'],
  ] as const) {
    it(`AC1. should display read-only ${name} details`, { tags: buildTags() }, () => {
      setupCreditor({ initialChild: PATHS.children.minorCreditorRemove, state });
      cy.get(R.rowValue('BankType')).should('have.text', bankType);
      cy.get(R.rowValue('Address')).should('contain.text', state.creditorDraft!.countryName);
      cy.get(S.minorCreditorSummary.change).should('not.exist');
      cy.get(S.minorCreditorSummary.remove).should('not.exist');
      cy.get(R.confirm)
        .invoke('text')
        .then((text) => expect(text.trim()).to.eq('Yes - remove minor creditor'));
      cy.get(R.cancel).should('have.text', 'No - cancel');
    });
  }

  for (const [name, state, remainingRecords] of [
    ['assigned', MINOR_CREDITOR_ASSIGNED_REMOVAL_STATE_MOCK, 0],
    ['shared', MINOR_CREDITOR_SHARED_REMOVAL_STATE_MOCK, 1],
  ] as const) {
    it(`AC2. should detach only the selected ${name} creditor association`, { tags: buildTags() }, () => {
      setupCreditor({ initialChild: PATHS.children.minorCreditorRemove, state });
      cy.get(R.confirm).click();
      cy.get(R.success).should('be.visible');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()[0]).to.deep.equal({ ...state.orderTerms![0], creditor: null });
        expect(store.orderTerms().slice(1)).to.deep.equal(state.orderTerms!.slice(1));
        expect(store.minorCreditors()).to.have.length(remainingRecords);
        expect(store.nextMinorCreditorSequence()).to.eq(state.nextMinorCreditorSequence);
      });
      cy.get('input[type="radio"]:checked').should('not.exist');
      if (name === 'shared') cy.get(S.creditor.minor(1)).should('be.enabled').and('not.be.checked');
    });
  }

  it('AC2. should preserve the accepted choice when removing a pending replacement', { tags: buildTags() }, () => {
    setupCreditor({
      initialChild: PATHS.children.minorCreditorRemove,
      state: MINOR_CREDITOR_PENDING_REPLACEMENT_STATE_MOCK,
    });
    cy.get(R.confirm).click();
    cy.get(R.success).should('be.visible');
    cy.get(S.creditor.minor(1)).should('be.checked');
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.deep.equal(MINOR_CREDITOR_PENDING_REPLACEMENT_STATE_MOCK.orderTerms);
      expect(store.commentsAndNotes()).to.deep.equal(MINOR_CREDITOR_PENDING_REPLACEMENT_STATE_MOCK.commentsAndNotes);
    });
  });

  it(
    'AC2. should remove staged data while preserving accepted state and staged non-creditor values',
    { tags: buildTags() },
    () => {
      setupCreditor({
        initialChild: PATHS.children.minorCreditorRemove,
        state: MINOR_CREDITOR_STAGED_REMOVAL_STATE_MOCK,
      });
      cy.get(R.confirm).click();
      cy.get(R.success).should('be.visible');
      cy.get('input[type="radio"]:checked').should('not.exist');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()).to.deep.equal(MINOR_CREDITOR_STAGED_REMOVAL_STATE_MOCK.orderTerms);
        expect(store.minorCreditors()).to.deep.equal(MINOR_CREDITOR_STAGED_REMOVAL_STATE_MOCK.minorCreditors);
        expect(store.orderTermAmendment()?.term.parameters).to.deep.equal({ amount: '45.00' });
        expect(store.orderTermAmendment()?.term.creditor).to.eq(null);
        expect(store.orderTermAmendment()?.ready).to.eq(false);
      });
    },
  );

  it('AC4. should move focus through confirmation and cancellation with the keyboard', { tags: buildTags() }, () => {
    setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
    cy.get(S.minorCreditorSummary.remove).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(R.heading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(R.confirm).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(R.cancel).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.minorCreditorSummary));
    cy.get(S.minorCreditorSummary.remove).should('be.visible').and('not.be.focused');
    cy.get(R.heading).should('not.exist');
  });

  for (const key of ['{enter}', ' '] as const) {
    it(`AC4. should confirm with Enter and dismiss success with ${key}`, { tags: buildTags() }, () => {
      setupCreditor({
        shell: true,
        initialChild: PATHS.children.minorCreditorRemove,
        state: MINOR_CREDITOR_PENDING_STATE_MOCK,
      });
      cy.get(R.confirm).focus().type('{enter}');
      cy.get(R.creditorHeading).should('be.focused');
      cy.get(`${R.success} [role="status"]`).should('have.length', 1).and('contain.text', 'Minor creditor removed.');
      cy.get(R.dismiss).focus();
      if (key === '{enter}') cy.get(R.dismiss).type('{enter}');
      else cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(R.success).should('not.exist');
      cy.get(R.creditorHeading).should('be.focused');
    });
  }

  it('AC4. should pass Axe on removal and success and reflow at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupCreditor({
      shell: true,
      initialChild: PATHS.children.minorCreditorRemove,
      state: MINOR_CREDITOR_PENDING_STATE_MOCK,
    });
    cy.get(R.heading).should('be.visible');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y(undefined, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    cy.document().then((document) => expect(document.documentElement.scrollWidth).to.be.at.most(320));
    cy.screenshot('po-9813-removal-320px');
    cy.get(R.confirm).click();
    cy.get(R.success).should('be.visible');
    cy.checkA11y(undefined, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    cy.document().then((document) => expect(document.documentElement.scrollWidth).to.be.at.most(320));
    cy.screenshot('po-9813-success-320px');
  });

  for (const failure of ['false', 'reject'] as const) {
    for (const action of ['confirm', 'cancel'] as const) {
      it(
        `AC2, AC3. should retry ${action} navigation after ${failure} without changing its result`,
        { tags: buildTags() },
        () => {
          setupCreditor({
            shell: true,
            initialChild: PATHS.children.minorCreditorRemove,
            state: MINOR_CREDITOR_PENDING_STATE_MOCK,
            failNextNavigation: failure,
          });
          cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
            cy.spy(store, 'confirmMinorCreditorRemoval').as('confirmRemoval');
          });
          cy.get(R[action]).click();
          cy.get(S.errorSummary).should('contain.text', 'There is a problem');
          cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
            expect(store.creditorDraft()).to.deep.equal(
              action === 'confirm' ? null : MINOR_CREDITOR_PENDING_STATE_MOCK.creditorDraft,
            );
          });
          cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
          cy.checkA11y(undefined, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
          cy.get(R.retry).click();
          cy.get<Router>('@angularRouter')
            .its('url')
            .should(
              'eq',
              route(action === 'confirm' ? PATHS.children.orderTermCreditor : PATHS.children.minorCreditorSummary),
            );
          cy.get('@confirmRemoval').should('have.callCount', action === 'confirm' ? 1 : 0);
          if (action === 'confirm') cy.get(R.success).should('be.visible');
          else cy.get(S.minorCreditorSummary.remove).should('be.visible').and('not.be.focused');
        },
      );
    }
  }

  it('AC2. should hide stale actions without clearing a newer selection', { tags: buildTags() }, () => {
    setupCreditor({ initialChild: PATHS.children.minorCreditorRemove, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
    cy.get(R.confirm).should('be.visible');
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      store.savePendingMinorCreditorDetails(
        1,
        structuredClone(MINOR_CREDITOR_PENDING_STATE_MOCK.creditorDraft!.details!),
        'United Kingdom',
      );
      const newer = store.beginMinorCreditorRemoval();
      cy.get(R.confirm).should('not.exist');
      cy.get(R.rowValue('Name')).should('not.exist');
      cy.get(R.recover).should('be.visible');
      cy.then(() => expect(store.minorCreditorRemoval()).to.eq(newer));
    });
  });

  for (const leave of [false, true]) {
    it(
      `AC3. should ${leave ? 'discard' : 'preserve'} the journey after external departure is ${leave ? 'confirmed' : 'declined'}`,
      { tags: buildTags() },
      () => {
        setupCreditor({ initialChild: PATHS.children.minorCreditorRemove, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
        cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
          const before = structuredClone(getState(store));
          cy.once('window:confirm', (message) => {
            expect(message).to.eq(UNSAVED_CHANGES_WARNING);
            return leave;
          });
          cy.get<Router>('@angularRouter').then((router) => router.navigateByUrl('/creditor-test-external'));
          cy.then(() => {
            if (leave) {
              expect(store.orderTerms()).to.deep.equal([]);
              expect(store.creditorDraft()).to.eq(null);
              expect(store.minorCreditorRemoval()).to.eq(null);
            } else expect(getState(store)).to.deep.equal(before);
          });
        });
      },
    );
  }
});
