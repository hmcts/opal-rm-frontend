import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { ChildrenOutletContexts, provideRouter, Router, RouterOutlet } from '@angular/router';
import { mount } from 'cypress/angular';
import { defer, EMPTY, finalize, Observable, of } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { HIDE_PRIMARY_NAV_ROUTE_DATA_KEY } from 'src/app/constants/route-data.constant';
import { CasesCreateCasefileComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile.component';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { routing } from 'src/app/flows/cases/cases-create-casefile/routing/cases-create-casefile.routes';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import { SAVED_APPLICANT_ORGANISATION } from '../../mocks/applicant-organisation.mock';
import { ORDER_TERMS_MOCK } from '../../orderTerms/mocks/order-terms.mock';
import { CREDITOR_ACCEPTED_TERMS, CREDITOR_MAJOR_RESPONSE, CREDITOR_MINOR_CREDITORS } from '../mocks/creditor.mock';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class CreditorTestHostComponent {}

@Component({ template: '<h1>External destination</h1>' })
class ExternalDestinationComponent {}

export type CreditorStore = InstanceType<typeof CasesCreateCasefileStore>;

export interface CreditorRequestCounters {
  started: number;
  completed: number;
  disposed: number;
}

interface CreditorSetupOptions {
  awaitNavigation?: boolean;
  shell?: boolean;
  initialChild?: string;
  majorSource?:
    | Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>
    | (() => Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>);
  seedFiveMinorCreditors?: boolean;
  state?: Partial<ICasesCreateCasefileState>;
}

export function setupCreditor({
  awaitNavigation = true,
  shell = false,
  initialChild = PATHS.children.orderTermCreditor,
  majorSource,
  seedFiveMinorCreditors = false,
  state = {},
}: CreditorSetupOptions = {}) {
  const store = new CasesCreateCasefileStore();
  store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
  store.setApplicantDetails(structuredClone(SAVED_APPLICANT_ORGANISATION));
  store.setOrderDetails({
    applicationId: 1,
    court: null,
    dateOrderMade: null,
    paymentFrequency: 'Monthly',
    dateArrearsLastUpdated: '2026-09-18',
  });
  const seededTerms = seedFiveMinorCreditors
    ? structuredClone(CREDITOR_ACCEPTED_TERMS)
    : [{ ...structuredClone(CREDITOR_ACCEPTED_TERMS[5]), termId: 1 }];
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    orderTerms: seededTerms,
    currentOrderTermId: seedFiveMinorCreditors ? 6 : 1,
    nextOrderTermId: seedFiveMinorCreditors ? 7 : 2,
    minorCreditors: seedFiveMinorCreditors ? structuredClone(CREDITOR_MINOR_CREDITORS) : [],
    nextMinorCreditorSequence: seedFiveMinorCreditors ? 6 : 1,
    ...structuredClone(state),
  });

  const counters: CreditorRequestCounters = { started: 0, completed: 0, disposed: 0 };
  const getMajorCreditors = cy
    .stub()
    .callsFake(() => {
      counters.started += 1;
      const source =
        typeof majorSource === 'function'
          ? majorSource()
          : (majorSource ?? defer(() => of(structuredClone(CREDITOR_MAJOR_RESPONSE))));
      return source.pipe(
        finalize(() => {
          counters.completed += 1;
          counters.disposed += 1;
        }),
      );
    })
    .as('majorCreditorsRequest');

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    if (shell) document.querySelector('[data-cy-root]')?.removeAttribute('role');
    else document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
    return mount(shell ? AppComponent : CreditorTestHostComponent, {
      providers: [
        provideRouter([
          {
            path: PATHS.root,
            component: CasesCreateCasefileComponent,
            data: { [HIDE_PRIMARY_NAV_ROUTE_DATA_KEY]: true },
            children: routing,
          },
          { path: 'creditor-test-external', component: ExternalDestinationComponent },
        ]),
        provideHttpClient(),
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
            getMajorCreditors,
            getResults: () => of(structuredClone(ORDER_TERMS_MOCK.response)),
            getResult: (id: string) => of(structuredClone(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK[id]) ?? null),
          },
        },
      ],
    }).then(({ fixture }) => {
      TestBed.inject(GlobalStore).setAuthenticated(true);
      const router = TestBed.inject(Router);
      cy.wrap(store).as('casesCreateCasefileStore');
      cy.wrap(router).as('angularRouter');
      cy.wrap(counters).as('majorCreditorRequestCounters');
      const navigation = router
        .navigateByUrl('/' + PATHS.root + '/' + initialChild)
        .then((value) => ({ value, error: null }))
        .catch((error: unknown) => ({ value: false, error }));
      cy.wrap({ navigation }, { log: false }).as('creditorNavigation');
      const finishSetup = () => {
        fixture.detectChanges();
        const outlet = TestBed.inject(ChildrenOutletContexts).getContext('primary')?.outlet;
        if (outlet?.isActivated) cy.wrap(outlet.component).as('journeyComponent');
      };
      if (!awaitNavigation) {
        finishSetup();
        return;
      }
      return cy.wrap(navigation).then(() => {
        finishSetup();
      });
    });
  });
}
