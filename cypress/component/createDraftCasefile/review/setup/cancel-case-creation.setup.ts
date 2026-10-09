import { CasesDraftNavigationService } from 'src/app/flows/cases/cases-draft/services/cases-draft-navigation.service';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { mount } from 'cypress/angular';
import { CasesCreateCasefileCancelComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-cancel/cases-create-casefile-cancel.component';
import { createCasesCreateCasefileCancellationState } from 'src/app/flows/cases/cases-create-casefile/mocks/cases-create-casefile-cancellation-state.mock';
import { CasesCreateCasefileReviewNavigationService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-review-navigation.service';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';

export type CancelStore = InstanceType<typeof CasesCreateCasefileStore>;

interface CancelSetupOptions {
  failNavigation?: boolean;
}

export function setupCancellation(options: CancelSetupOptions = {}) {
  const store = new CasesCreateCasefileStore();
  patchState(
    store as unknown as WritableStateSource<ICasesCreateCasefileState>,
    createCasesCreateCasefileCancellationState(),
  );

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');

    return mount(CasesCreateCasefileCancelComponent, {
      providers: [provideRouter([]), { provide: CasesCreateCasefileStore, useValue: store }],
    }).then(({ fixture }) => {
      const reviewNavigation = TestBed.inject(CasesCreateCasefileReviewNavigationService);
      cy.wrap(TestBed.inject(Router).serializeUrl(TestBed.inject(CasesDraftNavigationService).creationReturnUrl())).as(
        'cancelReturnUrl',
      );
      cy.stub(TestBed.inject(Router), 'navigateByUrl').as('cancelRouterNavigate').resolves(!options.failNavigation);
      cy.spy(store, 'resetStore').as('cancelStoreReset');
      cy.spy(reviewNavigation, 'clearContext').as('cancelReviewContextClear');
      cy.wrap(store, { log: false }).as('cancelStore');
      cy.wrap(reviewNavigation, { log: false }).as('cancelReviewNavigation');
      fixture.detectChanges();
    });
  });
}
