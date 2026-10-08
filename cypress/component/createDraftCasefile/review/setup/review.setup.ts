import { CasesDraftNavigationService } from 'src/app/flows/cases/cases-draft/services/cases-draft-navigation.service';
import { CASES_DRAFT_DASHBOARD_MODE } from 'src/app/flows/cases/cases-draft/constants/cases-draft-dashboard-mode.token';
import { BehaviorSubject } from 'rxjs';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import type { ICasesDraftCasefileResolved } from 'src/app/flows/cases/cases-draft/interfaces/cases-draft-casefile-resolved.interface';
import { CasesDraftDeletePlaceholderComponent } from 'src/app/flows/cases/cases-draft/cases-draft-delete-placeholder/cases-draft-delete-placeholder.component';
import {
  checkerUser,
  type CheckerRole,
} from '../../../../e2e/functional/opal/mocks/createDraftCasefile/checker-dashboard.mock';
import { CasesDraftCasefileStore } from 'src/app/flows/cases/cases-draft/stores/cases-draft-casefile.store';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, type Data, provideRouter, Router } from '@angular/router';
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
  resolved?: ICasesDraftCasefileResolved;
  user?: IOpalUserState;
  deleteScreen?: boolean;
}

/** Mirrors the user-service response mapping while retaining the shared synthetic role fixture. */
export function reviewUser(role: CheckerRole = 'checker'): IOpalUserState {
  const response = checkerUser(role);
  let status: IOpalUserState['status'] = null;
  if (response.status === 'ACTIVE') status = 'active';
  else if (response.status === 'DEACTIVATED') status = 'deactivated';
  return {
    user_id: response.user_id,
    username: response.username,
    name: response.name,
    version: response.version,
    status,
    business_unit_users: response.domains['maintenance']!.business_unit_users,
  };
}

export function setupReview(options: ReviewSetupOptions = {}) {
  const store = new CasesCreateCasefileStore();
  if (!options.resolved)
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      ...createCompleteReviewState(),
      ...structuredClone(options.state ?? {}),
    });
  const snapshotData: Data = {
    casefileIntent: options.resolved?.intent ?? 'create',
    countries: { refData: structuredClone(REVIEW_COUNTRIES) },
    applications: { refData: structuredClone(REVIEW_APPLICATIONS) },
    ...(options.resolved ? { draftCasefile: structuredClone(options.resolved) } : {}),
  };
  const routeData = new BehaviorSubject<Data>(snapshotData);
  const globalStore = new GlobalStore();
  if (options.resolved) {
    globalStore.setAuthenticated(true);
    globalStore.setFeatureFlags({ 'release-1c-rm-create-case-files': true });
    globalStore.setUserState(structuredClone(options.user ?? reviewUser()));
  }
  const persistedStore = new CasesDraftCasefileStore();
  if (options.confirmation) store.setSubmissionSucceeded(true);
  const reviewComponent = options.confirmation
    ? CasesCreateCasefileSubmissionConfirmationComponent
    : CasesCreateCasefileCheckDetailsComponent;
  const component = options.deleteScreen ? CasesDraftDeletePlaceholderComponent : reviewComponent;
  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
    return mount<
      | CasesCreateCasefileSubmissionConfirmationComponent
      | CasesCreateCasefileCheckDetailsComponent
      | CasesDraftDeletePlaceholderComponent
    >(component, {
      providers: [
        provideRouter([]),
        ...(options.resolved
          ? [
              { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: options.resolved.dashboardMode },
              CasesDraftNavigationService,
            ]
          : []),
        { provide: CasesDraftCasefileStore, useValue: persistedStore },
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        { provide: GlobalStore, useValue: globalStore },
        { provide: AppInsightsService, useValue: { logException: () => undefined } },
        { provide: CasesCreateCasefileStore, useValue: store },
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData,
            snapshot: {
              get data() {
                return routeData.value;
              },
            },
          },
        },
      ],
    }).then(({ fixture }) => {
      cy.stub(TestBed.inject(Router), 'navigateByUrl').as('routerNavigate').resolves(!options.failNavigation);
      cy.wrap(store, { log: false }).as('reviewStore');
      cy.wrap(persistedStore, { log: false }).as('persistedCasefileStore');
      cy.wrap(routeData, { log: false }).as('reviewRouteData');
      cy.wrap(fixture, { log: false }).as('reviewFixture');
      cy.wrap(fixture.nativeElement, { log: false }).as('reviewHost');
      cy.wrap(TestBed.inject(GlobalStore), { log: false }).as('globalStore');
      cy.wrap(TestBed.inject(CasesCreateCasefileReviewNavigationService), { log: false }).as('reviewNavigation');
      fixture.detectChanges();
    });
  });
}
