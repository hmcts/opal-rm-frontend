import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { CASES_CREATE_CASEFILE_STATE } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-state.constant';
import { EMPTY, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { CasesCreateCasefileCheckDetailsComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-check-details/cases-create-casefile-check-details.component';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import { getState } from '@ngrx/signals';
import type { CasesDraftCasefileStore } from 'src/app/flows/cases/cases-draft/stores/cases-draft-casefile.store';
import { CasesDraftNavigationService } from 'src/app/flows/cases/cases-draft/services/cases-draft-navigation.service';
import { CreateCasefileSelectors as Page } from '../../../shared/selectors/create-casefile.selectors';
import {
  createRejectedAmendment,
  createResubmittedAmendment,
  createSurnameOnlyRejectedAmendment,
} from './mocks/rejected-amendment.mock';
import { interceptAmendmentReferences } from './setup/rejected-amendment.intercept';
import { setupReview, type ReviewStore } from './setup/review.setup';

const S = Page.review;
const buildTags = (): string[] => ['@JIRA-STORY:PO-10610', '@JIRA-EPIC:PO-10817', '@JIRA-LABEL:create-draft-casefile'];

describe('Rejected casefile replacement', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    interceptAmendmentReferences();
    const post = cy.spy().as('prohibitedPost');
    cy.intercept('POST', '/opal-maintenance-service/draft-casefiles', (request) => {
      post();
      request.reply({ statusCode: 405 });
    });
  });

  it('AC3. should replace the same draft once with its original quoted version', { tags: buildTags() }, () => {
    const amendment = createRejectedAmendment();
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    cy.intercept('PUT', '/opal-maintenance-service/draft-casefiles/17', (request) =>
      held.then(() => request.reply({ statusCode: 200, headers: { ETag: '"5"' }, body: createResubmittedAmendment() })),
    ).as('replacement');
    setupReview({ amendment });

    cy.get(S.submit).click();
    cy.get(S.submit).should('be.enabled').click();
    cy.then(() => release());
    cy.wait('@replacement').then(({ request }) => {
      expect(request.headers['if-match']).to.equal('"4"');
      expect(request.body).to.deep.equal({ business_unit_id: 44, casefile: amendment.draft.casefile });
    });
    cy.get('@replacement.all').should('have.length', 1);
    cy.get('@prohibitedPost').should('not.have.been.called');
    cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').should((store) => {
      expect(store.draft()).to.equal(null);
      expect(store.etag()).to.equal(null);
    });
    cy.get<ReviewStore>('@reviewStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) =>
      expect(navigate.firstCall.args[0].toString()).to.equal('/cases/draft/create-and-manage/tabs#rejected'),
    );
  });

  it('AC3. should return surname-only respondents after one successful replacement', { tags: buildTags() }, () => {
    const amendment = createSurnameOnlyRejectedAmendment();
    const replacement = structuredClone(amendment.draft);
    replacement.casefile_status = 'RESUBMITTED';
    replacement.submitted_by = amendment.identity.submittedBy;
    cy.intercept('PUT', '/opal-maintenance-service/draft-casefiles/17', {
      body: replacement,
      headers: { ETag: '"5"' },
    }).as('replacement');
    setupReview({ amendment });

    cy.get(S.submit).click();
    cy.wait('@replacement').then(({ request }) => {
      expect(request.headers['if-match']).to.equal('"4"');
      expect(request.body.casefile.respondent_account.respondent.party_details.individual_details).not.to.have.property(
        'forenames',
      );
    });
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) => {
      expect(navigate).to.have.been.calledOnce;
      expect(navigate.firstCall.args[0].toString()).to.equal('/cases/draft/create-and-manage/tabs#rejected');
    });
    cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').should((store) => {
      expect(store.draft()).to.equal(null);
      expect(store.etag()).to.equal(null);
    });
    cy.get<ReviewStore>('@reviewStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );
    cy.then(() => {
      const navigation = TestBed.inject(CasesDraftNavigationService);
      expect(navigation.consumeAllRejectedResubmission('dashboard')).to.deep.equal({
        origin: 'dashboard',
        identity: amendment.identity,
        draftCasefileId: 17,
        respondentForename: '',
        respondentSurname: 'Respondent',
      });
    });
    cy.get(S.submit).click();
    cy.get('@replacement.all').should('have.length', 1);
    cy.get('@prohibitedPost').should('not.have.been.called');
  });

  [422, 503, 409].forEach((statusCode) => {
    it(
      `AC4. should retain the complete amendment after a ${statusCode || 'network'} failure`,
      { tags: buildTags() },
      () => {
        const amendment = createRejectedAmendment();
        cy.intercept('PUT', '/opal-maintenance-service/draft-casefiles/17', {
          statusCode,
          body: { retriable: true },
        }).as('replacement');
        setupReview({ amendment });
        let original: unknown;
        cy.get<ReviewStore>('@reviewStore').then((store) => {
          original = structuredClone(getState(store));
        });
        cy.get(S.submit).click();
        cy.wait('@replacement');
        cy.get<InstanceType<typeof GlobalStore>>('@globalStore').should((store) =>
          expect(store.bannerError().error).to.equal(true),
        );
        cy.get<ReviewStore>('@reviewStore').should((store) => expect(getState(store)).to.deep.equal(original));
        cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').should((store) => {
          expect(store.draft()).to.deep.equal(amendment.draft);
          expect(store.etag()).to.equal('"4"');
        });
        if (statusCode === 503 || statusCode === 409) {
          cy.get<InstanceType<typeof GlobalStore>>('@globalStore').then((store) => store.resetBannerError());
          cy.get(S.submit).should('be.enabled').click();
          cy.get<InstanceType<typeof GlobalStore>>('@globalStore').should((store) => {
            expect(store.bannerError().error).to.equal(true);
            expect(store.bannerError().message).to.equal(
              'Select Back to reload the saved case before submitting again. Confirming the reload discards your unsaved corrections.',
            );
          });
          cy.get<ReviewStore>('@reviewStore').should((store) => expect(getState(store)).to.deep.equal(original));
        }
        cy.get('@replacement.all').should('have.length', 1);
        cy.get('@prohibitedPost').should('not.have.been.called');
        cy.get('@routerNavigate').should('not.have.been.called');
      },
    );
  });

  it(
    'AC3, AC4. should lock a malformed success without clearing corrections or falling back to creation',
    { tags: buildTags() },
    () => {
      cy.intercept('PUT', '/opal-maintenance-service/draft-casefiles/17', {
        statusCode: 200,
        body: {},
        headers: { ETag: '"5"' },
      }).as('replacement');
      setupReview({ amendment: createRejectedAmendment() });
      cy.get(S.submit).click();
      cy.wait('@replacement');
      cy.get<ReviewStore>('@reviewStore').should((store) =>
        expect(store.respondentDetails()?.firstNames).to.equal('Synthetic'),
      );
      cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').should((store) =>
        expect(store.requiresReload()).to.equal(true),
      );
      cy.get(S.submit).should('be.enabled').click();
      cy.get('@replacement.all').should('have.length', 1);
      cy.get('@prohibitedPost').should('not.have.been.called');
    },
  );

  it(
    'AC4. should retain corrections after refused Back navigation without replaying PUT',
    { tags: buildTags() },
    () => {
      const amendment = createRejectedAmendment();
      cy.intercept('PUT', '/opal-maintenance-service/draft-casefiles/17', {
        statusCode: 503,
        body: { retriable: true },
      }).as('replacement');
      setupReview({ amendment, failNavigation: true });
      let original: unknown;
      cy.get<ReviewStore>('@reviewStore').then((store) => {
        original = structuredClone(getState(store));
      });
      cy.get(S.submit).click();
      cy.wait('@replacement');
      cy.get(S.submit).should('be.enabled').click();
      cy.get(S.backLink).click();
      cy.get('@routerNavigate').should('have.been.calledOnceWith', '/cases/create-casefile/task-list/17');
      cy.get<ReviewStore>('@reviewStore').should((store) => expect(getState(store)).to.deep.equal(original));
      cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').should((store) => {
        expect(store.etag()).to.equal('"4"');
        expect(store.draft()).to.deep.equal(amendment.draft);
      });
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.get('@replacement.all').should('have.length', 1);
      cy.get('@prohibitedPost').should('not.have.been.called');
    },
  );

  it('AC3, AC4. should retry only rejected-list navigation after confirmed replacement', { tags: buildTags() }, () => {
    cy.intercept('PUT', '/opal-maintenance-service/draft-casefiles/17', {
      body: createResubmittedAmendment(),
      headers: { ETag: '\"5\"' },
    }).as('replacement');
    setupReview({ amendment: createRejectedAmendment(), failNavigation: true });
    cy.get(S.submit).click();
    cy.wait('@replacement');
    cy.get(S.submit).should('be.enabled');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) => navigate.resolves(true));
    cy.get(S.submit).click();
    cy.get('@routerNavigate').should('have.been.calledTwice');
    cy.get('@replacement.all').should('have.length', 1);
    cy.get('@prohibitedPost').should('not.have.been.called');
  });

  it('AC3, AC4. should lock an empty replacement response without replay', { tags: buildTags() }, () => {
    setupReview({ amendment: createRejectedAmendment() });
    cy.then(() => {
      const replacement = cy.stub(TestBed.inject(OpalMaintenanceService), 'replaceDraftCasefile').returns(EMPTY);
      cy.wrap(replacement).as('emptyReplacement');
    });
    cy.get(S.submit).click();
    cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').should((store) =>
      expect(store.requiresReload()).to.equal(true),
    );
    cy.get(S.submit).should('be.enabled').click();
    cy.get('@emptyReplacement').should('have.been.calledOnce');
    cy.get('@prohibitedPost').should('not.have.been.called');
  });

  it('AC3. should prevent POST when an amendment loses its persisted context', { tags: buildTags() }, () => {
    setupReview({ amendment: createRejectedAmendment() });
    cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').then((store) => store.resetStore());
    cy.get<ComponentFixture<CasesCreateCasefileCheckDetailsComponent>>('@reviewFixture').then(({ componentInstance }) =>
      componentInstance.handleSubmit(),
    );
    cy.get('@prohibitedPost').should('not.have.been.called');
    cy.get<ReviewStore>('@reviewStore').should((store) => expect(store.submissionIntent()).to.equal('amendment'));
  });

  it('AC4. should retain corrections and lock after one application-level network error', { tags: buildTags() }, () => {
    setupReview({ amendment: createRejectedAmendment() });
    let original: unknown;
    cy.get<ReviewStore>('@reviewStore').then((store) => {
      original = structuredClone(getState(store));
    });
    cy.then(() => {
      const replacement = cy
        .stub(TestBed.inject(OpalMaintenanceService), 'replaceDraftCasefile')
        .returns(throwError(() => new HttpErrorResponse({ status: 0 })));
      cy.wrap(replacement).as('networkReplacement');
    });
    cy.get(S.submit).click();
    cy.get<InstanceType<typeof CasesDraftCasefileStore>>('@persistedCasefileStore').should((store) =>
      expect(store.requiresReload()).to.equal(true),
    );
    cy.get(S.submit).should('be.enabled').click();
    cy.get('@networkReplacement').should('have.been.calledOnce');
    cy.get<ReviewStore>('@reviewStore').should((store) => expect(getState(store)).to.deep.equal(original));
    cy.get('@prohibitedPost').should('not.have.been.called');
  });

  [1280, 320].forEach((width) => {
    it(`AC2. should expose amendment review accessibly with ${width}px reflow`, { tags: buildTags() }, () => {
      cy.viewport(width, 900);
      setupReview({ amendment: createRejectedAmendment() });
      cy.get(S.section('respondent')).should('contain.text', 'Synthetic').and('contain.text', 'Respondent');
      cy.get(S.change('caseType')).should('not.exist');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.document().should((document) =>
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
      );
      cy.screenshot(`po-10610-amendment-review-${width}`);
    });
  });

  it('AC2. should move from the submit action to cancel with the native Tab key', { tags: buildTags() }, () => {
    setupReview({ amendment: createRejectedAmendment() });
    cy.get(S.submit).focus();
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.cancel).should('be.focused');
  });
});
