import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router, RouterOutlet, UrlTree } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { BehaviorSubject, defer, of, throwError } from 'rxjs';
import { mount } from 'cypress/angular';
import { CasesDraftCreateAndManageTabsComponent } from 'src/app/flows/cases/cases-draft/cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-tabs.component';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import type { CasesDraftTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import { defaultCasesDraftNavigation } from 'src/app/flows/cases/cases-draft/utils/cases-draft-navigation';
import { CASES_DRAFT_TABS } from 'src/app/flows/cases/cases-draft/constants/cases-draft-tabs.constant';
import { CASES_DRAFT_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { routing } from 'src/app/flows/cases/cases-draft/routing/cases-draft.routes';
import { populatedReflowFixtures } from '../mocks/dashboard.mock';

interface IDashboardSetupOptions {
  tab?: CasesDraftTab;
  rows?: IOpalMaintenanceDraftCasefileSummary[];
  listError?: boolean;
  countError?: boolean;
  rejectedCount?: number | null;
}

@Component({ template: '<router-outlet />', imports: [RouterOutlet] })
class InputterRouteHost {}

function dashboardBoundary(options: IDashboardSetupOptions) {
  const selection = defaultCasesDraftNavigation(options.tab);
  const user = structuredClone(OPAL_USER_STATE_MOCK);
  user.user_id = 100;
  user.status = 'active';
  user.business_unit_users = [
    {
      business_unit_id: 44,
      business_unit_user_id: 'BUU-SYNTHETIC',
      permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
    },
  ];
  const identity = { userId: 100, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' };
  const rows = structuredClone(options.rows ?? populatedReflowFixtures[selection.tab]);
  const listRequest = cy
    .stub()
    .callsFake((params: { casefile_status: string }) =>
      defer(() => {
        if (options.listError) return throwError(() => new Error('Synthetic decoding failure'));
        const tab = (Object.keys(CASES_DRAFT_TABS) as CasesDraftTab[]).find(
          (value) => CASES_DRAFT_TABS[value].statuses === params.casefile_status,
        )!;
        const result = tab === selection.tab ? rows : populatedReflowFixtures[tab];
        return of({ count: result.length, summaries: structuredClone(result) });
      }),
    )
    .as('listRequest');
  const countRequest = cy
    .stub()
    .as('countRequest')
    .returns(
      options.countError
        ? throwError(() => new Error('Synthetic count decoding failure'))
        : of({ count: options.rejectedCount ?? 3 }),
    );
  const setBannerError = cy.stub().as('globalBannerError');
  return {
    selection,
    resolved: {
      draftCasefiles: { identity, tab: selection.tab, response: { count: rows.length, summaries: rows } },
      rejectedCount:
        selection.tab === 'rejected' ? null : options.rejectedCount === undefined ? 3 : options.rejectedCount,
    },
    globalStore: {
      authenticated: signal(true),
      userState: signal(user),
      featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
      setBannerError,
    },
    api: { getDraftCasefiles: listRequest, getRejectedDraftCasefileCount: countRequest },
  };
}

function prepareDocument(document: Document): void {
  document.documentElement.lang = 'en';
  document.body.classList.add('govuk-template__body');
  document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
  document.querySelector('[data-cy-root]')?.classList.add('govuk-width-container');
}

/** Mounts representative resolved initial data; the real service handles later tab consultations. */
export function setupInputterDashboard(options: IDashboardSetupOptions = {}) {
  const boundary = dashboardBoundary(options);
  const fragment = new BehaviorSubject<string | null>(boundary.selection.tab);
  const query = new BehaviorSubject(
    convertToParamMap({
      page: String(boundary.selection.page),
      sort: boundary.selection.sort,
      direction: boundary.selection.direction,
    }),
  );
  return cy.document().then((document) => {
    prepareDocument(document);
    return mount(CasesDraftCreateAndManageTabsComponent, {
      providers: [
        provideRouter([]),
        { provide: GlobalStore, useValue: boundary.globalStore },
        { provide: OpalMaintenanceService, useValue: boundary.api },
        {
          provide: ActivatedRoute,
          useValue: {
            fragment: fragment.asObservable(),
            queryParamMap: query.asObservable(),
            data: of(boundary.resolved),
            snapshot: { fragment: boundary.selection.tab, queryParamMap: query.value, data: boundary.resolved },
          },
        },
      ],
    }).then(({ fixture }) => {
      const router = TestBed.inject(Router);
      cy.stub(router, 'navigateByUrl')
        .callsFake((url: string | UrlTree) => {
          const tree = typeof url === 'string' ? router.parseUrl(url) : url;
          if (
            router
              .serializeUrl(tree)
              .startsWith('/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.tabs)
          ) {
            query.next(tree.queryParamMap);
            fragment.next(tree.fragment);
          }
          return Promise.resolve(true);
        })
        .as('routerNavigate');
      cy.wrap(fixture.componentInstance, { log: false }).as('dashboard');
      cy.wrap(boundary.globalStore, { log: false }).as('dashboardGlobalStore');
      fixture.detectChanges();
    });
  });
}

/** Runs production tab/count resolvers through a real router before rendering the dashboard. */
export function setupResolvedInputterDashboard(options: IDashboardSetupOptions = {}) {
  const boundary = dashboardBoundary(options);
  return cy.document().then((document) => {
    prepareDocument(document);
    return mount(InputterRouteHost, {
      providers: [
        provideRouter([{ path: CASES_DRAFT_ROUTING_PATHS.root, children: routing }]),
        { provide: GlobalStore, useValue: boundary.globalStore },
        { provide: OpalMaintenanceService, useValue: boundary.api },
      ],
    }).then(({ fixture }) => {
      const router = TestBed.inject(Router);
      return router
        .navigateByUrl(
          '/' +
            CASES_DRAFT_ROUTING_PATHS.root +
            '/' +
            CASES_DRAFT_ROUTING_PATHS.children.tabs +
            '#' +
            boundary.selection.tab,
        )
        .then(() => {
          fixture.detectChanges();
        });
    });
  });
}
