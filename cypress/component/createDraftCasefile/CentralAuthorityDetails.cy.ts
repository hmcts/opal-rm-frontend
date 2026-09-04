import type { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors } from 'cypress/shared/selectors/create-casefile.selectors';
import { UNSAVED_CHANGES_WARNING } from './constants/create-casefile-test-copy.constant';
import { CENTRAL_AUTHORITY_ERRORS } from './centralAuthority/constants/central-authority-errors.constant';
import {
  SAVED_DETAILS_WITH_MISSING_RECORD,
  SAVED_DETAILS_WITH_STALE_COPY,
  SECOND_MAJOR_CREDITOR,
} from './centralAuthority/mocks/major-creditors.mock';
import {
  setupCentralAuthorityDetails,
  type CasesCreateCasefileStoreInstance,
} from './centralAuthority/setup/central-authority.setup';

const STORY_TAG = '@JIRA-STORY:PO-9804';
const EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (...tags: string[]): string[] => [...tags, STORY_TAG, EPIC_TAG];
const Page = CreateCasefileSelectors.centralAuthority;
const taskListPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
const centralAuthorityPath =
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.children.centralAuthorityDetails;

describe('Create Casefile Central authority details', () => {
  it('AC1. should render optional fields and code-name choices in backend order', { tags: buildTags() }, () => {
    setupCentralAuthorityDetails();

    cy.wait('@getMajorCreditors').its('request.query').should('deep.equal', {
      business_unit_id: '77',
      central_authority: 'true',
      active: 'true',
    });
    cy.get(Page.heading).should('have.text', 'Central authority details');
    cy.get('.govuk-back-link').should('not.exist');
    cy.get(Page.remoReference).should('have.value', '');
    cy.get(Page.centralAuthorityReference).should('have.value', '');
    cy.get(Page.autocomplete).click();
    cy.get(Page.autocompleteOptions).then(($options) => {
      expect([...$options].map((option) => option.textContent?.trim())).to.deep.equal([
        '0123 - Central Authority One',
        '0456 - Central Authority Two',
      ]);
    });
  });

  it('AC2. should replay editable saved state using the current record', { tags: buildTags() }, () => {
    setupCentralAuthorityDetails({ savedDetails: SAVED_DETAILS_WITH_STALE_COPY });

    cy.get(Page.remoReference).should('have.value', 'REMO-1').clear().type('REMO-2');
    cy.get(Page.centralAuthorityReference).should('have.value', 'CA-1').clear().type('CA-2');
    cy.get(Page.autocomplete).should('have.value', '0123 - Central Authority One');
  });

  it('AC2. should clear a missing saved authority while retaining both references', { tags: buildTags() }, () => {
    setupCentralAuthorityDetails({ savedDetails: SAVED_DETAILS_WITH_MISSING_RECORD });

    cy.get(Page.remoReference).should('have.value', 'REMO-1');
    cy.get(Page.centralAuthorityReference).should('have.value', 'CA-1');
    cy.get(Page.autocomplete).should('have.value', '');
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.centralAuthorityDetails()?.majorCreditor).to.equal(null);
      expect(store.unsavedChanges()).to.equal(false);
    });
  });

  it('AC3. should save valid values locally and return to Case details', { tags: buildTags() }, () => {
    setupCentralAuthorityDetails();

    cy.get(Page.remoReference).type('REMO-1');
    cy.get(Page.centralAuthorityReference).type('CA-1');
    cy.get(Page.autocomplete).type('0456').type('{downArrow}{enter}');
    cy.get(Page.returnToCaseDetails).click();

    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.centralAuthorityDetails()).to.deep.equal({
        remoReference: 'REMO-1',
        centralAuthorityReference: 'CA-1',
        majorCreditor: SECOND_MAJOR_CREDITOR,
      });
      expect(store.taskStatuses().centralAuthority).to.equal('Provided');
    });
    cy.get(CreateCasefileSelectors.caseDetails.centralAuthorityStatus).should('contain.text', 'Provided');
  });

  it('AC3. should treat unmatched free text as no optional selection', { tags: buildTags() }, () => {
    setupCentralAuthorityDetails();

    cy.get(Page.autocomplete).type('Not a listed authority').blur();
    cy.get(Page.returnToCaseDetails).click();

    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.centralAuthorityDetails()?.majorCreditor).to.equal(null);
      expect(store.taskStatuses().centralAuthority).to.equal('Optional');
    });
  });

  for (const [input, value, error, message] of [
    [Page.remoReference, 'x'.repeat(21), Page.remoReferenceError, CENTRAL_AUTHORITY_ERRORS.remoReference],
    [
      Page.centralAuthorityReference,
      'x'.repeat(51),
      Page.centralAuthorityReferenceError,
      CENTRAL_AUTHORITY_ERRORS.centralAuthorityReference,
    ],
  ] as const) {
    it(`AC4. should show and focus the exact error for ${input}`, { tags: buildTags() }, () => {
      setupCentralAuthorityDetails();

      cy.get(input).type(value);
      cy.get(Page.returnToCaseDetails).click();

      cy.get(error).should('contain.text', message);
      cy.get(Page.errorSummary).should('be.focused').and('contain.text', 'There is a problem');
      cy.get(Page.errorSummaryLinks).contains(message).click();
      cy.get(input).should('be.focused').and('have.value', value);
    });
  }

  it('AC3. should replace and then remove a restored selection', { tags: buildTags() }, () => {
    setupCentralAuthorityDetails({ savedDetails: SAVED_DETAILS_WITH_STALE_COPY });

    cy.get(Page.autocomplete).clear().type('0456').type('{downArrow}{enter}');
    cy.get(Page.autocomplete).should('have.value', '0456 - Central Authority Two');
    cy.get(Page.autocomplete).clear().blur();
    cy.get(Page.returnToCaseDetails).click();

    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.centralAuthorityDetails()?.majorCreditor).to.equal(null);
    });
  });

  it('AC3. should navigate directly on clean Cancel', { tags: buildTags() }, () => {
    const confirm = cy.stub().as('cleanConfirm').returns(true);
    cy.on('window:confirm', confirm);
    setupCentralAuthorityDetails();

    cy.get(Page.cancelLink).click();

    cy.get('@cleanConfirm').should('not.have.been.called');
    cy.get('@angularRouter').should((router: Router) => expect(router.url).to.equal(taskListPath));
  });

  for (const navigationSelector of [Page.cancelLink]) {
    it(
      `AC3. should keep dirty edits when protected navigation from ${navigationSelector} is rejected`,
      { tags: buildTags() },
      () => {
        const confirm = cy.stub().as('dirtyConfirm').returns(false);
        cy.on('window:confirm', confirm);
        setupCentralAuthorityDetails({ savedDetails: SAVED_DETAILS_WITH_STALE_COPY });
        cy.get(Page.remoReference).clear().type('UNSAVED');

        cy.get(navigationSelector).click();

        cy.get('@dirtyConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
        cy.get(Page.remoReference).should('have.value', 'UNSAVED');
        cy.get('@angularRouter').should((router: Router) => expect(router.url).to.equal(centralAuthorityPath));
      },
    );
  }

  it(
    'AC3. should leave the page without saving when dirty Cancel navigation is accepted',
    { tags: buildTags() },
    () => {
      const confirm = cy.stub().as('acceptedDirtyConfirm').returns(true);
      cy.on('window:confirm', confirm);
      setupCentralAuthorityDetails({ savedDetails: SAVED_DETAILS_WITH_STALE_COPY });
      cy.get(Page.remoReference).clear().type('UNSAVED');

      cy.get(Page.cancelLink).click();

      cy.get('@acceptedDirtyConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      cy.get('@angularRouter').should((router: Router) => expect(router.url).to.equal(taskListPath));
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.centralAuthorityDetails()?.remoReference).to.equal('REMO-1');
      });
    },
  );

  it('AC4. should select an authority and reach each action using native keyboard order', { tags: buildTags() }, () => {
    setupCentralAuthorityDetails();

    cy.get(Page.remoReference).focus();
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.remoReference).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.centralAuthorityReference).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.autocomplete).should('be.focused').type('0456').type('{downArrow}{enter}');
    cy.get(Page.autocomplete).should('have.value', '0456 - Central Authority Two');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.returnToCaseDetails).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.cancelLink).should('be.focused');
  });

  for (const state of ['valid', 'error'] as const) {
    it(`AC4. should have no detected Axe violations in the ${state} state`, { tags: buildTags() }, () => {
      setupCentralAuthorityDetails({ savedDetails: state === 'valid' ? SAVED_DETAILS_WITH_STALE_COPY : null });
      if (state === 'error') {
        cy.get(Page.remoReference).type('x'.repeat(21));
        cy.get(Page.centralAuthorityReference).type('x'.repeat(51));
        cy.get(Page.returnToCaseDetails).click();
      }

      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
    });
  }

  for (const width of [1280, 320]) {
    it(`AC4. should reflow without horizontal page overflow at ${width}px`, { tags: buildTags() }, () => {
      cy.viewport(width, 900);
      setupCentralAuthorityDetails();

      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
      });
    });
  }
});
