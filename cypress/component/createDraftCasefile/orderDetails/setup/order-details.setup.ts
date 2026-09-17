import { EMPTY } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { HIDE_PRIMARY_NAV_ROUTE_DATA_KEY } from 'src/app/constants/route-data.constant';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { SAVED_RESPONDENT } from '../../mocks/respondent-details.mock';
import { SAVED_APPLICANT_INDIVIDUAL } from '../../mocks/applicant-individual.mock';
import { SAVED_INTEREST_AND_INDEXATION } from '../../payments/mocks/interest-and-indexation.mock';
import { SAVED_PAYMENT_ARRANGEMENT } from '../../payments/mocks/managing-payments.mock';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet, ChildrenOutletContexts } from '@angular/router';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import { httpRetryInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-retry';
import { mount } from 'cypress/angular';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { CasesCreateCasefileComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile.component';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import type { ICasesCreateCasefileOrderDetails } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-order-details.interface';
import { routing } from 'src/app/flows/cases/cases-create-casefile/routing/cases-create-casefile.routes';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class OrderDetailsHostComponent {}
@Component({ template: '<h1>External test destination</h1>' })
class ExternalDestinationComponent {}

interface SetupOptions {
  shell?: boolean;
  seeded?: boolean;
  initialChildPath?: string;
  waitForNavigation?: boolean;
}
export const setupOrderDetails = (
  savedDetails: ICasesCreateCasefileOrderDetails | null = null,
  options: SetupOptions = {},
) => {
  const store = new CasesCreateCasefileStore();
  if (options.seeded !== false) {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setTaskStatus('respondent', 'Provided');
    store.setTaskStatus('applicant', 'Provided');
    store.setRespondentDetails(structuredClone(SAVED_RESPONDENT));
    store.setApplicantDetails(structuredClone(SAVED_APPLICANT_INDIVIDUAL));
    store.setInterestAndIndexation(structuredClone(SAVED_INTEREST_AND_INDEXATION));
    store.setPaymentArrangement(SAVED_PAYMENT_ARRANGEMENT);
    store.setCentralAuthorityDetails({
      remoReference: 'Synthetic REMO',
      centralAuthorityReference: 'Synthetic authority',
      majorCreditor: null,
    });
  }
  if (savedDetails) store.setOrderDetails(structuredClone(savedDetails));
  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    if (options.shell) document.querySelector('[data-cy-root]')?.removeAttribute('role');
    else document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
    return mount(options.shell ? AppComponent : OrderDetailsHostComponent, {
      providers: [
        provideRouter([
          {
            path: PATHS.root,
            component: CasesCreateCasefileComponent,
            children: routing,
            data: { [HIDE_PRIMARY_NAV_ROUTE_DATA_KEY]: true },
            canDeactivate: [canDeactivateGuard],
          },
          { path: 'external-test-destination', component: ExternalDestinationComponent },
        ]),
        provideHttpClient(withInterceptors([httpErrorInterceptor, httpRetryInterceptor])),
        { provide: CasesCreateCasefileStore, useValue: store },
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
      ],
    }).then(({ fixture }) => {
      TestBed.inject(GlobalStore).setAuthenticated(true);
      const router = TestBed.inject(Router);
      cy.wrap(store).as('casesCreateCasefileStore');
      cy.wrap(router).as('angularRouter');
      cy.wrap(fixture).as('orderFixture');
      const navigation = router
        .navigateByUrl('/' + PATHS.root + '/' + (options.initialChildPath ?? PATHS.children.taskList))
        .catch((error) => {
          if (error.status !== 503) throw error;
          return false;
        });
      if (options.waitForNavigation === false) return;
      return cy.wrap(navigation).then(() => {
        fixture.detectChanges();
        const outlet = TestBed.inject(ChildrenOutletContexts).getContext('primary')?.outlet;
        if (outlet?.isActivated) cy.wrap(outlet.component).as('journeyComponent');
      });
    });
  });
};
