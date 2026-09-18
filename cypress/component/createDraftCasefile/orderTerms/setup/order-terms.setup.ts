import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from 'src/app/app.component';
import { HIDE_PRIMARY_NAV_ROUTE_DATA_KEY } from 'src/app/constants/route-data.constant';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import { httpRetryInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-retry';
import type { CasesCreateCasefileOrderTermRawValue } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-order-terms-input/types/cases-create-casefile-order-term-raw-value.type';
import { mapOrderTermParameters } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-metadata';
import type { IOpalMaintenanceResultDetail } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-result-detail.interface';
import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChildrenOutletContexts, provideRouter, Router, RouterOutlet } from '@angular/router';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { mount } from 'cypress/angular';
import { defer, EMPTY, finalize, Observable, of } from 'rxjs';
import { CasesCreateCasefileComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile.component';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import { routing } from 'src/app/flows/cases/cases-create-casefile/routing/cases-create-casefile.routes';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import type { IOpalMaintenanceResultReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-result-reference-data-response.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import { SAVED_APPLICANT_ORGANISATION } from '../../mocks/applicant-organisation.mock';
import { CREDITOR_MAJOR_RESPONSE } from '../../creditor/mocks/creditor.mock';
import { ORDER_TERMS_MOCK } from '../mocks/order-terms.mock';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class OrderTermsTestHostComponent {}

@Component({ template: '<h1>External destination</h1>' })
class ExternalDestinationComponent {}

export type OrderTermsStore = InstanceType<typeof CasesCreateCasefileStore>;

interface IOrderTermsSetup {
  shell?: boolean;
  detailSource?: Observable<IOpalMaintenanceResultDetail | null>;
  detailHttp?: boolean;
  draftValues?: Record<string, CasesCreateCasefileOrderTermRawValue>;
  initialDraftDirty?: boolean;
  source?: Observable<IOpalMaintenanceResultReferenceDataResponse>;
  savedId?: string | null;
  initialChild?: string;
}

export function setupOrderTerms({
  source,
  shell = false,
  detailSource,
  detailHttp = false,
  draftValues,
  initialDraftDirty = true,
  savedId = null,
  initialChild = PATHS.children.orderTermsSelect,
}: IOrderTermsSetup = {}) {
  const store = new CasesCreateCasefileStore();
  store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
  store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  store.setTaskStatus('applicant', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  store.setApplicantDetails(structuredClone(SAVED_APPLICANT_ORGANISATION));
  store.setOrderDetails({
    applicationId: 1,
    court: null,
    dateOrderMade: null,
    paymentFrequency: 'Weekly',
    dateArrearsLastUpdated: '2026-09-16',
  });
  store.setPendingOrderTermResultId(savedId);
  if (draftValues && savedId) {
    const detail = OPAL_MAINTENANCE_RESULT_DETAILS_MOCK[savedId];
    store.prepareOrderTermDraft({
      resultId: savedId,
      title: detail.result_title,
      fields: mapOrderTermParameters(detail.result_parameters),
    });
    store.updateOrderTermDraft(structuredClone(draftValues), initialDraftDirty);
  }
  const getResult = cy
    .stub()
    .callsFake(
      (id: string) =>
        detailSource ??
        defer(() =>
          detailHttp
            ? TestBed.inject(HttpClient).get<IOpalMaintenanceResultDetail>('/opal-maintenance-service/results/' + id)
            : of(
                Object.hasOwn(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK, id)
                  ? structuredClone(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK[id])
                  : null,
              ),
        ),
    )
    .as('getResult');
  const disposed = cy.spy().as('resultsDisposed');
  const getResults = cy
    .stub()
    .callsFake(() => (source ?? defer(() => of(structuredClone(ORDER_TERMS_MOCK.response)))).pipe(finalize(disposed)))
    .as('getResults');
  const getMajorCreditors = cy
    .stub()
    .callsFake(() => defer(() => of(structuredClone(CREDITOR_MAJOR_RESPONSE))))
    .as('getMajorCreditors');

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    if (shell) document.querySelector('[data-cy-root]')?.removeAttribute('role');
    else document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
    return mount(shell ? AppComponent : OrderTermsTestHostComponent, {
      providers: [
        provideRouter([
          {
            path: PATHS.root,
            component: CasesCreateCasefileComponent,
            data: { [HIDE_PRIMARY_NAV_ROUTE_DATA_KEY]: true },
            canDeactivate: [canDeactivateGuard],
            children: routing,
          },
          { path: 'order-terms-test-external', component: ExternalDestinationComponent },
        ]),
        provideHttpClient(withInterceptors([httpErrorInterceptor, httpRetryInterceptor])),
        { provide: AppInsightsService, useValue: { logException: cy.stub(), logPageView: cy.stub() } },
        { provide: SessionService, useValue: { getTokenExpiry: () => EMPTY } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyClient: cy.stub(),
            initializeLaunchDarklyFlags: () => Promise.resolve(),
            initializeLaunchDarklyChangeListener: cy.stub(),
          },
        },
        { provide: CasesCreateCasefileStore, useValue: store },
        {
          provide: OpalMaintenanceService,
          useValue: {
            getResults,
            getResult,
            getMajorCreditors: getMajorCreditors as (
              params: unknown,
            ) => Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>,
          },
        },
      ],
    }).then(({ fixture }) => {
      TestBed.inject(GlobalStore).setAuthenticated(true);
      const router = TestBed.inject(Router);
      cy.wrap(store).as('casesCreateCasefileStore');
      cy.wrap(router).as('angularRouter');
      return cy.wrap(router.navigateByUrl('/' + PATHS.root + '/' + initialChild)).then(() => {
        fixture.detectChanges();
        const outlet = TestBed.inject(ChildrenOutletContexts).getContext('primary')?.outlet;
        if (outlet?.isActivated) cy.wrap(outlet.component).as('journeyComponent');
        const owner = router.routerState.snapshot.root.firstChild?.firstChild?.data['orderTerms'];
        if (owner) cy.wrap(owner).as('orderTermsOwner');
      });
    });
  });
}
