import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { BehaviorSubject } from 'rxjs';
import type { Data } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { setupReview } from './setup/review.setup';
import { createDeletionScenario, DELETE_CASEFILE_SEEDS } from './mocks/delete-casefile.mock';
import { DELETE_CASEFILE_EXPECTED_COPY } from './constants/delete-casefile-copy.constant';

const D = CreateCasefileSelectors.deletion;
const buildTags = () => ['@JIRA-STORY:PO-10609', '@JIRA-EPIC:PO-10817'];

describe('Delete casefile shared form', () => {
  beforeEach(() => cy.viewport(1280, 900));

  it('AC2. should cap ordinary entry with the shared counter', { tags: buildTags() }, () => {
    const scenario = createDeletionScenario();
    cy.intercept('PATCH', scenario.url, { statusCode: 200, body: scenario.deleted, headers: { ETag: '"1"' } }).as(
      'deletePatch',
    );
    setupReview({ resolved: scenario.resolved, deleteScreen: true });
    cy.get(D.reason)
      .should('have.attr', 'maxlength', '250')
      .and('have.attr', 'aria-describedby', 'create_casefile_delete_reason-with-hint-info');
    cy.get(D.host)
      .find('label')
      .should('have.attr', 'for', 'create_casefile_delete_reason')
      .and('contain.text', 'Reason');
    cy.get(D.counter)
      .should('have.attr', 'aria-hidden', 'true')
      .and('contain.text', 'You have 250 characters remaining');
    cy.get(D.reason).type('R'.repeat(251));
    cy.get(D.reason).should('have.value', 'R'.repeat(250));
    cy.get(D.counter).should('contain.text', 'You have 0 characters remaining');
    cy.get('@deletePatch.all').should('have.length', 0);
  });

  it('AC2. should synchronize the shared counts when the same page loads another case', { tags: buildTags() }, () => {
    const scenario = createDeletionScenario();
    const next = createDeletionScenario().resolved;
    next.draft.draft_casefile_id = 18;
    setupReview({ resolved: scenario.resolved, deleteScreen: true, deleteReason: 'Synthetic' });
    cy.get(D.reason).should('have.value', 'Synthetic');
    cy.get(D.counter).should('contain.text', 'You have 241 characters remaining');
    cy.get(D.screenReaderCounter).should('contain.text', 'You have 241 characters remaining');
    cy.get(D.reason).then(($textarea) => {
      const original = $textarea[0];
      cy.get<BehaviorSubject<Data>>('@reviewRouteData').then((data) =>
        data.next({ casefileIntent: 'checker-delete', draftCasefile: next }),
      );
      cy.get(D.reason).should(($current) => expect($current[0]).to.equal(original));
    });
    cy.get(D.reason).should('have.value', '');
    cy.get(D.counter).should('contain.text', 'You have 250 characters remaining');
    cy.get(D.screenReaderCounter)
      .should('have.attr', 'aria-live', 'polite')
      .and('contain.text', 'You have 250 characters remaining');
  });

  for (const scenarioName of ['empty', 'whitespace', 'defensive limit'] as const) {
    it('AC2. should reject ' + scenarioName + ' before PATCH', { tags: buildTags() }, () => {
      const scenario = createDeletionScenario();
      const seed = DELETE_CASEFILE_SEEDS[scenarioName];
      const message =
        scenarioName === 'defensive limit'
          ? DELETE_CASEFILE_EXPECTED_COPY.maxlength
          : DELETE_CASEFILE_EXPECTED_COPY.required;
      cy.intercept('PATCH', scenario.url, { statusCode: 200, body: scenario.deleted }).as('deletePatch');
      setupReview({ resolved: scenario.resolved, deleteScreen: true, deleteReason: seed });
      cy.get(D.submit).click();
      cy.get(D.summary).should('be.focused').and('contain.text', message);
      cy.get(D.reasonError).should('contain.text', message);
      cy.get(D.summaryLink).contains(message).click();
      cy.get(D.reason).should('be.focused').and('have.value', seed);
      cy.get(D.reason)
        .invoke('attr', 'aria-describedby')
        .should('include', 'create_casefile_delete_reason-error-message');
      cy.get('@deletePatch.all').should('have.length', 0);
    });
  }

  it('AC2. should support keyboard submit and the linked error target', { tags: buildTags() }, () => {
    const scenario = createDeletionScenario();
    setupReview({ resolved: scenario.resolved, deleteScreen: true });
    cy.get(D.heading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(D.reason).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(D.submit).should('be.focused').type('{enter}');
    cy.get(D.summary).should('be.focused');
    cy.get(D.summaryLink).contains(DELETE_CASEFILE_EXPECTED_COPY.required).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(D.reason).should('be.focused');
  });

  it('AC4. should cancel by keyboard without PATCH', { tags: buildTags() }, () => {
    const scenario = createDeletionScenario();
    cy.intercept('PATCH', scenario.url, { statusCode: 200, body: scenario.deleted }).as('deletePatch');
    setupReview({ resolved: scenario.resolved, deleteScreen: true });
    cy.get(D.reason).focus();
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(D.submit).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(D.cancel).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get('@routerNavigate').should('have.been.calledOnce');
    cy.get('@deletePatch.all').should('have.length', 0);
  });
});

describe('Delete casefile request handling', () => {
  it('AC3. should lock the pending request and send the exact decision', { tags: buildTags() }, () => {
    const scenario = createDeletionScenario();
    let release: () => void = () => {
      throw new Error('Response was not initialized');
    };
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    cy.intercept('PATCH', scenario.url, (request) =>
      held.then(() =>
        request.reply({ statusCode: 200, body: structuredClone(scenario.deleted), headers: { ETag: '"1"' } }),
      ),
    ).as('deletePatch');
    setupReview({ resolved: scenario.resolved, deleteScreen: true, deleteReason: scenario.reason });
    cy.get(D.submit).click().should('be.disabled');
    cy.get(D.cancel).should('not.exist');
    cy.get(D.reason).should('be.disabled').and('have.value', scenario.reason);
    cy.then(() => release());
    cy.wait('@deletePatch').then(({ request }) => {
      expect(request.headers['if-match']).to.equal('"0"');
      expect(request.body).to.deep.equal({
        business_unit_id: 44,
        casefile_status: 'DELETED',
        status_message: scenario.reason,
      });
    });
    cy.get('@deletePatch.all').should('have.length', 1);
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) => {
      expect(navigate.firstCall.args[0].toString()).to.equal('/cases/draft/check-and-validate/tabs#to-review');
    });
  });

  for (const status of [409, 401, 500]) {
    it('AC3. should preserve shared feedback and unlock after HTTP ' + status, { tags: buildTags() }, () => {
      const scenario = createDeletionScenario();
      cy.intercept('PATCH', scenario.url, {
        statusCode: status,
        body: { retriable: true, title: 'Synthetic failure', detail: 'Synthetic request failed' },
      }).as('deletePatch');
      cy.intercept('GET', scenario.url, { body: scenario.resolved.draft, headers: { ETag: '"0"' } }).as('deleteStatus');
      setupReview({ resolved: scenario.resolved, deleteScreen: true, deleteReason: scenario.reason });
      cy.get(D.submit).click();
      cy.wait('@deletePatch');
      cy.get(D.reason).should('not.be.disabled').and('have.value', scenario.reason);
      cy.get(D.submit).should('not.be.disabled');
      cy.get(D.cancel).should('be.visible');
      cy.get<InstanceType<typeof GlobalStore>>('@globalStore').should((store) => {
        expect(store.bannerError().message).to.equal('Synthetic request failed');
      });
      cy.get('@deleteStatus.all').should('have.length', 0);
      cy.get('@deletePatch.all').should('have.length', 1);
      cy.get('@routerNavigate').should('not.have.been.called');
    });
  }

  it('AC3. should use the shared interceptor destination for non-retriable HTTP 403', { tags: buildTags() }, () => {
    const scenario = createDeletionScenario();
    cy.intercept('PATCH', scenario.url, {
      statusCode: 403,
      body: { retriable: false },
    }).as('deletePatch');
    setupReview({ resolved: scenario.resolved, deleteScreen: true, deleteReason: scenario.reason });
    cy.then(() => cy.spy(TestBed.inject(Router), 'navigate').as('sharedErrorNavigation'));
    cy.get(D.submit).click();
    cy.wait('@deletePatch');
    cy.get('@sharedErrorNavigation').should('have.been.calledOnceWithExactly', ['/error/permission-denied']);
    cy.get('@deletePatch.all').should('have.length', 1);
  });
});

describe('Delete casefile partial accessibility evidence', () => {
  beforeEach(() => cy.viewport(1280, 900));
  for (const state of ['normal', 'error', 'request error'] as const) {
    it(
      'AC2, AC4. should have no detected Axe violations and reflow at 320 CSS pixels in ' + state,
      { tags: buildTags() },
      () => {
        const scenario = createDeletionScenario();
        if (state === 'request error') {
          cy.intercept('PATCH', scenario.url, {
            statusCode: 409,
            body: { retriable: true, title: 'Synthetic conflict', detail: 'Synthetic conflict detail' },
          }).as('deletePatch');
        }
        setupReview({
          resolved: scenario.resolved,
          deleteScreen: true,
          ...(state === 'request error' ? { deleteReason: scenario.reason } : {}),
        });
        if (state !== 'normal') cy.get(D.submit).click();
        if (state === 'error') cy.get(D.summary).should('be.focused');
        if (state === 'request error') {
          cy.wait('@deletePatch');
          cy.get(D.reason).should('not.be.disabled').and('have.value', scenario.reason);
        }
        cy.get(D.identity).should('be.visible').and('contain.text', 'Synthetic Respondent');
        cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
        cy.checkA11y();
        cy.screenshot('po-10609-delete-' + state + '-1280');
        cy.viewport(320, 900);
        cy.document().should((document) => {
          expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
        });
      },
    );
  }
});
