import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import type { Observable } from 'rxjs';
import type { IOpalMaintenanceCasefileSubmissionResult } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-casefile-submission-result.interface';
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
  submission?: Observable<IOpalMaintenanceCasefileSubmissionResult>;
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
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: CasesCreateCasefileStore, useValue: store },
          ...(options.confirmation
            ? []
            : [
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
              ]),
        ],
      },
    ).then(({ fixture }) => {
      cy.stub(TestBed.inject(Router), 'navigateByUrl').as('routerNavigate').resolves(!options.failNavigation);
      if (options.submission) {
        cy.stub(TestBed.inject(OpalMaintenanceService), 'submitCasefile').as('submitMock').returns(options.submission);
      } else {
        cy.spy(TestBed.inject(OpalMaintenanceService), 'submitCasefile').as('submitMock');
      }
      cy.wrap(store, { log: false }).as('reviewStore');
      cy.wrap(TestBed.inject(CasesCreateCasefileReviewNavigationService), { log: false }).as('reviewNavigation');
      fixture.detectChanges();
    });
  });
}
