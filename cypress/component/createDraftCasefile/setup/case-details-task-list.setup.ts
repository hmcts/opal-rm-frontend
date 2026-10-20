import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import type { ICasesDraftCasefileResolved } from 'src/app/flows/cases/cases-draft/interfaces/cases-draft-casefile-resolved.interface';
import { reviewUser } from '../review/setup/review.setup';
import { CasesDraftCasefileStore } from 'src/app/flows/cases/cases-draft/stores/cases-draft-casefile.store';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from 'src/app/flows/cases/cases-create-casefile/mocks/cases-create-casefile-review-state.mock';
import { ORDER_DETAILS_MOCK } from '../orderDetails/mocks/order-details.mock';
import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import type { Routes } from '@angular/router';
import { mount } from 'cypress/angular';
import { CasesCreateCasefileComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile.component';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import { routing } from 'src/app/flows/cases/cases-create-casefile/routing/cases-create-casefile.routes';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import type { CasesCreateCasefileCaseTypeSelection } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefileTask } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-task.type';
import { COUNTRIES_RESPONSE } from '../mocks/countries.mock';
import { MAJOR_CREDITORS_RESPONSE } from '../centralAuthority/mocks/major-creditors.mock';

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
class CreateCasefileRouterHostComponent {}

const testRoutes = (persistedStore: InstanceType<typeof CasesDraftCasefileStore>): Routes => [
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.root,
    component: CasesCreateCasefileComponent,
    providers: [{ provide: CasesDraftCasefileStore, useValue: persistedStore }],
    children: routing,
  },
];

interface ICaseDetailsTaskListSetup {
  selection?: CasesCreateCasefileCaseTypeSelection | null;
  providedTasks?: CasesCreateCasefileTask[];
  initialChildPath?: string;
  completeReview?: boolean;
  amendment?: ICasesDraftCasefileResolved;
}

export type CasesCreateCasefileStoreInstance = InstanceType<typeof CasesCreateCasefileStore>;

export const setupCaseDetailsTaskList = ({
  selection = {
    caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
    applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
  },
  providedTasks = [],
  completeReview = false,
  amendment,
  initialChildPath = CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
}: ICaseDetailsTaskListSetup = {}) => {
  cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', {
    body: amendment
      ? { refData: structuredClone(amendment.references.applications) }
      : structuredClone(ORDER_DETAILS_MOCK.response),
  });
  cy.intercept('GET', '**/opal-maintenance-service/countries?active=true', {
    statusCode: 200,
    body: amendment ? { refData: structuredClone(amendment.references.countries) } : COUNTRIES_RESPONSE,
  }).as('getCountries');
  cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', {
    statusCode: 200,
    body: amendment ? { refData: structuredClone(amendment.references.majorCreditors) } : MAJOR_CREDITORS_RESPONSE,
  }).as('getMajorCreditors');
  const store = new CasesCreateCasefileStore();
  if (completeReview) {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      ...createCasesCreateCasefileReviewState(),
      stateChanges: true,
    });
  }
  if (selection) {
    store.setCaseTypeSelection(selection);
  }
  const persistedStore = new CasesDraftCasefileStore();
  const globalStore = new GlobalStore();
  if (amendment) {
    globalStore.setAuthenticated(true);
    globalStore.setFeatureFlags({ 'release-1c-rm-create-case-files': true });
    globalStore.setUserState(reviewUser('inputter'));
    persistedStore.loadResolved(structuredClone(amendment));
    store.hydratePersistedCasefile({ ...structuredClone(amendment.state), submissionIntent: 'amendment' });
  }
  providedTasks.forEach((task) => store.setTaskStatus(task, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED));

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');

    return mount(CreateCasefileRouterHostComponent, {
      providers: [
        provideRouter(testRoutes(persistedStore)),
        provideHttpClient(),
        { provide: GlobalStore, useValue: globalStore },
        { provide: CasesCreateCasefileStore, useValue: store },
      ],
    }).then(() => {
      const router = TestBed.inject(Router);
      const initialUrl = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + initialChildPath;

      cy.wrap(store).as('casesCreateCasefileStore');
      cy.wrap(persistedStore).as('persistedCasefileStore');
      cy.wrap(router).as('angularRouter');
      return cy.wrap(router.navigateByUrl(initialUrl));
    });
  });
};
