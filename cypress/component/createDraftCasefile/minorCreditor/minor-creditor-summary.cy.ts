import { Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { setupCreditor, type CreditorStore } from '../creditor/setup/creditor.setup';
import {
  MINOR_CREDITOR_PENDING_STATE_MOCK,
  MINOR_CREDITOR_PENDING_INDIVIDUAL_UK_STATE_MOCK,
  MINOR_CREDITOR_PENDING_NON_UK_STATE_MOCK,
  MINOR_CREDITOR_PENDING_NONE_STATE_MOCK,
  MINOR_CREDITOR_PENDING_REPLACEMENT_STATE_MOCK,
  MINOR_CREDITOR_UK_MOCK,
} from './mocks/minor-creditor.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9810', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;

describe('Minor creditor summary journey', () => {
  it(
    'AC2. preserves the pending creditor through Remove and cancellation without fetching countries',
    { tags: buildTags() },
    () => {
      setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
      cy.get(S.minorCreditorSummary.remove).click();
      cy.get(S.heading)
        .invoke('text')
        .then((text) => expect(text.trim()).to.eq('Are you sure you want to remove this minor creditor?'));
      cy.get(S.minorCreditorRemoval.cancel).click();
      cy.get(S.heading).should('have.text', 'Minor creditor summary');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.creditorDraft()).to.deep.equal(MINOR_CREDITOR_PENDING_STATE_MOCK.creditorDraft);
        expect(store.currentOrderTermId()).to.eq(1);
        expect(store.orderTerms()).to.deep.equal(MINOR_CREDITOR_PENDING_STATE_MOCK.orderTerms);
        expect(store.minorCreditors()).to.deep.equal([]);
        expect(store.nextMinorCreditorSequence()).to.eq(1);
      });
      cy.get('@countriesRequest').should('not.have.been.called');
    },
  );

  it('AC1. displays the reviewed UK details with the country name and leading zeroes', { tags: buildTags() }, () => {
    setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
    cy.get(S.minorCreditorSummary.rowValue('Name')).should('have.text', 'Example creditor');
    cy.get(S.minorCreditorSummary.rowValue('Address'))
      .should('contain.text', '1 Test Street')
      .and('contain.text', 'United Kingdom')
      .and('not.contain.text', '826');
    cy.get(S.minorCreditorSummary.rowValue('BankType')).should('have.text', 'UK');
    cy.get(S.minorCreditorSummary.rowValue('SortCode')).should('have.text', '001122');
    cy.get(S.minorCreditorSummary.rowValue('AccountNumber')).should('have.text', '00112233');
    cy.get(S.minorCreditorSummary.rowValue('PaymentReference')).should('have.text', 'Example reference');
  });

  it('AC2, AC3. changes the pending name and accepts it only on Continue', { tags: buildTags() }, () => {
    setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
    cy.get(S.minorCreditorSummary.change).click();
    cy.get(S.minorCreditor.organisationName)
      .should('have.value', 'Example creditor')
      .clear()
      .type('Changed example creditor');
    cy.get(S.minorCreditor.ukAccountNumber).should('have.value', '00112233');
    cy.get(S.minorCreditor.save).click();
    cy.get(S.heading).should('have.text', 'Minor creditor summary');
    cy.get(S.minorCreditorSummary.rowValue('Name')).should('have.text', 'Changed example creditor');
    const details = {
      ...MINOR_CREDITOR_UK_MOCK,
      identity: { type: 'organisation', organisationName: 'Changed example creditor' },
    };
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()[0].creditor).to.eq(null);
      expect(store.minorCreditors()).to.deep.equal([]);
      expect(store.nextMinorCreditorSequence()).to.eq(1);
      expect(store.creditorDraft()?.details).to.deep.equal(details);
    });
    cy.get(S.minorCreditorSummary.continue).click();
    cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermsSummary));
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.creditorDraft()).to.eq(null);
      expect(store.minorCreditors()).to.deep.equal([
        { sequenceNumber: 1, displayName: 'Changed example creditor', details },
      ]);
      expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 1 });
      expect(store.nextMinorCreditorSequence()).to.eq(2);
    });
  });

  const priorAssignments: [string, Partial<ICasesCreateCasefileState>][] = [
    [
      'applicant',
      {
        ...MINOR_CREDITOR_PENDING_STATE_MOCK,
        orderTerms: [{ ...MINOR_CREDITOR_PENDING_STATE_MOCK.orderTerms![0], creditor: { type: 'applicant' } }],
      },
    ],
    ['minor creditor', MINOR_CREDITOR_PENDING_REPLACEMENT_STATE_MOCK],
  ];
  for (const [assignment, state] of priorAssignments) {
    it(
      `AC3. Cancel preserves the prior ${assignment} assignment and wider casefile state`,
      { tags: buildTags() },
      () => {
        setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state });
        cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
          const before = structuredClone(getState(store));
          cy.get(S.minorCreditorSummary.cancel).click();
          cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermCreditor));
          cy.then(() => expect(getState(store)).to.deep.equal({ ...before, creditorDraft: null }));
        });
      },
    );
  }

  const invalidDrafts: { name: string; state: Partial<ICasesCreateCasefileState> }[] = [
    { name: 'missing draft', state: { creditorDraft: null } },
    {
      name: 'mismatched draft',
      state: { creditorDraft: { ...MINOR_CREDITOR_PENDING_STATE_MOCK.creditorDraft!, termId: 2 } },
    },
    { name: 'unpopulated draft', state: { creditorDraft: { termId: 1, branch: 'add-new' } } },
  ];
  for (const child of [PATHS.children.minorCreditorSummary, PATHS.children.minorCreditorRemove]) {
    for (const { name, state } of invalidDrafts) {
      it(`AC2. recovers from ${child} with a ${name}`, { tags: buildTags() }, () => {
        setupCreditor({ initialChild: child, state: { ...MINOR_CREDITOR_PENDING_STATE_MOCK, ...state } });
        cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermCreditor));
        cy.get(S.heading).should('have.text', 'Creditor');
        cy.get(S.minorCreditorSummary.continue).should('not.exist');
        cy.get('@countriesRequest').should('not.have.been.called');
      });
    }
    for (const termId of [null, 99]) {
      it(`AC2. recovers from ${child} with unavailable current term ${termId}`, { tags: buildTags() }, () => {
        setupCreditor({
          initialChild: child,
          state: { ...MINOR_CREDITOR_PENDING_STATE_MOCK, currentOrderTermId: termId },
        });
        cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermsSelect));
        cy.get(S.orderTerms.select).should('be.visible');
        cy.get(S.minorCreditorSummary.continue).should('not.exist');
        cy.get('@countriesRequest').should('not.have.been.called');
      });
    }
  }
});

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

describe('Minor creditor review accessibility', () => {
  it('AC4. presents semantic rows, meaningful actions and the expected keyboard order', { tags: buildTags() }, () => {
    setupCreditor({
      shell: true,
      initialChild: PATHS.children.minorCreditorSummary,
      state: MINOR_CREDITOR_PENDING_STATE_MOCK,
    });
    cy.get(S.heading).should('have.length', 1).and('have.text', 'Minor creditor summary');
    cy.title().should('eq', 'OPAL - Minor creditor summary');
    cy.get(S.primaryNavigation).should('not.exist');
    for (const selector of [S.minorCreditorSummary.change, S.minorCreditorSummary.remove]) {
      cy.get(selector).should('have.prop', 'tagName', 'A').and('contain.text', 'minor creditor details');
    }
    cy.get(S.minorCreditorSummary.rows)
      .should('have.length', 7)
      .each(($row) => {
        cy.wrap($row).children('dt').should('have.length', 1);
        cy.wrap($row).children('dd').should('have.length', 1);
      });
    cy.get(S.minorCreditorSummary.change).focus();
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.minorCreditorSummary.remove).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.minorCreditorSummary.continue).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.minorCreditorSummary.cancel).should('be.focused');
  });

  for (const [name, selector, initialChild, destination] of [
    ['Change', S.minorCreditorSummary.change, PATHS.children.minorCreditorSummary, PATHS.children.minorCreditorDetails],
    ['Remove', S.minorCreditorSummary.remove, PATHS.children.minorCreditorSummary, PATHS.children.minorCreditorRemove],
    ['Back', S.minorCreditorRemoval.cancel, PATHS.children.minorCreditorRemove, PATHS.children.minorCreditorSummary],
    ['Cancel', S.minorCreditorSummary.cancel, PATHS.children.minorCreditorSummary, PATHS.children.orderTermCreditor],
  ] as const) {
    it(`AC4. activates ${name} with native Enter and preserves the expected state`, { tags: buildTags() }, () => {
      setupCreditor({ initialChild, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
      cy.get(selector).focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.get<Router>('@angularRouter').its('url').should('eq', route(destination));
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.creditorDraft()).to.deep.equal(
          name === 'Cancel' ? null : MINOR_CREDITOR_PENDING_STATE_MOCK.creditorDraft,
        );
        expect(store.currentOrderTermId()).to.eq(1);
        expect(store.orderTerms()).to.deep.equal(MINOR_CREDITOR_PENDING_STATE_MOCK.orderTerms);
        expect(store.minorCreditors()).to.deep.equal([]);
      });
      if (name === 'Change') cy.get(S.minorCreditor.organisationName).should('have.value', 'Example creditor');
    });
  }

  it('AC3, AC4. activates Continue with Enter and accepts the reviewed details', { tags: buildTags() }, () => {
    setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
    // Element-bound Enter reliably exercises the native button activation in the component runner.
    cy.get(S.minorCreditorSummary.continue).focus().type('{enter}');
    cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermsSummary));
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.creditorDraft()).to.eq(null);
      expect(store.minorCreditors()[0].details).to.deep.equal(MINOR_CREDITOR_UK_MOCK);
      expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 1 });
    });
  });

  for (const [name, state] of [
    ['individual-uk', MINOR_CREDITOR_PENDING_INDIVIDUAL_UK_STATE_MOCK],
    ['organisation-non-uk-fallback', MINOR_CREDITOR_PENDING_NON_UK_STATE_MOCK],
    ['none', MINOR_CREDITOR_PENDING_NONE_STATE_MOCK],
  ] as const) {
    it(`AC1, AC4. passes Axe on Summary with ${name}`, { tags: buildTags() }, () => {
      setupCreditor({ shell: true, initialChild: PATHS.children.minorCreditorSummary, state });
      cy.get(S.heading).should('have.text', 'Minor creditor summary');
      cy.get(S.minorCreditorSummary.rowValue('BankType')).should(
        'have.text',
        name === 'none' ? 'None' : name === 'individual-uk' ? 'UK' : 'Non-UK',
      );
      if (name === 'organisation-non-uk-fallback') {
        cy.get(S.minorCreditorSummary.rowValue('BicSwiftCode')).should('have.text', '-');
        cy.get(S.minorCreditorSummary.rowValue('Iban')).should('have.text', '-');
        cy.get(S.minorCreditorSummary.rowValue('BankName')).should('have.text', '-');
        cy.get(S.minorCreditorSummary.rowValue('Address')).should('contain.text', 'France');
      }
      if (name === 'none') cy.get(S.minorCreditorSummary.rows).should('have.length', 3);
      if (name === 'individual-uk')
        cy.get(S.minorCreditorSummary.rowValue('Name')).should('have.text', 'Dr Example Person');
      scan();
      cy.screenshot(`po-9810-summary-${name}`);
    });
  }

  it('AC4. passes Axe on removal with the correct title and hidden primary navigation', { tags: buildTags() }, () => {
    setupCreditor({
      shell: true,
      initialChild: PATHS.children.minorCreditorRemove,
      state: MINOR_CREDITOR_PENDING_STATE_MOCK,
    });
    cy.get(S.heading)
      .should('have.length', 1)
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq('Are you sure you want to remove this minor creditor?'));
    cy.title().should('eq', 'OPAL - Are you sure you want to remove this minor creditor?');
    cy.get(S.primaryNavigation).should('not.exist');
    scan();
    cy.screenshot('po-9810-removal');
  });

  it('AC4. reflows Summary and removal at 320 CSS pixels without horizontal overflow', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupCreditor({
      shell: true,
      initialChild: PATHS.children.minorCreditorSummary,
      state: MINOR_CREDITOR_PENDING_NON_UK_STATE_MOCK,
    });
    cy.get(S.heading).should('have.text', 'Minor creditor summary');
    cy.document().then((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.defaultView!.innerWidth),
    );
    cy.get(S.minorCreditorSummary.continue).should('be.visible');
    cy.get(S.minorCreditorSummary.cancel).should('be.visible');
    cy.screenshot('po-9810-summary-320px');
    cy.get(S.minorCreditorSummary.remove).click();
    cy.get(S.heading)
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq('Are you sure you want to remove this minor creditor?'));
    cy.document().then((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.defaultView!.innerWidth),
    );
    cy.get(S.minorCreditorRemoval.cancel).should('be.visible');
    cy.screenshot('po-9810-removal-320px');
  });
});
