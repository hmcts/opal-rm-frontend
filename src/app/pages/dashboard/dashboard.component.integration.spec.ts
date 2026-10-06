import { DashboardComponent } from './dashboard.component';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { signal } from '@angular/core';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CASES_CREATE_CASEFILE_DASHBOARD_LINKS } from '../../flows/cases/cases-create-casefile/constants/cases-create-casefile-dashboard-links.constant';
import { CASES_PERMISSIONS } from '../../flows/cases/constants/cases-permissions.constant';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardPage } from '@hmcts/opal-frontend-common/pages/dashboard-page';
import { IDashboardPageConfiguration } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';
import { PermissionsService } from '@hmcts/opal-frontend-common/services/permissions-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';

const DASHBOARD_CONFIG: IDashboardPageConfiguration = {
  title: 'Dashboard Integration Test',
  highlights: [
    {
      id: 'allowed-highlight-link',
      text: 'Allowed highlight link',
      routerLink: ['/'],
      fragment: 'review',
      permissionIds: [101],
      newTab: true,
      style: 'guidance-panel-blue',
    },
    {
      id: 'blocked-highlight-link',
      text: 'Blocked highlight link',
      routerLink: ['/'],
      fragment: null,
      permissionIds: [202],
      newTab: false,
      style: '',
    },
  ],
  groups: [
    {
      id: 'integration-group',
      title: 'Integration Group',
      links: [
        {
          id: 'allowed-group-link',
          text: 'Allowed group link',
          routerLink: ['/'],
          fragment: 'summary',
          permissionIds: [101],
          newTab: false,
          style: '',
        },
        {
          id: 'blocked-group-link',
          text: 'Blocked group link',
          routerLink: ['/'],
          fragment: null,
          permissionIds: [202],
          newTab: false,
          style: '',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-dashboard-page-host',
  standalone: true,
  imports: [DashboardPage],
  template: '<opal-lib-dashboard-page [dashboardConfig]="dashboardConfig" />',
})
class DashboardPageHostComponent {
  public dashboardConfig = structuredClone(DASHBOARD_CONFIG);
}

describe('DashboardPage integration', () => {
  let fixture: ComponentFixture<DashboardPageHostComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let permissionsServiceMock: any;

  beforeEach(async () => {
    permissionsServiceMock = createSpyObj('PermissionsService', ['getUniquePermissions']);

    await TestBed.configureTestingModule({
      imports: [DashboardPageHostComponent],
      providers: [
        provideRouter([]),
        { provide: PermissionsService, useValue: permissionsServiceMock },
        { provide: GlobalStore, useValue: { userState: () => null } },
      ],
    }).compileComponents();
  });

  it('keeps the Cases entry ID, permission and same-tab attributes while linking to In review', () => {
    permissionsServiceMock.getUniquePermissions.mockReturnValue(CASES_PERMISSIONS);
    fixture = TestBed.createComponent(DashboardPageHostComponent);
    fixture.componentInstance.dashboardConfig.groups = [
      { id: 'cases', title: 'Cases', links: CASES_CREATE_CASEFILE_DASHBOARD_LINKS },
    ];
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('#casesCreateCasefileLink') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Create cases');
    expect(link.getAttribute('href')).toBe('/cases/draft/create-and-manage/tabs#in-review');
    expect(link.getAttribute('target')).toBe('_self');
    expect(link.getAttribute('rel')).toBeNull();
  });

  it('should only render links the user has permission to access', () => {
    permissionsServiceMock.getUniquePermissions.mockReturnValue([101]);

    fixture = TestBed.createComponent(DashboardPageHostComponent);
    fixture.detectChanges();

    const renderedText = fixture.nativeElement.textContent as string;

    expect(renderedText).toContain('Allowed highlight link');
    expect(renderedText).toContain('Allowed group link');
    expect(renderedText).not.toContain('Blocked highlight link');
    expect(renderedText).not.toContain('Blocked group link');
    expect(permissionsServiceMock.getUniquePermissions).toHaveBeenCalled();
  });

  it('should render new-tab and fragment link attributes from config', () => {
    permissionsServiceMock.getUniquePermissions.mockReturnValue([101]);

    fixture = TestBed.createComponent(DashboardPageHostComponent);
    fixture.detectChanges();

    const newTabLink = fixture.nativeElement.querySelector('#allowed-highlight-link') as HTMLAnchorElement;
    const normalLink = fixture.nativeElement.querySelector('#allowed-group-link') as HTMLAnchorElement;

    expect(newTabLink).toBeTruthy();
    expect(newTabLink.getAttribute('target')).toBe('_blank');
    expect(newTabLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(newTabLink.getAttribute('href')).toContain('#review');

    expect(normalLink).toBeTruthy();
    expect(normalLink.getAttribute('target')).toBe('_self');
    expect(normalLink.getAttribute('rel')).toBeNull();
    expect(normalLink.getAttribute('href')).toContain('#summary');
  });

  it('should not render highlight or group sections when no permissions are available', () => {
    permissionsServiceMock.getUniquePermissions.mockReturnValue([]);

    fixture = TestBed.createComponent(DashboardPageHostComponent);
    fixture.detectChanges();

    const renderedText = fixture.nativeElement.textContent as string;
    const sectionHeadings = fixture.nativeElement.querySelectorAll('h2.govuk-heading-m');
    const links = fixture.nativeElement.querySelectorAll('a.govuk-link');

    expect(renderedText).toContain(DASHBOARD_CONFIG.title);
    expect(renderedText).not.toContain('Integration Group');
    expect(sectionHeadings).toHaveLength(0);
    expect(links).toHaveLength(0);
  });
});

describe('production Cases entry identity filtering', () => {
  it.each([{ permissions: [21] }, { permissions: [22] }, { permissions: [21, 22] }, { permissions: [] }])(
    'renders independent entry links for permissions %j',
    async ({ permissions }) => {
      const user = structuredClone(OPAL_USER_STATE_MOCK);
      user.status = 'active';
      user.business_unit_users = [
        {
          business_unit_id: 44,
          business_unit_user_id: 'BUU-SYNTHETIC',
          permissions: permissions.map((id) => ({ permission_id: id, permission_name: 'Synthetic' })),
        },
      ];
      TestBed.configureTestingModule({
        providers: [
          provideRouter([{ path: 'dashboard/:dashboardType', component: DashboardComponent }]),
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: GlobalStore,
            useValue: { userState: signal(user), featureFlags: signal({ 'release-1c-rm-create-case-files': true }) },
          },
        ],
      });
      const harness = await RouterTestingHarness.create('/dashboard/cases');
      const create = harness.routeNativeElement?.querySelector('#casesCreateCasefileLink');
      const review = harness.routeNativeElement?.querySelector('#casesReviewCasefilesLink');
      expect(create !== null).toBe(permissions.includes(21));
      expect(review !== null).toBe(permissions.includes(22));
      if (review) expect(review.getAttribute('href')).toBe('/cases/draft/check-and-validate/tabs#to-review');
    },
  );
});
