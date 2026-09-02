import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import type { Routes } from '@angular/router';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { mount } from 'cypress/angular';
import { CasesCreateCasefileComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile.component';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileInterestIndexation } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-interest-indexation.interface';
import { routing } from 'src/app/flows/cases/cases-create-casefile/routing/cases-create-casefile.routes';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class CreateCasefileRouterHostComponent {}

@Component({ template: '<p>External destination</p>' })
class ExternalDestinationComponent {}

export const externalDestinationPath = '/external-destination';

const testRoutes: Routes = [
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.root,
    component: CasesCreateCasefileComponent,
    children: routing,
    canDeactivate: [canDeactivateGuard],
  },
  { path: externalDestinationPath.slice(1), component: ExternalDestinationComponent },
];

export type CasesCreateCasefileStoreInstance = InstanceType<typeof CasesCreateCasefileStore>;

export const setupInterestAndIndexation = (
  savedInterestAndIndexation: ICasesCreateCasefileInterestIndexation | null = null,
) => {
  const store = new CasesCreateCasefileStore();
  store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
  store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  store.setTaskStatus('applicant', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  store.setTaskStatus('orderDetails', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  if (savedInterestAndIndexation) {
    store.setInterestAndIndexation(savedInterestAndIndexation);
  }

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');

    return mount(CreateCasefileRouterHostComponent, {
      providers: [provideRouter(testRoutes), { provide: CasesCreateCasefileStore, useValue: store }],
    }).then(() => {
      const router = TestBed.inject(Router);
      const initialUrl =
        '/' +
        CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
        '/' +
        CASES_CREATE_CASEFILE_ROUTING_PATHS.children.interestAndIndexation;

      cy.wrap(store).as('casesCreateCasefileStore');
      cy.wrap(router).as('angularRouter');
      return cy.wrap(router.navigateByUrl(initialUrl));
    });
  });
};
