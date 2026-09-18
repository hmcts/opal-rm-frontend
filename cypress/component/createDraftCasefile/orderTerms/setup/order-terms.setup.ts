import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { mount } from 'cypress/angular';
import { defer, finalize, Observable, of } from 'rxjs';
import { CasesCreateCasefileComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile.component';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import { routing } from 'src/app/flows/cases/cases-create-casefile/routing/cases-create-casefile.routes';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import type { IOpalMaintenanceResultReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-result-reference-data-response.interface';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import { ORDER_TERMS_MOCK } from '../mocks/order-terms.mock';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class OrderTermsTestHostComponent {}

@Component({ template: '<h1>External destination</h1>' })
class ExternalDestinationComponent {}

export type OrderTermsStore = InstanceType<typeof CasesCreateCasefileStore>;

interface IOrderTermsSetup {
  source?: Observable<IOpalMaintenanceResultReferenceDataResponse>;
  savedId?: string | null;
  initialChild?: string;
}

export function setupOrderTerms({
  source,
  savedId = null,
  initialChild = PATHS.children.orderTermsSelect,
}: IOrderTermsSetup = {}) {
  const store = new CasesCreateCasefileStore();
  store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
  store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  store.setTaskStatus('applicant', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  store.setTaskStatus('orderDetails', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  store.setPendingOrderTermResultId(savedId);
  const disposed = cy.spy().as('resultsDisposed');
  const getResults = cy
    .stub()
    .callsFake(() => (source ?? defer(() => of(structuredClone(ORDER_TERMS_MOCK.response)))).pipe(finalize(disposed)))
    .as('getResults');

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
    return mount(OrderTermsTestHostComponent, {
      providers: [
        provideRouter([
          {
            path: PATHS.root,
            component: CasesCreateCasefileComponent,
            canDeactivate: [canDeactivateGuard],
            children: routing,
          },
          { path: 'order-terms-test-external', component: ExternalDestinationComponent },
        ]),
        { provide: CasesCreateCasefileStore, useValue: store },
        { provide: OpalMaintenanceService, useValue: { getResults } },
      ],
    }).then(() => {
      const router = TestBed.inject(Router);
      cy.wrap(store).as('casesCreateCasefileStore');
      cy.wrap(router).as('angularRouter');
      return cy.wrap(router.navigateByUrl('/' + PATHS.root + '/' + initialChild)).then(() => {
        const owner = router.routerState.snapshot.root.firstChild?.firstChild?.data['orderTerms'];
        if (owner) cy.wrap(owner).as('orderTermsOwner');
      });
    });
  });
}
