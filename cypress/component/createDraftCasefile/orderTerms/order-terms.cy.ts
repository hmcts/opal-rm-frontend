import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { GENERIC_HTTP_ERROR_MESSAGE } from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { of, Subject } from 'rxjs';
import type { CasesCreateCasefileOrderTermsLoadService } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-order-terms-select/services/cases-create-casefile-order-terms-load.service';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { IOpalMaintenanceResultReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-result-reference-data-response.interface';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { ERROR_SUMMARY_TITLE, UNSAVED_CHANGES_WARNING } from '../constants/create-casefile-test-copy.constant';
import { ORDER_TERMS_MOCK as M } from './mocks/order-terms.mock';
import { setupOrderTerms, type OrderTermsStore } from './setup/order-terms.setup';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9806', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const problemError = () =>
  new HttpErrorResponse({
    status: 503,
    headers: new HttpHeaders({ 'Content-Type': 'application/problem+json' }),
    error: structuredClone(M.problem),
  });
const path = (child: string): string => '/' + PATHS.root + '/' + child;
const assertRoute = (child: string) => cy.get<Router>('@angularRouter').its('url').should('eq', path(child));
const emit = (subject: Subject<IOpalMaintenanceResultReferenceDataResponse>, value = M.response) =>
  cy.then(() => subject.next(structuredClone(value)));

describe('Order term selection', () => {
  it('AC1, AC2. should render pending controls after one resolver request', { tags: buildTags() }, () => {
    const response = new Subject<IOpalMaintenanceResultReferenceDataResponse>();
    setupOrderTerms({ source: response });
    cy.get('@getResults').should('have.been.calledOnceWithExactly', { order_term: true, active: true });
    cy.get(S.orderTerms.select).should('be.disabled');
    cy.get(S.orderTerms.continueButton).should('be.disabled');
    cy.get(S.orderTerms.cancel).should('be.visible');
    cy.get(S.orderTerms.status).should('have.attr', 'role', 'status').and('contain.text', 'Loading order terms');
    emit(response);
    cy.get(S.orderTerms.select).should('not.be.disabled').and('have.value', '');
    cy.get(S.orderTerms.select)
      .find('option')
      .then((options) => {
        expect(Array.from(options).map((option) => [option.value, option.text])).to.deep.equal([
          ['', 'Select an order'],
          ['MAT', 'MAT - Maintenance'],
          ['MCHILD', 'MCHILD - Child maintenance'],
        ]);
      });
    cy.get('@getResults').should('have.been.calledOnce');
  });

  it('AC3, EMAC1a. should focus the summary and link back to the select', { tags: buildTags() }, () => {
    setupOrderTerms();
    cy.get(S.orderTerms.continueButton).click();
    assertRoute(PATHS.children.orderTermsSelect);
    cy.get(S.errorSummary).should('be.focused').and('contain.text', ERROR_SUMMARY_TITLE);
    cy.get(S.orderTerms.selectError).should('contain.text', 'Select an order');
    cy.get(S.errorSummaryLinks).should('have.length', 1).and('have.text', 'Select an order').click();
    cy.get(S.orderTerms.select).should('be.focused');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
      expect(store.pendingOrderTermResultId()).to.eq(null),
    );
  });

  it('AC4. should save only the ID and restore it on input Back', { tags: buildTags() }, () => {
    setupOrderTerms();
    cy.get(S.orderTerms.select).select('MAT');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
      expect(store.pendingOrderTermResultId()).to.eq(null),
    );
    cy.get(S.orderTerms.continueButton).click();
    assertRoute(PATHS.children.orderTermsInput + '/MAT');
    cy.get(S.orderTerms.heading).should('have.text', 'Maintenance');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.pendingOrderTermResultId()).to.eq('MAT');
      expect(store.taskStatuses().orderTerms).to.eq(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
      expect(store.unsavedChanges()).to.eq(false);
    });
    cy.get(S.orderTerms.back).click();
    cy.get(S.orderTerms.select).should('have.value', 'MAT');
    cy.get('@getResults').should('have.been.calledTwice');
  });

  it('AC4. should cancel an unchanged selection without a warning', { tags: buildTags() }, () => {
    setupOrderTerms();
    const confirmation = cy.stub().returns(false);
    cy.on('window:confirm', confirmation);
    cy.get(S.orderTerms.cancel).click();
    assertRoute(PATHS.children.orderTermsSummary);
    cy.then(() => expect(confirmation).not.to.have.been.called);
  });

  for (const confirmed of [false, true]) {
    it(
      `AC4, RGAC1. should ${confirmed ? 'discard' : 'retain'} a changed selection after Cancel`,
      { tags: buildTags() },
      () => {
        setupOrderTerms({ savedId: 'MAT' });
        cy.get(S.orderTerms.select).select('MCHILD');
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
          expect(store.unsavedChanges()).to.eq(true),
        );
        cy.on('window:confirm', (message) => {
          expect(message).to.eq(UNSAVED_CHANGES_WARNING);
          return confirmed;
        });
        cy.get(S.orderTerms.cancel).click();
        assertRoute(confirmed ? PATHS.children.orderTermsSummary : PATHS.children.orderTermsSelect);
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.pendingOrderTermResultId()).to.eq('MAT');
          expect(store.taskStatuses().respondent).to.eq(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
          expect(store.taskStatuses().orderDetails).to.eq(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
        });
        if (!confirmed) {
          cy.get(S.orderTerms.select).should('have.value', 'MCHILD');
        } else {
          cy.get(S.orderTerms.add).click();
          cy.get(S.orderTerms.select).should('have.value', '');
        }
      },
    );
  }

  it('AC4. should remove the warning when the entry selection is restored', { tags: buildTags() }, () => {
    setupOrderTerms({ savedId: 'MAT' });
    cy.get(S.orderTerms.select).select('MCHILD').select('MAT');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(false));
    cy.on('window:confirm', () => {
      throw new Error('Unchanged selection must not warn');
    });
    cy.get(S.orderTerms.cancel).click();
    assertRoute(PATHS.children.orderTermsSummary);
  });

  it('AC4. should normalize a fresh selection returned to blank as unchanged', { tags: buildTags() }, () => {
    setupOrderTerms();
    cy.get(S.orderTerms.select).select('MAT').select('');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(false));
    cy.on('window:confirm', () => {
      throw new Error('Restoring a fresh selection to blank must not warn');
    });
    cy.get(S.orderTerms.cancel).click();
    assertRoute(PATHS.children.orderTermsSummary);
  });

  it(
    'AC4. should treat clearing a saved selection as a change and retain blank when declined',
    { tags: buildTags() },
    () => {
      setupOrderTerms({ savedId: 'MAT' });
      cy.get(S.orderTerms.select).select('');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
      cy.on('window:confirm', (message) => {
        expect(message).to.eq(UNSAVED_CHANGES_WARNING);
        return false;
      });
      cy.get(S.orderTerms.cancel).click();
      assertRoute(PATHS.children.orderTermsSelect);
      cy.get(S.orderTerms.select).should('have.value', '');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.pendingOrderTermResultId()).to.eq('MAT'),
      );
    },
  );

  it('AC2. should retain selection and safe labels through failure and retry', { tags: buildTags() }, () => {
    const first = new Subject<IOpalMaintenanceResultReferenceDataResponse>();
    const failed = new Subject<IOpalMaintenanceResultReferenceDataResponse>();
    const retried = new Subject<IOpalMaintenanceResultReferenceDataResponse>();
    setupOrderTerms({ source: first, savedId: 'MAT' });
    emit(first);
    cy.get('@getResults').then((aliased) => {
      const stub = aliased as unknown as sinon.SinonStub;
      stub.onSecondCall().returns(failed);
      stub.onThirdCall().returns(retried);
    });
    cy.get<CasesCreateCasefileOrderTermsLoadService>('@orderTermsOwner').then((owner) => owner.load());
    cy.then(() => failed.error(problemError()));
    cy.get(S.orderTerms.select).should('have.value', 'MAT').and('be.disabled');
    cy.get(S.orderTerms.status)
      .should('contain.text', GENERIC_HTTP_ERROR_MESSAGE)
      .should('contain.text', 'synthetic-reference')
      .and('not.contain.text', 'Synthetic internal title')
      .and('not.contain.text', 'Synthetic private detail');
    cy.get(S.orderTerms.continueButton).should('be.disabled');
    cy.get(S.orderTerms.retry).focus().type('{enter}');
    cy.get('@getResults').should('have.been.calledThrice');
    cy.get<CasesCreateCasefileOrderTermsLoadService>('@orderTermsOwner').then((owner) => owner.load());
    cy.get('@getResults').should('have.been.calledThrice');
    cy.get(S.orderTerms.retry).should('be.focused').and('have.attr', 'aria-disabled', 'true');
    emit(retried);
    cy.get(S.orderTerms.retry).should('be.focused');
    cy.get(S.orderTerms.select).should('not.be.disabled').and('have.value', 'MAT');
    cy.get(S.orderTerms.continueButton).should('not.be.disabled');
  });

  it('AC2. should clear an ID removed by a successful response', { tags: buildTags() }, () => {
    const response = new Subject<IOpalMaintenanceResultReferenceDataResponse>();
    setupOrderTerms({ source: response, savedId: 'MCHILD' });
    emit(response, { count: 1, refData: [M.response.refData[0]] });
    cy.get(S.orderTerms.select).should('have.value', '');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
      expect(store.pendingOrderTermResultId()).to.eq(null),
    );
    cy.get(S.orderTerms.continueButton).click();
    cy.get(S.errorSummary).should('contain.text', 'Select an order');
  });

  it('AC2. should cancel a pending request when leaving selection', { tags: buildTags() }, () => {
    setupOrderTerms({ source: new Subject<IOpalMaintenanceResultReferenceDataResponse>() });
    cy.get(S.orderTerms.cancel).click();
    assertRoute(PATHS.children.orderTermsSummary);
    cy.get('@resultsDisposed').should('have.been.calledOnce');
  });

  it('AC4. should reject a mismatched input URL', { tags: buildTags() }, () => {
    setupOrderTerms({ savedId: 'MAT', initialChild: PATHS.children.orderTermsInput + '/MCHILD' });
    assertRoute(PATHS.children.orderTermsSelect);
    cy.get(S.orderTerms.select).should('have.value', 'MAT');
  });

  it('AC4. should always open Summary from the task list and start Add terms fresh', { tags: buildTags() }, () => {
    setupOrderTerms({ savedId: 'MAT', initialChild: PATHS.children.taskList });
    cy.get(S.caseDetails.orderTermsLink).click();
    assertRoute(PATHS.children.orderTermsSummary);
    cy.get(S.orderTerms.add).click();
    cy.get(S.orderTerms.select).should('have.value', '');
    cy.get(S.orderTerms.cancel).click();
    cy.get(S.orderTerms.return).click();
    assertRoute(PATHS.children.taskList);
  });

  it('AC5. should use the native select and keyboard Tab and Enter', { tags: buildTags() }, () => {
    setupOrderTerms();
    cy.get(S.orderTerms.select).select('MAT').should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTerms.continueButton).should('be.focused').type('{enter}');
    assertRoute(PATHS.children.orderTermsInput + '/MAT');
    cy.get(S.orderTerms.back).should('be.visible');
  });

  it(
    'AC5. should move focus from select to Continue to Cancel and activate Cancel with Enter',
    { tags: buildTags() },
    () => {
      setupOrderTerms();
      cy.get(S.orderTerms.select).focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.orderTerms.continueButton).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.orderTerms.cancel).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.ENTER);
      assertRoute(PATHS.children.orderTermsSummary);
    },
  );

  it('AC5. should reflow without horizontal document scrolling at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupOrderTerms();
    cy.get(S.orderTerms.select).should('be.visible');
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
    });
  });

  for (const confirmed of [false, true]) {
    it(
      `RGAC1–3. should ${confirmed ? 'discard' : 'retain'} journey state on external departure`,
      { tags: buildTags() },
      () => {
        setupOrderTerms({ savedId: 'MAT' });
        cy.get(S.orderTerms.select).select('MCHILD');
        cy.on('window:confirm', () => confirmed);
        cy.get<Router>('@angularRouter').then((router) => router.navigateByUrl('/order-terms-test-external'));
        cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.pendingOrderTermResultId()).to.eq(confirmed ? null : 'MAT');
          expect(store.caseTypeSelection() === null).to.eq(confirmed);
        });
        if (!confirmed) cy.get(S.orderTerms.select).should('have.value', 'MCHILD');
      },
    );
  }

  for (const state of ['loading', 'ready', 'empty', 'error', 'validation'] as const) {
    it(`AC5. should have no detected Axe violations in ${state}`, { tags: buildTags() }, () => {
      const response = new Subject<IOpalMaintenanceResultReferenceDataResponse>();
      setupOrderTerms({ source: response });
      if (state === 'ready' || state === 'validation') emit(response);
      if (state === 'empty') emit(response, M.empty);
      if (state === 'error') cy.then(() => response.error(problemError()));
      if (state === 'validation') cy.get(S.orderTerms.continueButton).click();
      if (state === 'empty') {
        cy.get(S.orderTerms.status).should('contain.text', 'There are currently no order terms.');
        cy.get(S.orderTerms.continueButton).should('be.disabled');
      }
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
    });
  }
});

describe('Order term visual evidence', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('AC4. should capture Summary', { tags: buildTags() }, () => {
    setupOrderTerms({ initialChild: PATHS.children.orderTermsSummary });
    cy.get(S.orderTerms.add).should('be.visible');
    cy.screenshot('po-9806-order-terms-summary');
  });

  it('AC1. should capture populated selection', { tags: buildTags() }, () => {
    setupOrderTerms({ savedId: 'MAT' });
    cy.get(S.orderTerms.select).should('have.value', 'MAT');
    cy.screenshot('po-9806-order-terms-populated');
  });

  it('AC2. should capture loading selection', { tags: buildTags() }, () => {
    setupOrderTerms({ source: new Subject<IOpalMaintenanceResultReferenceDataResponse>() });
    cy.get(S.orderTerms.status).should('contain.text', 'Loading order terms');
    cy.screenshot('po-9806-order-terms-loading');
  });

  it('AC2. should capture empty selection', { tags: buildTags() }, () => {
    setupOrderTerms({ source: of(structuredClone(M.empty)) });
    cy.get(S.orderTerms.status).should('contain.text', 'There are currently no order terms.');
    cy.screenshot('po-9806-order-terms-empty');
  });

  it('AC2. should capture safe error selection', { tags: buildTags() }, () => {
    const response = new Subject<IOpalMaintenanceResultReferenceDataResponse>();
    setupOrderTerms({ source: response });
    cy.then(() => response.error(problemError()));
    cy.get(S.orderTerms.status).should('contain.text', 'synthetic-reference');
    cy.screenshot('po-9806-order-terms-error');
  });

  it('AC3. should capture validation selection', { tags: buildTags() }, () => {
    setupOrderTerms();
    cy.get(S.orderTerms.continueButton).click();
    cy.get(S.errorSummary).should('be.focused');
    cy.screenshot('po-9806-order-terms-validation');
  });

  it('AC4. should capture input destination', { tags: buildTags() }, () => {
    setupOrderTerms({ savedId: 'MAT', initialChild: PATHS.children.orderTermsInput + '/MAT' });
    cy.get(S.orderTerms.heading).should('have.text', 'Maintenance');
    cy.screenshot('po-9806-order-terms-input');
  });
});
