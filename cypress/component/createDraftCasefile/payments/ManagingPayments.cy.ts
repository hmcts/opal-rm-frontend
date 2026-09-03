import type { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-managing-payments/constants/cases-create-casefile-managing-payments-field-names.constant';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-payment-arrangements.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { CasesCreateCasefilePaymentArrangement } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-payment-arrangement.type';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { ERROR_SUMMARY_TITLE, UNSAVED_CHANGES_WARNING } from '../constants/create-casefile-test-copy.constant';
import { MANAGING_PAYMENTS_ERROR_MESSAGES } from './constants/managing-payments-errors.constant';
import { SAVED_PAYMENT_ARRANGEMENT } from './mocks/managing-payments.mock';
import {
  externalDestinationPath,
  setupManagingPayments,
  type CasesCreateCasefileStoreInstance,
} from './setup/managing-payments.setup';

const STORY_TAG = '@JIRA-STORY:PO-9815';
const EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (...tags: string[]): string[] => [...tags, STORY_TAG, EPIC_TAG];
const managingPaymentsPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.managingPayments;
const taskListPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
const interestAndIndexationPath =
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.children.interestAndIndexation;
const DRAFT_CASEFILE_WRITE_URL = /\/draft-casefiles(?:[/?#]|$)/;

const normalizeText = (text: string | null | undefined): string => text?.replace(/\s+/g, ' ').trim() ?? '';

const assertNormalizedText = (selector: string, expectedText: string): void => {
  cy.get(selector).then(($element) => {
    expect(normalizeText($element.text())).to.equal(expectedText);
  });
};

const assertRouterPath = (expectedPath: string): void => {
  cy.get('@angularRouter').should((router: Router) => {
    expect(router.url).to.equal(expectedPath);
  });
};

const assertInlineError = (selector: string, expectedMessage: string): void => {
  cy.get(selector).then(($error) => {
    const error = $error[0].cloneNode(true) as HTMLElement;
    error.querySelector('.govuk-visually-hidden')?.remove();
    expect(normalizeText(error.textContent)).to.equal(expectedMessage);
  });
};

const choose = (paymentArrangement: CasesCreateCasefilePaymentArrangement): void => {
  cy.get(Page.managingPayments.paymentArrangementRadio(paymentArrangement)).check();
};

describe('Create Casefile Managing payments', () => {
  it('AC1, AC2. should use the canonical group name and exact error target', { tags: buildTags() }, () => {
    setupManagingPayments();

    cy.get(Page.managingPayments.paymentArrangementRadios).then(($radios) => {
      const radios = [...$radios] as HTMLInputElement[];
      expect(radios.map((radio) => radio.name)).to.deep.equal([
        CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement,
        CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement,
      ]);
      expect(radios.map((radio) => radio.id)).to.deep.equal([
        `${CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement}-court`,
        `${CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement}-direct`,
      ]);
    });
    cy.get(Page.managingPayments.returnToCaseDetails).click();
    cy.get(Page.managingPayments.errorSummaryLinks)
      .contains(MANAGING_PAYMENTS_ERROR_MESSAGES.paymentArrangement)
      .click();
    cy.focused().should('have.id', `${CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement}-court`);
  });

  it('AC1. should render the exact empty accessible screen and no excluded controls', { tags: buildTags() }, () => {
    setupManagingPayments();

    cy.get(Page.managingPayments.heading).should('have.text', 'Managing payments');
    cy.get(Page.managingPayments.paymentArrangementGroup).should('match', 'fieldset');
    assertNormalizedText(Page.managingPayments.paymentArrangementLegend, 'Select payment arrangement');
    cy.get(Page.managingPayments.paymentArrangementRadios)
      .should('have.length', 2)
      .then(($radios) => {
        expect([...$radios].map((radio) => (radio as HTMLInputElement).value)).to.deep.equal(['court', 'direct']);
      });
    cy.get(Page.managingPayments.paymentArrangementLabels).then(($labels) => {
      expect([...$labels].map((label) => normalizeText(label.textContent))).to.deep.equal([
        'Payments via the court',
        'Direct payments to creditors',
      ]);
    });
    assertNormalizedText(Page.managingPayments.directHint, 'HMCTS will not collect payments for this case');
    cy.get(Page.managingPayments.paymentArrangementRadio(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT)).should(
      'have.attr',
      'aria-describedby',
      CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement + '-direct-item-hint',
    );
    cy.get(`${Page.managingPayments.paymentArrangementRadios}:checked`).should('not.exist');
    assertNormalizedText(Page.managingPayments.returnToCaseDetails, 'Return to case details');
    assertNormalizedText(Page.managingPayments.cancelLink, 'Cancel');
    cy.get('.govuk-back-link').should('not.exist');
    cy.get('input[type="text"], input[name*="amount"], input[name*="rate"]').should('not.exist');
  });

  for (const saved of [
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT,
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
  ] as const) {
    it(`AC1. should restore saved payment arrangement ${saved}`, { tags: buildTags() }, () => {
      setupManagingPayments({ savedPaymentArrangement: saved });

      cy.get(Page.managingPayments.paymentArrangementRadio(saved)).should('be.checked');
    });
  }

  it('AC2, EMAC1. should show the exact error, focus the summary and retain the route', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('invalidDraftCasefilePost');
    cy.intercept({ method: 'POST', url: DRAFT_CASEFILE_WRITE_URL }, postRequestSpy);
    setupManagingPayments();

    cy.get(Page.managingPayments.returnToCaseDetails).click();

    assertInlineError(
      Page.managingPayments.paymentArrangementError,
      MANAGING_PAYMENTS_ERROR_MESSAGES.paymentArrangement,
    );
    cy.get(Page.managingPayments.errorSummary)
      .should('be.focused')
      .and('contain.text', ERROR_SUMMARY_TITLE)
      .and('contain.text', MANAGING_PAYMENTS_ERROR_MESSAGES.paymentArrangement);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.paymentArrangement()).to.equal(null);
      expect(store.taskStatuses().managingPayments).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
    });
    cy.get('@invalidDraftCasefilePost').should('not.have.been.called');
    assertRouterPath(managingPaymentsPath);
  });

  it('AC2, EMAC1a. should link the summary error to the first radio', { tags: buildTags() }, () => {
    setupManagingPayments();
    cy.get(Page.managingPayments.returnToCaseDetails).click();

    cy.get(Page.managingPayments.errorSummaryLinks)
      .contains(MANAGING_PAYMENTS_ERROR_MESSAGES.paymentArrangement)
      .click();

    cy.get(Page.managingPayments.paymentArrangementRadio(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT)).should(
      'be.focused',
    );
  });

  for (const saved of [
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT,
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
  ] as const) {
    it(`AC3. should save ${saved} locally and return to Case details`, { tags: buildTags() }, () => {
      const postRequestSpy = cy.spy().as('draftCasefilePost');
      cy.intercept({ method: 'POST', url: DRAFT_CASEFILE_WRITE_URL }, postRequestSpy);
      setupManagingPayments();
      choose(saved);

      cy.get(Page.managingPayments.returnToCaseDetails).click();

      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.paymentArrangement()).to.equal(saved);
        expect(store.taskStatuses().managingPayments).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
        expect(store.unsavedChanges()).to.equal(false);
        expect(store.stateChanges()).to.equal(true);
      });
      assertRouterPath(taskListPath);
      cy.get(Page.caseDetails.managingPaymentsStatus).should('contain.text', 'Provided');
      cy.get('@draftCasefilePost').should('not.have.been.called');
    });
  }

  it('AC3, RGAC1. should Cancel directly when no edits have been made', { tags: buildTags() }, () => {
    const cleanCancelConfirm = cy.stub().as('cleanCancelConfirm').returns(true);
    cy.on('window:confirm', cleanCancelConfirm);
    setupManagingPayments();

    cy.get(Page.managingPayments.cancelLink).click();

    cy.get('@cleanCancelConfirm').should('not.have.been.called');
    assertRouterPath(taskListPath);
  });

  it(
    'AC3, RGAC2. should stay on dirty Cancel and preserve edited controls plus saved state',
    { tags: buildTags() },
    () => {
      const rejectCancelConfirm = cy.stub().as('rejectCancelConfirm').returns(false);
      cy.on('window:confirm', rejectCancelConfirm);
      setupManagingPayments({ savedPaymentArrangement: SAVED_PAYMENT_ARRANGEMENT });
      choose(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT);

      cy.get(Page.managingPayments.cancelLink).click();

      cy.get('@rejectCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      assertRouterPath(managingPaymentsPath);
      cy.get(Page.managingPayments.paymentArrangementRadio(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT)).should(
        'be.checked',
      );
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.paymentArrangement()).to.equal(SAVED_PAYMENT_ARRANGEMENT);
        expect(store.unsavedChanges()).to.equal(true);
      });
    },
  );

  it('AC3, RGAC3. should leave on dirty Cancel and preserve only the last saved state', { tags: buildTags() }, () => {
    const acceptCancelConfirm = cy.stub().as('acceptCancelConfirm').returns(true);
    cy.on('window:confirm', acceptCancelConfirm);
    setupManagingPayments({ savedPaymentArrangement: SAVED_PAYMENT_ARRANGEMENT });
    choose(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT);

    cy.get(Page.managingPayments.cancelLink).click();

    cy.get('@acceptCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.paymentArrangement()).to.equal(SAVED_PAYMENT_ARRANGEMENT);
      expect(store.taskStatuses().managingPayments).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).to.equal(false);
    });
  });

  it(
    'AC3, RGAC2. should protect another route and retain the edited selection when staying',
    { tags: buildTags() },
    () => {
      const rejectNavigationConfirm = cy.stub().as('rejectNavigationConfirm').returns(false);
      cy.on('window:confirm', rejectNavigationConfirm);
      setupManagingPayments({ savedPaymentArrangement: SAVED_PAYMENT_ARRANGEMENT });
      choose(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT);

      cy.get('@angularRouter').then((router: Router) => router.navigateByUrl(interestAndIndexationPath));

      cy.get('@rejectNavigationConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      assertRouterPath(managingPaymentsPath);
      cy.get(Page.managingPayments.paymentArrangementRadio(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT)).should(
        'be.checked',
      );
    },
  );

  it('AC3, RGAC3. should warn once and complete external navigation after accepting', { tags: buildTags() }, () => {
    const acceptExternalNavigationConfirm = cy.stub().as('acceptExternalNavigationConfirm').returns(true);
    cy.on('window:confirm', acceptExternalNavigationConfirm);
    setupManagingPayments({ savedPaymentArrangement: SAVED_PAYMENT_ARRANGEMENT });
    choose(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT);

    cy.get('@angularRouter').then((router: Router) => router.navigateByUrl(externalDestinationPath));

    cy.get('@acceptExternalNavigationConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(externalDestinationPath);
  });

  it('AC4. should preserve native radio keyboard behavior and logical action order', { tags: buildTags() }, () => {
    setupManagingPayments();

    cy.get(Page.managingPayments.paymentArrangementRadio(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT)).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.press(Cypress.Keyboard.Keys.DOWN);
    cy.get(Page.managingPayments.paymentArrangementRadio(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT))
      .should('be.checked')
      .and('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.managingPayments.returnToCaseDetails).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.managingPayments.cancelLink).should('be.focused');
  });

  it('AC4. should have no detected Axe violations in a representative valid state', { tags: buildTags() }, () => {
    setupManagingPayments({ savedPaymentArrangement: SAVED_PAYMENT_ARRANGEMENT });

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC4. should have no detected Axe violations in the validation-error state', { tags: buildTags() }, () => {
    setupManagingPayments();
    cy.get(Page.managingPayments.returnToCaseDetails).click();

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  for (const width of [1280, 320]) {
    it(`AC4. should reflow without horizontal page overflow at ${width}px`, { tags: buildTags() }, () => {
      cy.viewport(width, 900);
      setupManagingPayments();
      if (width === 320) {
        cy.get(Page.managingPayments.returnToCaseDetails).click();
        cy.get(Page.managingPayments.errorSummary).should('contain.text', ERROR_SUMMARY_TITLE);
      }

      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
      });
    });
  }
});
