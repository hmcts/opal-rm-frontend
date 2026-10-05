import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router, UrlTree } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { BehaviorSubject, defer, of, throwError } from 'rxjs';
import { mount } from 'cypress/angular';
import { CasesDraftCreateAndManageTabsComponent } from 'src/app/flows/cases/cases-draft/cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-tabs.component';
import { OpalMaintenanceService } from 'src/app/flows/cases/services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import type { CasesDraftTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import { defaultCasesDraftNavigation } from 'src/app/flows/cases/cases-draft/utils/cases-draft-navigation';
import { dashboardFixtures } from '../mocks/dashboard.mock';

interface IDashboardSetupOptions {
  tab?: CasesDraftTab;
  rows?: IOpalMaintenanceDraftCasefileSummary[];
  listError?: boolean;
  badgeError?: boolean;
  rejectedCount?: number;
}
export function setupInputterDashboard(options: IDashboardSetupOptions = {}) {
  const selection = defaultCasesDraftNavigation(options.tab);
  const fragment = new BehaviorSubject<string | null>(selection.tab);
  const query = new BehaviorSubject(
    convertToParamMap({ page: String(selection.page), sort: selection.sort, direction: selection.direction }),
  );
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
  const rows = structuredClone(options.rows ?? dashboardFixtures.review26);
  const error = new HttpErrorResponse({ status: 500, error: { operation_id: 'SYNTHETIC-REFERENCE' } });
  const listRequest = cy
    .stub()
    .callsFake(() =>
      defer(() =>
        options.listError ? throwError(() => error) : of({ count: rows.length, summaries: structuredClone(rows) }),
      ),
    )
    .as('listRequest');
  const countRequest = cy
    .stub()
    .callsFake(() =>
      defer(() => (options.badgeError ? throwError(() => error) : of({ count: options.rejectedCount ?? 3 }))),
    )
    .as('countRequest');
  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');
    document.querySelector('[data-cy-root]')?.classList.add('govuk-width-container');
    return mount(CasesDraftCreateAndManageTabsComponent, {
      providers: [
        provideRouter([]),
        {
          provide: GlobalStore,
          useValue: {
            authenticated: signal(true),
            userState: signal(user),
            featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
          },
        },
        {
          provide: OpalMaintenanceService,
          useValue: { getDraftCasefiles: listRequest, getRejectedDraftCasefileCount: countRequest },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            fragment: fragment.asObservable(),
            queryParamMap: query.asObservable(),
            snapshot: { fragment: selection.tab, queryParamMap: query.value },
          },
        },
      ],
    }).then(({ fixture }) => {
      const router = TestBed.inject(Router);
      cy.stub(router, 'navigateByUrl')
        .callsFake((url: string | UrlTree) => {
          const tree = typeof url === 'string' ? router.parseUrl(url) : url;
          if (router.serializeUrl(tree).startsWith('/cases/draft/create-and-manage/tabs')) {
            query.next(tree.queryParamMap);
            fragment.next(tree.fragment);
          }
          return Promise.resolve(true);
        })
        .as('routerNavigate');
      cy.wrap(fixture.componentInstance, { log: false }).as('dashboard');
      fixture.detectChanges();
    });
  });
}

// Chrome's native character event is required for button activation; cy.press Enter omits it in this runtime.
export const pressDashboardEnter = () =>
  cy.then(async () => {
    if (Cypress.browser.family !== 'chromium')
      throw new Error(
        'Dashboard native Enter proof requires Chromium; Cypress cy.press does not support Firefox. Run the repository-supported --browser chrome command.',
      );
    await Cypress.automation('remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: {
        type: 'keyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        nativeVirtualKeyCode: 13,
        text: '\r',
        unmodifiedText: '\r',
      },
    });
    await Cypress.automation('remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 },
    });
  });
