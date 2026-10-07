import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { mount } from 'cypress/angular';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { routing } from 'src/app/pages/routing/pages.routes';
import { CASES_DRAFT_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { ICasesDraftResubmissionSuccess } from 'src/app/flows/cases/cases-draft/interfaces/cases-draft-resubmission-success.interface';
import { of, Subject, throwError } from 'rxjs';
import { CasesDraftNavigationService } from 'src/app/flows/cases/cases-draft/services/cases-draft-navigation.service';
import type { ICasesDraftAllRejectedSelection } from 'src/app/flows/cases/cases-draft/interfaces/cases-draft-all-rejected-selection.interface';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import type { IOpalMaintenanceDraftCasefileListResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import { CasesDraftSelectors as S } from '../../../../shared/selectors/cases-draft.selectors';
import { allRejectedFixtures as F } from '../mocks/all-rejected.mock';

@Component({ imports: [RouterOutlet], template: '<div class="govuk-grid-row"><router-outlet /></div>' })
class AllRejectedRouterHostComponent {}

interface IAllRejectedSetupOptions {
  rows?: IOpalMaintenanceDraftCasefileSummary[];
  page?: number;
  sort?: ICasesDraftAllRejectedSelection['sort'];
  direction?: ICasesDraftAllRejectedSelection['direction'];
  pending?: boolean;
  failure?: boolean;
  success?: boolean | ICasesDraftResubmissionSuccess;
}
export function setupAllRejected(options: IAllRejectedSetupOptions = {}) {
  const rows = structuredClone(options.rows ?? F.rows());
  const pending = new Subject<IOpalMaintenanceDraftCasefileListResponse>();
  const globalStore = {
    authenticated: signal(true),
    userState: signal(structuredClone(F.user)),
    featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
    setBannerError: cy.stub().as('globalBannerError'),
  };
  const listRequest = cy.stub().as('listRequest');
  listRequest.callsFake((params: { submitted_by?: string }) =>
    of({
      count: rows.length,
      summaries: structuredClone(rows).map((row) =>
        params.submitted_by ? { ...row, submitted_by: params.submitted_by } : row,
      ),
    }),
  );
  if (options.failure || options.pending) {
    listRequest.onFirstCall().returns(throwError(() => new Error('Synthetic decoding failure')));
  }
  if (options.pending) listRequest.onSecondCall().returns(pending.asObservable());
  return cy
    .document()
    .then((document) => {
      document.documentElement.lang = 'en';
      document.body.classList.add('govuk-template__body');
      document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
      document.querySelector('[data-cy-root]')?.classList.add('govuk-width-container');
      return mount(AllRejectedRouterHostComponent, {
        providers: [
          provideRouter(
            routing.filter(
              (route) =>
                route.path === CASES_DRAFT_ROUTING_PATHS.root ||
                (route.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.root && !route.loadComponent),
            ),
          ),
          { provide: AuthService, useValue: { checkAuthenticated: () => of(true) } },
          { provide: OpalUserService, useValue: { getLoggedInUserState: () => of(globalStore.userState()) } },
          {
            provide: LaunchDarklyService,
            useValue: {
              initializeLaunchDarklyFlags: () => Promise.resolve(),
              initializeLaunchDarklyClient: () => undefined,
            },
          },
          { provide: GlobalStore, useValue: globalStore },
          {
            provide: OpalMaintenanceService,
            useValue: { getDraftCasefiles: listRequest },
          },
          {
            provide: CasesDraftNavigationService,
            useFactory: () => {
              const navigation = new CasesDraftNavigationService();
              navigation.setAllRejectedSelection({
                page: options.page ?? 1,
                sort: options.sort ?? 'statusDate',
                direction: options.direction ?? 'ascending',
              });
              if (options.success)
                navigation.recordAllRejectedResubmission(
                  structuredClone(options.success === true ? F.success : options.success),
                );
              return navigation;
            },
          },
        ],
      }).then(() => {
        const navigation = TestBed.inject(CasesDraftNavigationService);
        const router = TestBed.inject(Router);
        cy.spy(router, 'navigateByUrl').as('routerNavigate');
        cy.wrap(router, { log: false }).as('allRejectedRouter');
        cy.wrap(navigation, { log: false }).as('allRejectedNavigation');
        cy.wrap(globalStore, { log: false }).as('allRejectedGlobalStore');
        cy.wrap(pending, { log: false }).as('allRejectedPending');
        return cy.then(() =>
          router.navigateByUrl(
            '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.rejections,
          ),
        );
      });
    })
    .then(() => {
      if (options.pending) cy.get(S.allRejectedRetry).click();
    });
}
