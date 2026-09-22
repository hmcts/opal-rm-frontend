import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { mount } from 'cypress/angular';
import { Subject } from 'rxjs';
import { CasesCreateCasefileCheckDetailsComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-check-details/cases-create-casefile-check-details.component';
import { CasesCreateCasefileSubmissionConfirmationComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-submission-confirmation/cases-create-casefile-submission-confirmation.component';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import { CasesCreateCasefileSubmissionGateway } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-submission-gateway.service';
import { CasesCreateCasefileSubmissionService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-submission.service';
import { CasesCreateCasefileAuthorityService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-authority.service';
import { CasesCreateCasefileReviewNavigationService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-review-navigation.service';
import { CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN } from 'src/app/flows/cases/cases-create-casefile/tokens/cases-create-casefile-mock-enabled.token';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import type { CasesCreateCasefileSubmissionOutcome } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-submission-outcome.type';
import { createCompleteReviewState, REVIEW_APPLICATIONS, REVIEW_COUNTRIES } from '../mocks/review.mock';

export type ReviewStore = InstanceType<typeof CasesCreateCasefileStore>;
interface ReviewSetupOptions {
  state?: Partial<ICasesCreateCasefileState>;
  authorised?: boolean;
  staleReferences?: boolean;
  failNavigation?: boolean;
  receipt?: boolean;
}

export function setupReview(options: ReviewSetupOptions = {}) {
  const store = new CasesCreateCasefileStore();
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    ...createCompleteReviewState(),
    ...structuredClone(options.state ?? {}),
  });
  const outcomes = new Subject<CasesCreateCasefileSubmissionOutcome>();
  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
    return mount<CasesCreateCasefileSubmissionConfirmationComponent | CasesCreateCasefileCheckDetailsComponent>(
      options.receipt ? CasesCreateCasefileSubmissionConfirmationComponent : CasesCreateCasefileCheckDetailsComponent,
      {
        providers: [
          provideRouter([]),
          { provide: CasesCreateCasefileStore, useValue: store },
          { provide: CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN, useValue: true },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                data: {
                  countries: { refData: options.staleReferences ? [] : structuredClone(REVIEW_COUNTRIES) },
                  applications: { refData: structuredClone(REVIEW_APPLICATIONS) },
                },
              },
            },
          },
        ],
      },
    ).then(({ fixture }) => {
      const gateway = TestBed.inject(CasesCreateCasefileSubmissionGateway);
      cy.stub(gateway, 'submit')
        .callsFake(() => outcomes.asObservable())
        .as('gatewaySubmit');
      cy.stub(TestBed.inject(Router), 'navigateByUrl').as('routerNavigate').resolves(!options.failNavigation);
      if (options.authorised === false)
        cy.stub(TestBed.inject(CasesCreateCasefileAuthorityService), 'authorised').returns(false);
      cy.wrap(store, { log: false }).as('reviewStore');
      cy.wrap(outcomes, { log: false }).as('gatewayOutcomes');
      cy.wrap(TestBed.inject(CasesCreateCasefileSubmissionService), { log: false }).as('submission');
      cy.wrap(TestBed.inject(CasesCreateCasefileReviewNavigationService), { log: false }).as('reviewNavigation');
      fixture.detectChanges();
    });
  });
}
