import { persistedReferenceStubs } from '../../review/setup/persisted-references.setup';
import { CasesDraftNavigationService } from 'src/app/flows/cases/cases-draft/services/cases-draft-navigation.service';
import type { ICasesDraftDecisionNotice } from 'src/app/flows/cases/cases-draft/interfaces/cases-draft-decision-notice.interface';
import { createPersistedCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { CasesDraftCheckAndValidateTabsComponent } from 'src/app/flows/cases/cases-draft/cases-draft-check-and-validate-tabs/cases-draft-check-and-validate-tabs.component';
import type { CasesDraftSortColumn } from 'src/app/flows/cases/cases-draft/types/cases-draft-sort-column.type';
import { AppComponent } from 'src/app/app.component';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { Subject, defer, of } from 'rxjs';
import { mount } from 'cypress/angular';
import { routing } from 'src/app/pages/routing/pages.routes';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceDraftCasefileListResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import type {
  CasesDraftCheckerTab,
  CasesDraftOutcomeTab,
} from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import { CASES_DRAFT_CHECKER_TABS } from 'src/app/flows/cases/cases-draft/constants/cases-draft-checker-tabs.constant';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { checkerFixtures, checkerUser } from '../mocks/checker-dashboard.mock';
export interface ICheckerDashboardSetupOptions {
  shell?: boolean;
  decisionNotice?: ICasesDraftDecisionNotice;
  tab?: CasesDraftCheckerTab;
  rows?: IOpalMaintenanceDraftCasefileSummary[];
  role?: 'checker' | 'dual';
  listError?: boolean;
  countError?: CasesDraftOutcomeTab;
  listPending?: boolean;
  rejectedCount?: number;
  failedCount?: number;
  page?: number;
  sort?: string;
  direction?: 'ascending' | 'descending';
  targetUrl?: string;
}
@Component({ template: '<router-outlet />', imports: [RouterOutlet] })
class CheckerRouteHost {}
/** Keeps production routes and guards; shell mounts additionally isolate external session and telemetry clients. */
export function setupCheckerDashboard(options: ICheckerDashboardSetupOptions = {}): Cypress.Chainable<void> {
  if (options.decisionNotice) {
    cy.stub(CasesDraftNavigationService.prototype, 'consumeCheckerDecision')
      .returns(null)
      .onFirstCall()
      .returns(structuredClone(options.decisionNotice));
  }
  const tab = options.tab ?? 'to-review';
  let selectedTab = tab;
  const user = checkerUser(options.role ?? 'checker');
  const bannerError = signal({ error: false, title: '', message: '', operationId: '' });
  const globalStore = {
    authenticated: signal(true),
    userState: signal(user),
    featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
    bannerError,
    tokenExpiry: signal(null),
    setBannerError: cy
      .stub()
      .as('checkerBannerError')
      .callsFake((error: Parameters<typeof bannerError.set>[0]) => bannerError.set(error)),
  };
  const listResponses: { latest: Subject<IOpalMaintenanceDraftCasefileListResponse> | null } = { latest: null };
  const countResponses: Partial<Record<CasesDraftOutcomeTab, Subject<{ count: number }>>> = {};
  const listRequest = cy
    .stub()
    .as('checkerListRequest')
    .callsFake((params: { casefile_status: string }) =>
      defer(() => {
        const selected = (Object.keys(CASES_DRAFT_CHECKER_TABS) as CasesDraftCheckerTab[]).find(
          (t) => CASES_DRAFT_CHECKER_TABS[t].statuses === params.casefile_status,
        )!;
        selectedTab = selected;
        const response = new Subject<IOpalMaintenanceDraftCasefileListResponse>();
        listResponses.latest = response;
        if (options.listPending) return response;
        if (options.listError && listRequest.callCount === 1) {
          response.error(new Error('Synthetic list failure'));
          return response;
        }
        if (options.listError && selected === tab) return response;
        const rows = structuredClone(
          selected === tab ? (options.rows ?? checkerFixtures.queues[selected]) : checkerFixtures.queues[selected],
        );
        return of({ count: rows.length, summaries: rows });
      }),
    );
  const countRequest = cy
    .stub()
    .as('checkerCountRequest')
    .callsFake((params: { casefile_status: string }) =>
      defer(() => {
        const outcome: CasesDraftOutcomeTab = params.casefile_status === 'REJECTED' ? 'rejected' : 'failed';
        const response = new Subject<{ count: number }>();
        countResponses[outcome] = response;
        if (options.countError === outcome) {
          if (
            countRequest.getCalls().filter((call) => call.args[0].casefile_status === params.casefile_status).length ===
            1
          )
            response.error(new Error('Synthetic count failure'));
          return response;
        }
        const count = outcome === 'rejected' ? (options.rejectedCount ?? 3) : (options.failedCount ?? 2);
        return of({ count });
      }),
    );
  const detailRequest = cy
    .stub()
    .as('checkerDetailRequest')
    .callsFake((id: number) => {
      const draft = createPersistedCasefileDetail();
      const selectedRows =
        selectedTab === tab
          ? (options.rows ?? checkerFixtures.queues[selectedTab])
          : checkerFixtures.queues[selectedTab];
      const summary = selectedRows.find((row) => row.draft_casefile_id === id);
      draft.draft_casefile_id = id;
      if (summary) {
        draft.business_unit_id = summary.business_unit_id;
        draft.submitted_by = summary.submitted_by;
        draft.casefile_status = summary.casefile_status;
        draft.casefile_status_date = summary.casefile_status_date;
      }
      return of({ draft, etag: '"0"' });
    });
  const selectedApi: Pick<
    OpalMaintenanceService,
    'getDraftCasefile' | 'getCountries' | 'getMaintenanceApplications' | 'getMajorCreditors' | 'getResult'
  > = {
    getDraftCasefile: detailRequest,
    ...persistedReferenceStubs('checker'),
  };
  cy.wrap(listResponses, { log: false }).as('checkerListResponse');
  cy.wrap(countResponses, { log: false }).as('checkerCountResponses');
  cy.wrap(globalStore, { log: false }).as('checkerGlobalStore');
  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    const root = document.querySelector('[data-cy-root]');
    if (options.shell) {
      root?.removeAttribute('role');
      root?.classList.remove('govuk-width-container');
    } else {
      root?.setAttribute('role', 'main');
      root?.classList.add('govuk-width-container');
    }
    return mount(options.shell ? AppComponent : CheckerRouteHost, {
      providers: [
        provideRouter(options.shell ? routing : routing.filter((route) => route.path === PATHS.root)),
        { provide: GlobalStore, useValue: globalStore },
        { provide: AuthService, useValue: { checkAuthenticated: () => of(true) } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: () => of(user) } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyClient: () => undefined,
            initializeLaunchDarklyFlags: () => Promise.resolve(),
            initializeLaunchDarklyChangeListener: () => undefined,
          },
        },
        { provide: SessionService, useValue: { getTokenExpiry: () => of(null) } },
        { provide: AppInsightsService, useValue: { logPageView: () => undefined } },
        {
          provide: OpalMaintenanceService,
          useValue: { getDraftCasefiles: listRequest, getDraftCasefileCount: countRequest, ...selectedApi },
        },
      ],
    }).then(({ fixture }) => {
      const router = TestBed.inject(Router);
      cy.wrap(router, { log: false }).as('checkerRouter');
      const url = options.targetUrl ?? '/' + PATHS.root + '/' + PATHS.children.tabs + '#' + tab;
      return router.navigateByUrl(url).then(async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        const dashboard = fixture.debugElement.queryAll(
          (element) => element.componentInstance instanceof CasesDraftCheckAndValidateTabsComponent,
        )[0]?.componentInstance as CasesDraftCheckAndValidateTabsComponent | undefined;
        if (
          dashboard &&
          (options.sort !== undefined || options.direction !== undefined || options.page !== undefined)
        ) {
          if (options.sort !== undefined || options.direction !== undefined)
            dashboard.changeSort({
              key: (options.sort ?? CASES_DRAFT_CHECKER_TABS[tab].defaultSort) as CasesDraftSortColumn,
              direction: options.direction ?? 'ascending',
            });
          if (options.page !== undefined) dashboard.changePage(options.page);
          fixture.detectChanges();
        }
      });
    });
  });
}
