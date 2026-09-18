import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { GENERIC_HTTP_ERROR_MESSAGE } from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { Subject } from 'rxjs';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { ERROR_SUMMARY_TITLE, UNSAVED_CHANGES_WARNING } from '../constants/create-casefile-test-copy.constant';
import { CREDITOR_STATUS_COPY, CREDITOR_VALIDATION_COPY } from './constants/creditor-copy.constant';
import { CREDITOR_MAJOR_RESPONSE, CREDITOR_PROBLEM } from './mocks/creditor.mock';
import { setupCreditor, type CreditorStore } from './setup/creditor.setup';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9808', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;
const assertRoute = (child: string) => cy.get<Router>('@angularRouter').its('url').should('eq', route(child));
const prohibitPersistence = () => {
  const request = cy.spy().as('prohibitedMaintenanceWrite');
  cy.intercept({ method: '+(POST|PUT|PATCH|DELETE)', url: '**/opal-maintenance-service/**' }, request);
};
const invalidEntryContexts: Array<[string, Partial<ICasesCreateCasefileState>]> = [
  ['missing', { currentOrderTermId: null, orderTerms: [] }],
  ['stale', { currentOrderTermId: 999 }],
];
describe('Order term creditor', () => {
  it(
    'AC1, AC2. should enter the real routed page and request active non-Central-Authority Majors',
    { tags: buildTags() },
    () => {
      setupCreditor({ shell: true });

      cy.get(S.heading).should('have.text', 'Creditor');
      cy.get(S.creditor.applicant).should('exist').and('be.enabled').and('have.value', 'applicant');
      cy.get(S.creditor.major).should('exist').and('be.enabled').and('have.value', 'major');
      cy.get(S.creditor.addNew).should('exist').and('be.enabled').and('have.value', 'add-new');
      cy.get(S.creditor.minor(1)).should('not.exist');
      cy.get(S.creditor.continueButton).should('not.be.disabled');
      cy.get(S.primaryNavigation).should('not.exist');
      cy.get('@majorCreditorsRequest').should('have.been.calledOnceWithExactly', {
        business_unit_id: 77,
        active: true,
        central_authority: false,
      });
    },
  );

  it('AC1. should list five stable Minor IDs and preserve duplicate display names', { tags: buildTags() }, () => {
    setupCreditor({ seedFiveMinorCreditors: true });

    for (const sequenceNumber of [1, 2, 3, 4, 5]) {
      cy.get(S.creditor.minor(sequenceNumber)).should('have.value', `minor:${sequenceNumber}`);
    }
    cy.get('label').filter(':contains("Duplicate Synthetic Name (Minor creditor)")').should('have.length', 2);
  });

  it('AC3. should focus the exact creditor error and preserve the current term', { tags: buildTags() }, () => {
    setupCreditor();
    cy.get(S.creditor.continueButton).should('not.be.disabled').click();
    cy.get(S.errorSummary).should('be.focused').and('contain.text', ERROR_SUMMARY_TITLE);
    cy.get(S.creditor.choiceError).should('contain.text', CREDITOR_VALIDATION_COPY.choice);
    cy.get(S.errorSummaryLinks).contains(CREDITOR_VALIDATION_COPY.choice).click();
    cy.get(S.creditor.applicant).should('be.focused');
    cy.get(S.creditor.choiceFieldset).find('legend').should('contain.text', 'Select creditor');
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.have.length(1);
      expect(store.orderTerms()[0].creditor).to.eq(null);
    });
  });

  for (const selection of [
    { label: 'Applicant', selector: S.creditor.applicant, expected: { type: 'applicant' } },
    {
      label: 'Major',
      selector: S.creditor.major,
      expected: { type: 'major', majorCreditorId: CREDITOR_MAJOR_RESPONSE.refData[1].major_creditor_id },
    },
  ]) {
    it(`AC1, AC4. should accept ${selection.label} locally without persistence`, { tags: buildTags() }, () => {
      prohibitPersistence();
      setupCreditor();
      cy.get(selection.selector).check();
      if (selection.label === 'Major') {
        cy.get(S.creditor.majorId).select(String(CREDITOR_MAJOR_RESPONSE.refData[1].major_creditor_id));
      }
      cy.get(S.creditor.continueButton).click();
      assertRoute(PATHS.children.orderTermsSummary);
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()[0].creditor).to.deep.equal(selection.expected);
        expect(store.taskStatuses().orderTerms).to.eq(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
      });
      cy.get('@prohibitedMaintenanceWrite').should('not.have.been.called');
    });
  }

  it(
    'AC1, AC4. should save one duplicate-named Minor by sequence without changing another term',
    { tags: buildTags() },
    () => {
      prohibitPersistence();
      setupCreditor({ seedFiveMinorCreditors: true });
      cy.get(S.creditor.minor(4)).check();
      cy.get(S.creditor.continueButton).click();
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()[5].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 4 });
        expect(store.orderTerms()[1].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 2 });
      });
      cy.get('@prohibitedMaintenanceWrite').should('not.have.been.called');
    },
  );

  it(
    'AC4. should keep edits local, clear stale Major data after switching, and save Applicant',
    { tags: buildTags() },
    () => {
      setupCreditor();
      cy.get(S.creditor.major).check();
      cy.get(S.creditor.majorId).select(String(CREDITOR_MAJOR_RESPONSE.refData[0].major_creditor_id));
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTerms()[0].creditor).to.eq(null),
      );
      cy.get(S.creditor.applicant).check();
      cy.get(S.creditor.majorId).should('not.exist');
      cy.get(S.creditor.continueButton).click();
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'applicant' }),
      );
    },
  );

  it('AC2, AC3. should keep Applicant and add-new available while Major data loads', { tags: buildTags() }, () => {
    setupCreditor({ majorSource: new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>() });
    cy.get(S.creditor.major).check();
    cy.get(S.creditor.status).should('contain.text', CREDITOR_STATUS_COPY.loading);
    cy.get(S.creditor.continueButton).click();
    cy.get(S.errorSummaryLinks).contains(CREDITOR_VALIDATION_COPY.major).click();
    cy.get(S.creditor.majorId).should('be.focused').and('have.attr', 'aria-label', 'Select major creditor');
    cy.get(S.creditor.applicant).check().should('be.checked');
    cy.get(S.creditor.addNew).should('be.enabled');
  });

  it('AC2, AC4. should accept Applicant while the Major request remains pending', { tags: buildTags() }, () => {
    setupCreditor({ majorSource: new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>() });
    cy.get(S.creditor.applicant).check();
    cy.get(S.creditor.continueButton).click();
    assertRoute(PATHS.children.orderTermsSummary);
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) =>
      expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'applicant' }),
    );
  });

  it(
    'AC2, AC4. should open add-new while the Major request remains pending without allocating a Minor',
    { tags: buildTags() },
    () => {
      setupCreditor({ majorSource: new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>() });
      cy.get(S.creditor.addNew).check();
      cy.get(S.creditor.continueButton).click();
      assertRoute(PATHS.children.minorCreditorDetails);
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.creditorDraft()).to.deep.equal({ termId: 1, branch: 'add-new' });
        expect(store.minorCreditors()).to.deep.equal([]);
        expect(store.nextMinorCreditorSequence()).to.eq(1);
      });
    },
  );

  it('AC2, AC3. should show exact empty validation and permit an explicit retry', { tags: buildTags() }, () => {
    const retry = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    let request = 0;
    setupCreditor({
      majorSource: () => (request++ === 0 ? new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>() : retry),
    });
    cy.get<CreditorStore>('@casesCreateCasefileStore').should('exist');
    cy.get('@majorCreditorsRequest').then((stub) => {
      const first = (stub as unknown as sinon.SinonStub).firstCall
        .returnValue as Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>;
      first.next({ count: 0, refData: [] });
      first.complete();
    });
    cy.get(S.creditor.major).check();
    cy.get(S.creditor.status).should('contain.text', CREDITOR_STATUS_COPY.empty);
    cy.get(S.creditor.retry).click();
    cy.get('@majorCreditorsRequest').should('have.been.calledTwice');
    cy.get(S.creditor.retry).click();
    cy.get('@majorCreditorsRequest').should('have.been.calledTwice');
    cy.then(() => {
      retry.next(structuredClone(CREDITOR_MAJOR_RESPONSE));
      retry.complete();
    });
    cy.get(S.creditor.majorId).should('be.visible');
  });

  it('AC2. should expose safe failure copy, correlation and explicit retry', { tags: buildTags() }, () => {
    const failed = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const retried = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    let request = 0;
    setupCreditor({ majorSource: () => (request++ === 0 ? failed : retried) });
    cy.then(() =>
      failed.error(
        new HttpErrorResponse({
          status: 503,
          error: structuredClone(CREDITOR_PROBLEM),
        }),
      ),
    );
    cy.get(S.creditor.major).check();
    cy.get(S.creditor.status).should('contain.text', GENERIC_HTTP_ERROR_MESSAGE);
    cy.contains('Reference: ' + CREDITOR_PROBLEM.operation_id).should('be.visible');
    cy.contains(CREDITOR_PROBLEM.title).should('not.exist');
    cy.get(S.creditor.retry).click();
    cy.get('@majorCreditorsRequest').should('have.been.calledTwice');
    cy.then(() => {
      retried.next(structuredClone(CREDITOR_MAJOR_RESPONSE));
      retried.complete();
    });
    cy.get(S.creditor.majorId).should('be.visible');
  });

  for (const confirmed of [false, true]) {
    it(
      `AC4. should ${confirmed ? 'discard' : 'retain'} changed creditor edits on Cancel`,
      { tags: buildTags() },
      () => {
        setupCreditor();
        cy.get(S.creditor.applicant).check();
        cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
        cy.on('window:confirm', (message) => {
          expect(message).to.eq(UNSAVED_CHANGES_WARNING);
          return confirmed;
        });
        cy.get(S.creditor.cancel).click();
        assertRoute(confirmed ? PATHS.children.orderTermsSummary : PATHS.children.orderTermCreditor);
        cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.orderTerms()[0].creditor).to.eq(null);
          expect(store.unsavedChanges()).to.eq(!confirmed);
        });
      },
    );
  }

  it('AC4. should open details without allocating a Minor and restore add-new on Return', { tags: buildTags() }, () => {
    setupCreditor();
    cy.get(S.creditor.addNew).check();
    cy.get(S.creditor.continueButton).click();
    assertRoute(PATHS.children.minorCreditorDetails);
    cy.get(S.heading).should('have.text', 'Minor creditor details');
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.minorCreditors()).to.deep.equal([]);
      expect(store.nextMinorCreditorSequence()).to.eq(1);
      expect(store.taskStatuses().orderTerms).to.eq(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
    });
    cy.get(S.minorCreditorDetails.returnLink).click();
    assertRoute(PATHS.children.orderTermCreditor);
    cy.get(S.creditor.addNew).should('be.checked');
  });

  it(
    'AC4. should show a safe navigation failure and retry the accepted assignment unchanged',
    { tags: buildTags() },
    () => {
      setupCreditor();
      cy.get<Router>('@angularRouter').then((router) => {
        const navigateByUrl = router.navigateByUrl.bind(router);
        const navigation = cy.stub(router, 'navigateByUrl');
        navigation.onFirstCall().resolves(false);
        navigation.onSecondCall().callsFake(navigateByUrl);
      });
      cy.get(S.creditor.applicant).check();
      cy.get(S.creditor.continueButton).click();
      cy.get(S.errorSummary).should('contain.text', GENERIC_HTTP_ERROR_MESSAGE);
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'applicant' }),
      );
      cy.get(S.creditor.continueButton).click();
      assertRoute(PATHS.children.orderTermsSummary);
    },
  );

  for (const [context, state] of invalidEntryContexts) {
    it(
      `AC4. should reject direct entry with ${context} term context before requesting Majors`,
      { tags: buildTags() },
      () => {
        setupCreditor({ state });
        assertRoute(PATHS.children.orderTermsSelect);
        cy.get('@majorCreditorsRequest').should('not.have.been.called');
      },
    );
  }
});
