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

const testRoutes: Routes = [
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.root,
    component: CasesCreateCasefileComponent,
    children: routing,
  },
];

interface ICaseDetailsTaskListSetup {
  selection?: CasesCreateCasefileCaseTypeSelection | null;
  providedTasks?: CasesCreateCasefileTask[];
  initialChildPath?: string;
}

export type CasesCreateCasefileStoreInstance = InstanceType<typeof CasesCreateCasefileStore>;

export const setupCaseDetailsTaskList = ({
  selection = {
    caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
    applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
  },
  providedTasks = [],
  initialChildPath = CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
}: ICaseDetailsTaskListSetup = {}) => {
  cy.intercept('GET', '**/opal-maintenance-service/countries?active=true', {
    statusCode: 200,
    body: COUNTRIES_RESPONSE,
  }).as('getCountries');
  cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', {
    statusCode: 200,
    body: MAJOR_CREDITORS_RESPONSE,
  }).as('getMajorCreditors');
  const store = new CasesCreateCasefileStore();
  if (selection) {
    store.setCaseTypeSelection(selection);
  }
  providedTasks.forEach((task) => store.setTaskStatus(task, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED));

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');

    return mount(CreateCasefileRouterHostComponent, {
      providers: [
        provideRouter(testRoutes),
        provideHttpClient(),
        { provide: CasesCreateCasefileStore, useValue: store },
      ],
    }).then(() => {
      const router = TestBed.inject(Router);
      const initialUrl = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + initialChildPath;

      cy.wrap(store).as('casesCreateCasefileStore');
      cy.wrap(router).as('angularRouter');
      return cy.wrap(router.navigateByUrl(initialUrl));
    });
  });
};
