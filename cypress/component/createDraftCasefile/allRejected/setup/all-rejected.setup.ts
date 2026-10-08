import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
} from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
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
  if (options.failure) {
    listRequest.onFirstCall().returns(throwError(() => new Error('Synthetic decoding failure')));
  }
  if (options.pending) listRequest.onFirstCall().returns(pending.asObservable());
  const detailRequest = cy
    .stub()
    .as('allRejectedDetailRequest')
    .callsFake((id: number) => {
      const draft = createPersistedCasefileDetail();
      const summary = rows.find((row) => row.draft_casefile_id === id);
      draft.draft_casefile_id = id;
      draft.business_unit_id = F.identity.businessUnitId;
      draft.submitted_by = F.identity.submittedBy;
      draft.casefile_status = 'REJECTED';
      if (summary) draft.casefile_status_date = summary.casefile_status_date;
      return of({ draft, etag: '"0"' });
    });
  const selectedApi: Pick<
    OpalMaintenanceService,
    'getDraftCasefile' | 'getCountries' | 'getMaintenanceApplications' | 'getMajorCreditors' | 'getResult'
  > = {
    getDraftCasefile: detailRequest,
    getCountries: cy
      .stub()
      .as('allRejectedCountriesRequest')
      .returns(
        of({
          count: PERSISTED_CASEFILE_REFERENCES.countries.length,
          refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.countries),
        }),
      ),
    getMaintenanceApplications: cy
      .stub()
      .as('allRejectedApplicationsRequest')
      .returns(
        of({
          count: PERSISTED_CASEFILE_REFERENCES.applications.length,
          refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.applications),
        }),
      ),
    getMajorCreditors: cy
      .stub()
      .as('allRejectedMajorCreditorsRequest')
      .returns(
        of({
          count: PERSISTED_CASEFILE_REFERENCES.majorCreditors.length,
          refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.majorCreditors),
        }),
      ),
    getResult: cy
      .stub()
      .as('allRejectedResultRequest')
      .returns(of(structuredClone(PERSISTED_CASEFILE_RESULT_DETAIL))),
  };
  return cy.document().then((document) => {
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
              (route.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.root &&
                route.children?.some(
                  (child) =>
                    child.path ===
                      CASES_CREATE_CASEFILE_ROUTING_PATHS.children.checkCaseDetails + '/:draftCasefileId' ||
                    child.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList + '/:draftCasefileId',
                )),
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
          useValue: { getDraftCasefiles: listRequest, ...selectedApi },
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
      return cy.then(() => {
        const arrival = router.navigateByUrl(
          '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.rejections,
        );
        if (options.pending) {
          void arrival;
          return;
        }
        return options.failure ? arrival.catch(() => false) : arrival;
      });
    });
  });
}
