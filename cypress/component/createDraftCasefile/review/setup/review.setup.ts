import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { mount } from 'cypress/angular';
import { CasesCreateCasefileCheckDetailsComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-check-details/cases-create-casefile-check-details.component';
import { CasesCreateCasefileSubmissionConfirmationComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-submission-confirmation/cases-create-casefile-submission-confirmation.component';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import { CasesCreateCasefileReviewNavigationService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-review-navigation.service';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { createCompleteReviewState, REVIEW_APPLICATIONS, REVIEW_COUNTRIES } from '../mocks/review.mock';

export type ReviewStore = InstanceType<typeof CasesCreateCasefileStore>;
interface ReviewSetupOptions {
  state?: Partial<ICasesCreateCasefileState>;
  failNavigation?: boolean;
  confirmation?: boolean;
}

export function setupReview(options: ReviewSetupOptions = {}) {
  const store = new CasesCreateCasefileStore();
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    ...createCompleteReviewState(),
    ...structuredClone(options.state ?? {}),
  });
  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
    return mount<CasesCreateCasefileSubmissionConfirmationComponent | CasesCreateCasefileCheckDetailsComponent>(
      options.confirmation
        ? CasesCreateCasefileSubmissionConfirmationComponent
        : CasesCreateCasefileCheckDetailsComponent,
      {
        providers: [
          provideRouter([]),
          { provide: CasesCreateCasefileStore, useValue: store },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                data: {
                  countries: { refData: structuredClone(REVIEW_COUNTRIES) },
                  applications: { refData: structuredClone(REVIEW_APPLICATIONS) },
                },
              },
            },
          },
        ],
      },
    ).then(({ fixture }) => {
      cy.stub(TestBed.inject(Router), 'navigateByUrl').as('routerNavigate').resolves(!options.failNavigation);
      cy.wrap(store, { log: false }).as('reviewStore');
      cy.wrap(TestBed.inject(CasesCreateCasefileReviewNavigationService), { log: false }).as('reviewNavigation');
      fixture.detectChanges();
    });
  });
}
