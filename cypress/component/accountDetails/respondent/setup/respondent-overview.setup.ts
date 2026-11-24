import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { mount } from 'cypress/angular';
import type { RouteHandler } from 'cypress/types/net-stubbing';
import { NEVER, of } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { appConfig } from 'src/app/app.config';
import { PERMISSIONS } from 'src/app/constants/permissions.constant';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from 'src/app/flows/cases/constants/release-1c-rm-create-case-files-feature-flag.constant';
import {
  RESPONDENT_ACCOUNT_DETAILS_FLAG,
  RESPONDENT_ACCOUNT_ROUTE,
} from 'src/app/flows/cases/cases-account-respondent-details/routing/cases-account-respondent-navigation';
import { CASES_DRAFT_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID } from 'src/app/flows/cases/services/opal-maintenance-service/constants/opal-maintenance-business-unit-ids.constant';
import { RESPONDENT_ACCOUNT_HEADER_MOCK } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-respondent-account.mock';
import { publishedRespondent } from '../mocks/respondent-overview.mock';

const accountId = RESPONDENT_ACCOUNT_HEADER_MOCK.respondentAccountId;
export const accountPath = `${RESPONDENT_ACCOUNT_ROUTE}/${accountId}`;
export const detailsPath = `${accountPath}/details`;
export const approvedPath = `/${CASES_DRAFT_ROUTING_PATHS.root}/${CASES_DRAFT_ROUTING_PATHS.children.tabs}#approved`;

export function setupRespondentOverview(path = detailsPath, release: boolean | 'unresolved' = true) {
  const globalStore = new GlobalStore();
  const user = structuredClone(OPAL_USER_STATE_MOCK);
  user.status = 'active';
  user.business_unit_users = [
    {
      ...user.business_unit_users[0],
      business_unit_id: OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID,
      business_unit_user_id: publishedRespondent.submitted_by,
      permissions: [
        {
          permission_id: PERMISSIONS['create-and-manage-draft-casefiles'],
          permission_name: 'Create and Manage Draft Casefiles',
        },
      ],
    },
  ];
  globalStore.setUserState(user);
  globalStore.setAuthenticated(true);
  globalStore.setFeatureFlags({
    [RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG]: true,
    ...(release === 'unresolved' ? {} : { [RESPONDENT_ACCOUNT_DETAILS_FLAG]: release }),
  });

  return cy
    .document()
    .then((document) => {
      document.documentElement.lang = 'en';
      document.body.classList.add('govuk-template__body');

      return mount(AppComponent, {
        providers: [
          appConfig.providers[0], // Production route table and router options.
          appConfig.providers[2], // Production browser HTTP and interceptors.
          { provide: GlobalStore, useValue: globalStore },
          { provide: AuthService, useValue: { checkAuthenticated: () => of(true) } },
          { provide: OpalUserService, useValue: { getLoggedInUserState: () => of(user) } },
          { provide: SessionService, useValue: { getTokenExpiry: () => NEVER } },
          { provide: AppInsightsService, useValue: { logException: () => undefined, logPageView: () => undefined } },
          {
            provide: LaunchDarklyService,
            useValue: {
              initializeLaunchDarklyFlags: () => Promise.resolve(),
              initializeLaunchDarklyClient: () => undefined,
              initializeLaunchDarklyChangeListener: () => undefined,
            },
          },
        ],
      });
    })
    .then(({ fixture }) => {
      const router = TestBed.inject(Router);
      return router.navigateByUrl(path).then(() => {
        fixture.detectChanges();
        return router;
      });
    })
    .as('respondentRouter');
}

type AccountRead = 'header-summary' | 'at-a-glance';
const readAliases: Record<AccountRead, string> = {
  'header-summary': 'accountHeader',
  'at-a-glance': 'accountSummary',
};

export function accountReadPath(id: number, read: AccountRead): string {
  return `/opal-maintenance-service/respondent-accounts/${id}/${read}`;
}

export function interceptAccountRead(read: AccountRead, reply: RouteHandler) {
  return cy.intercept({ method: 'GET', pathname: accountReadPath(accountId, read) }, reply).as(readAliases[read]);
}

export function interceptApprovedDashboard(): void {
  const pathname = '/opal-maintenance-service/draft-casefiles';
  const scope = {
    business_unit_id: String(publishedRespondent.business_unit_id),
    submitted_by: publishedRespondent.submitted_by,
  };
  cy.intercept(
    { method: 'GET', pathname, query: { ...scope, casefile_status: 'PUBLISHED' } },
    { statusCode: 200, body: { count: 1, summaries: [publishedRespondent] } },
  ).as('approvedCasefiles');
  cy.intercept(
    { method: 'GET', pathname, query: { ...scope, casefile_status: 'REJECTED', restrict: 'counts' } },
    { statusCode: 200, body: { count: 0 } },
  ).as('rejectedCasefileCount');
}
