import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { CasesDraftCreateAndManageTabsComponent } from '../../cases-draft/cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-tabs.component';
import { CasesDraftNavigationService } from '../../cases-draft/services/cases-draft-navigation.service';
import { CASES_DRAFT_ROUTING_PATHS } from '../../cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { createCasesDraftSummary } from '../../cases-draft/mocks/cases-draft-summary.mock';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By, Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileComponent } from '../cases-create-casefile.component';
import { CasesCreateCasefileCaseTypeComponent } from '../cases-create-casefile-case-type/cases-create-casefile-case-type.component';
import { CasesCreateCasefileCaseTypeFormComponent } from '../cases-create-casefile-case-type/cases-create-casefile-case-type-form/cases-create-casefile-case-type-form.component';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { routing } from './cases-create-casefile.routes';

@Component({ template: '<h1>Outside journey</h1>' })
class OutsideComponent {}

/** Retains production child components, guards and the parent departure/destruction lifecycle. */
describe('Cancellation route lifecycle', () => {
  const dashboardPath = '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.tabs;
  beforeEach(() => {
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.status = 'active';
    user.business_unit_users = [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-SYNTHETIC',
        permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
      },
    ];
    const children = routing.map((route) => ({
      ...route,
      resolve: route.path === 'cancel' ? route.resolve : {},
      data: {
        ...route.data,
        countries: { refData: [{ country_id: 1, country_name: 'United Kingdom', active: true }] },
        applications: { refData: [{ application_id: 901, application_title: 'Synthetic application', active: true }] },
      },
    }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideLocationMocks(),
        {
          provide: GlobalStore,
          useValue: {
            authenticated: signal(true),
            userState: signal(user),
            featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
          },
        },
        provideRouter([
          {
            path: 'cases/create-casefile',
            component: CasesCreateCasefileComponent,
            canDeactivate: [canDeactivateGuard],
            children,
          },
          { path: dashboardPath.slice(1), component: CasesDraftCreateAndManageTabsComponent },
          { path: 'outside', component: OutsideComponent },
        ]),
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });

  function flushDashboard(rejected = false): void {
    const http = TestBed.inject(HttpTestingController);
    if (!rejected) http.expectOne((request) => request.params.get('restrict') === 'counts').flush({ count: 0 });
    http
      .expectOne((request) => request.params.get('restrict') !== 'counts' && request.url.endsWith('/draft-casefiles'))
      .flush({
        count: rejected ? 26 : 0,
        summaries: rejected
          ? Array.from({ length: 26 }, (_, index) =>
              createCasesDraftSummary({ draft_casefile_id: index + 1, casefile_status: 'REJECTED' }),
            )
          : [],
      });
  }

  function seedReview(): void {
    patchState(
      TestBed.inject(CasesCreateCasefileStore) as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
  }

  async function click(harness: RouterTestingHarness, selector: string): Promise<void> {
    const action = harness.routeNativeElement!.querySelector<HTMLElement>(selector);
    expect(action).not.toBeNull();
    action!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  it('preserves every case field through review, cancellation and Go back without a departure prompt', async () => {
    seedReview();
    const store = TestBed.inject(CasesCreateCasefileStore);
    const before = structuredClone(getState(store));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
    await click(harness, '#create_casefile_review_cancel a');
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/cancel');
    expect(TestBed.inject(Title).getTitle()).toBe('OPAL - Cancel case creation');
    expect(document.activeElement?.id).toBe('create_casefile_cancel_heading');
    expect(getState(store)).toEqual(before);
    await click(harness, '#create_casefile_cancel_back a');
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/check-case-details');
    expect(getState(store)).toEqual(before);
    expect(document.activeElement?.id).toBe('review-heading');
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([false, true])('discards and reloads the originating or default dashboard (origin: %s)', async (origin) => {
    seedReview();
    const store = TestBed.inject(CasesCreateCasefileStore);
    const context = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    const navigation = TestBed.inject(CasesDraftNavigationService);
    if (origin) {
      navigation.setSelection({ tab: 'rejected', page: 2, sort: 'created', direction: 'descending' });
      navigation.rememberCreateOrigin();
    }
    const destination = TestBed.inject(Router).serializeUrl(navigation.creationReturnUrl());
    const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
    await click(harness, '#create_casefile_review_cancel a');
    context.setContext({ origin: 'review', section: 'commentsAndNotes' });
    expect(context.context()).toEqual({ origin: 'review', section: 'commentsAndNotes' });
    await click(harness, '#create_casefile_cancel_confirm');
    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
    expect(context.context()).toBeNull();
    expect(TestBed.inject(Router).url).toBe(destination);
    expect(document.activeElement?.id).toBe('cases-draft-heading');
    flushDashboard(origin);
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(navigation.selection()).toEqual(
      origin
        ? { tab: 'rejected', page: 2, sort: 'created', direction: 'descending' }
        : { tab: 'in-review', page: 1, sort: 'created', direction: 'ascending' },
    );
    harness.routeNativeElement!.querySelector<HTMLElement>('#cases-draft-create')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    // Outlet activation creates the form during this render; wait for its afterNextRender focus.
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
    const parent = harness.fixture.debugElement.query(By.directive(CasesCreateCasefileCaseTypeComponent))
      .componentInstance as CasesCreateCasefileCaseTypeComponent;
    const form = harness.fixture.debugElement.query(By.directive(CasesCreateCasefileCaseTypeFormComponent))
      .componentInstance as CasesCreateCasefileCaseTypeFormComponent;
    expect(parent.focusHeadingOnArrival).toBe(true);
    expect(form.focusHeading).toBe(true);
    expect(document.activeElement?.id).toBe('create_casefile_case_type_heading');
    expect(harness.routeNativeElement!.querySelector('input[type="radio"]:checked')).toBeNull();
    expect(form.caseTypeControl.value).toBeNull();
    expect(form.applicantTypeControl.value).toBeNull();
    expect(navigation.selection().tab).toBe(origin ? 'rejected' : 'in-review');
  });

  it('retains all fields when Case Type cancellation is dismissed and discards on accepted arrival', async () => {
    seedReview();
    const store = TestBed.inject(CasesCreateCasefileStore);
    const before = structuredClone(getState(store));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/case-type');
    await click(harness, 'opal-lib-govuk-cancel-link a');
    expect(confirm).toHaveBeenCalledOnce();
    expect(getState(store)).toEqual(before);
    expect(harness.routeNativeElement!.querySelector('#create_casefile_case_type_cancel_error')).toBeNull();
    confirm.mockReturnValue(true);
    await click(harness, 'opal-lib-govuk-cancel-link a');
    flushDashboard();
    await harness.fixture.whenStable();
    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
    expect(TestBed.inject(Router).url).toContain(dashboardPath);
  });

  it('browser Back redirects discarded review to an empty Case Type', async () => {
    seedReview();
    const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
    await click(harness, '#create_casefile_review_cancel a');
    await click(harness, '#create_casefile_cancel_confirm');
    flushDashboard();
    const router = TestBed.inject(Router);
    router.setUpLocationChangeListener();
    TestBed.inject(Location).historyGo(-2);
    await vi.waitFor(() => expect(router.url).toBe('/cases/create-casefile/case-type'));
    expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
  });

  it('guards empty direct cancellation entry without rendering cancellation or resetting the store', async () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    const reset = vi.spyOn(store, 'resetStore');
    const harness = await RouterTestingHarness.create('/cases/create-casefile/cancel');
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
    expect(harness.routeNativeElement!.querySelector('#create_casefile_cancel_heading')).toBeNull();
    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
    expect(reset).not.toHaveBeenCalled();
  });

  it('returns an incomplete case to the guarded task list without resetting any values', async () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    const before = structuredClone(getState(store));
    const reset = vi.spyOn(store, 'resetStore');
    const harness = await RouterTestingHarness.create('/cases/create-casefile/cancel');
    await click(harness, '#create_casefile_cancel_back a');
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/task-list');
    expect(getState(store)).toEqual(before);
    expect(reset).not.toHaveBeenCalled();
  });

  it('retains the entire case when departure from cancellation is dismissed', async () => {
    seedReview();
    const store = TestBed.inject(CasesCreateCasefileStore);
    const before = structuredClone(getState(store));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/cancel');
    await harness.navigateByUrl('/outside');
    expect(confirm).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/cancel');
    expect(getState(store)).toEqual(before);
  });

  it('clears the entire case and review context when confirmed departure destroys the parent', async () => {
    seedReview();
    const context = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    context.setContext({ origin: 'review', section: 'commentsAndNotes' });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/cancel');
    await harness.navigateByUrl('/outside');
    expect(confirm).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).url).toBe('/outside');
    expect(harness.routeNativeElement!.textContent).toContain('Outside journey');
    expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
    expect(context.context()).toBeNull();
  });

  it('protects reload before discard and allows it afterwards without the check changing state', async () => {
    seedReview();
    const store = TestBed.inject(CasesCreateCasefileStore);
    const before = structuredClone(getState(store));
    const harness = await RouterTestingHarness.create('/cases/create-casefile/cancel');
    const parent = harness.fixture.debugElement.query(By.directive(CasesCreateCasefileComponent))
      .componentInstance as CasesCreateCasefileComponent;
    expect(parent.handleBeforeUnload()).toBe(false);
    expect(getState(store)).toEqual(before);
    await click(harness, '#create_casefile_cancel_confirm');
    flushDashboard();
    expect(parent.handleBeforeUnload()).toBe(true);
    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
  });

  it('guards stale review and cancellation URLs after discard without restoring the case', async () => {
    seedReview();
    const harness = await RouterTestingHarness.create('/cases/create-casefile/cancel');
    await click(harness, '#create_casefile_cancel_confirm');
    flushDashboard();
    for (const path of ['check-case-details', 'cancel']) {
      await harness.navigateByUrl('/cases/create-casefile/' + path);
      expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
      expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
      expect(harness.routeNativeElement!.querySelector('#create_casefile_case_type_heading')).not.toBeNull();
    }
  });
});
