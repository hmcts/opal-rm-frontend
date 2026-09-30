import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import type { Routes } from '@angular/router';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { mount } from 'cypress/angular';
import type { StaticResponse } from 'cypress/types/net-stubbing';
import { NEVER } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { CasesCreateCasefileComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile.component';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import type { ICasesCreateCasefileApplicantOrganisation } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-applicant-organisation.interface';
import { routing } from 'src/app/flows/cases/cases-create-casefile/routing/cases-create-casefile.routes';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { IOpalMaintenanceCountryReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import type { CasesCreateCasefileCaseTypeSelection } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-case-type-selection.type';
import { STARTER_USER_STATE_CASES_ONLY } from 'cypress/shared/mocks/user-state.mock';
import { COUNTRIES_RESPONSE } from '../mocks/countries.mock';

@Component({ imports: [RouterOutlet], template: '<router-outlet></router-outlet>' })
class CreateCasefileRouterHostComponent {}

const testRoutes: Routes = [
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.root,
    component: CasesCreateCasefileComponent,
    children: routing,
  },
];

interface IApplicantOrganisationSetup {
  caseTypeSelection?: CasesCreateCasefileCaseTypeSelection;
  countries?: IOpalMaintenanceCountryReferenceDataResponse | StaticResponse;
  savedApplicant?: ICasesCreateCasefileApplicantOrganisation | null;
  initialChildPath?: string;
  useHttpErrorInterceptor?: boolean;
  useAppShell?: boolean;
}

export type CasesCreateCasefileStoreInstance = InstanceType<typeof CasesCreateCasefileStore>;
export type GlobalStoreInstance = InstanceType<typeof GlobalStore>;

export const setupApplicantOrganisation = ({
  caseTypeSelection = {
    caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
    applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
  },
  countries = COUNTRIES_RESPONSE,
  savedApplicant = null,
  initialChildPath = CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantOrganisation,
  useHttpErrorInterceptor = false,
  useAppShell = false,
}: IApplicantOrganisationSetup = {}) => {
  const countriesResponse = 'refData' in countries ? { statusCode: 200, body: countries } : countries;
  cy.intercept('GET', '**/opal-maintenance-service/countries?active=true', countriesResponse).as('getCountries');

  const store = new CasesCreateCasefileStore();
  const globalStore = new GlobalStore();
  const appInsightsLogException = cy.stub().as('appInsightsLogException');
  if (useAppShell) {
    globalStore.setAuthenticated(true);
    globalStore.setUserState(STARTER_USER_STATE_CASES_ONLY);
  }
  store.setCaseTypeSelection(caseTypeSelection);
  if (savedApplicant) {
    store.setApplicantDetails(structuredClone(savedApplicant));
  }

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');

    const component = useAppShell ? AppComponent : CreateCasefileRouterHostComponent;

    return mount(component, {
      providers: [
        provideRouter(testRoutes),
        useHttpErrorInterceptor ? provideHttpClient(withInterceptors([httpErrorInterceptor])) : provideHttpClient(),
        { provide: CasesCreateCasefileStore, useValue: store },
        { provide: GlobalStore, useValue: globalStore },
        {
          provide: AppInsightsService,
          useValue: { logException: appInsightsLogException, logPageView: () => null },
        },
        { provide: SessionService, useValue: { getTokenExpiry: () => NEVER } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyClient: () => null,
            initializeLaunchDarklyFlags: () => Promise.resolve(),
            initializeLaunchDarklyChangeListener: () => null,
          },
        },
      ],
    }).then(() => {
      const router = TestBed.inject(Router);
      const initialUrl = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + initialChildPath;

      cy.wrap(store).as('casesCreateCasefileStore');
      cy.wrap(globalStore).as('globalStore');
      cy.wrap(router).as('angularRouter');
      return cy.wrap(router.navigateByUrl(initialUrl));
    });
  });
};
