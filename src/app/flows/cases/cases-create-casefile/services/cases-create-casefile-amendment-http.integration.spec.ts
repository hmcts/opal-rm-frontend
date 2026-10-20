import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { AppComponent } from '../../../../app.component';
import { appConfig } from '../../../../app.config';
import { routing as pageRoutes } from '../../../../pages/routing/pages.routes';
import { CasesCreateCasefileComponent } from '../cases-create-casefile.component';
import { CasesCreateCasefileRespondentDetailsFormComponent } from '../cases-create-casefile-respondent-details/cases-create-casefile-respondent-details-form/cases-create-casefile-respondent-details-form.component';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { CasesDraftNavigationService } from '../../cases-draft/services/cases-draft-navigation.service';
import { CasesDraftCasefileStore } from '../../cases-draft/stores/cases-draft-casefile.store';
import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
} from '../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';

@Component({ template: '<h1>Existing error destination</h1>' })
class ErrorPageForTest {}

const amendmentUrl = '/cases/create-casefile/task-list/17';
const reviewUrl = '/cases/create-casefile/check-case-details';
const replacementUrl = '/opal-maintenance-service/draft-casefiles/17';

describe('rejected amendment through production HTTP interceptors, guards and application shell', () => {
  let fixture: ComponentFixture<AppComponent>;
  let http: HttpTestingController;
  let router: Router;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  let persisted: InstanceType<typeof CasesDraftCasefileStore>;

  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.user_id = 10606;
    user.status = 'active';
    user.business_unit_users = [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-INPUTTER',
        permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
      },
    ];
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        // This is the actual production HTTP provider, without startup or SSR hydration.
        appConfig.providers[2],
        provideRouter([...pageRoutes, { path: 'error/:kind', component: ErrorPageForTest }]),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: { checkAuthenticated: () => of(true) } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: () => of(user) } },
        { provide: AppInsightsService, useValue: { logException: vi.fn(), logPageView: vi.fn() } },
        { provide: SessionService, useValue: { getTokenExpiry: () => of({ expiry: null }) } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyClient: vi.fn(),
            initializeLaunchDarklyFlags: () => Promise.resolve(),
            initializeLaunchDarklyChangeListener: vi.fn(),
          },
        },
      ],
    });
    const global = TestBed.inject(GlobalStore);
    global.setUserState(user);
    global.setAuthenticated(true);
    global.setFeatureFlags({ 'release-1c-rm-create-case-files': true });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    store = TestBed.inject(CasesCreateCasefileStore);
    fixture = TestBed.createComponent(AppComponent);
  });
  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  async function flushReferences(savedDetails = false): Promise<void> {
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.url === '/opal-maintenance-service/maintenance-applications')
        .flush({ refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.applications) }),
    );
    for (const request of http.match((request) => request.url === '/opal-maintenance-service/countries'))
      request.flush({ refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.countries) });
    for (const request of http.match((request) => request.url === '/opal-maintenance-service/major-creditors'))
      request.flush({ refData: [] });
    if (savedDetails)
      http.expectOne('/opal-maintenance-service/results/TEST01').flush(PERSISTED_CASEFILE_RESULT_DETAIL);
  }
  async function openAmendmentReview(allRejected = false): Promise<void> {
    fixture.detectChanges();
    const arrival = allRejected
      ? TestBed.inject(CasesDraftNavigationService).navigateToPlaceholder('amendment', 17, 'all-rejected')
      : router.navigateByUrl(amendmentUrl);
    await vi.waitFor(() => {
      const draft = createPersistedCasefileDetail();
      draft.casefile_status = 'REJECTED';
      http.expectOne(replacementUrl).flush(draft, { headers: { ETag: '"4"' } });
    });
    await flushReferences(true);
    await arrival;
    await settle();
    persisted = fixture.debugElement
      .query(By.directive(CasesCreateCasefileComponent))
      .injector.get(CasesDraftCasefileStore);
    const respondent = structuredClone(store.respondentDetails()!);
    respondent.firstNames = 'Corrected';
    store.setRespondentDetails(respondent);
    const review = router.navigateByUrl(reviewUrl);
    await flushReferences();
    await review;
    await settle();
  }
  async function dispatchReplacement(): Promise<TestRequest> {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#create_casefile_review_submit')!.click();
    await flushReferences();
    http
      .expectOne((request) => request.url === '/opal-maintenance-service/results')
      .flush({ refData: [{ result_id: 'TEST01', result_title: 'Amount' }] });
    let request!: TestRequest;
    await vi.waitFor(() => {
      request = http.expectOne(replacementUrl);
    });
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('If-Match')).toBe('"4"');
    const body: unknown =
      typeof request.request.body === 'string' ? JSON.parse(request.request.body) : request.request.body;
    expect(Object.keys(body as object).sort()).toEqual(['business_unit_id', 'casefile']);
    return request;
  }
  function expectNoReplay(): void {
    http.expectNone(
      (request) => request.method === 'POST' && request.url === '/opal-maintenance-service/draft-casefiles',
    );
    http.expectNone((request) => request.method === 'PUT' && request.url === replacementUrl);
    http.expectNone((request) => request.method === 'GET' && request.url === replacementUrl);
  }
  function expectMountedCorrections(before: ICasesCreateCasefileState): void {
    expect(router.url).toBe(reviewUrl);
    expect(fixture.debugElement.query(By.directive(CasesCreateCasefileComponent))).not.toBeNull();
    expect(getState(store)).toEqual(before);
    expect(persisted.etag()).toBe('"4"');
    expectNoReplay();
  }

  it.each([400, 422, 409, 403, 500].map((status) => ({ status, retriable: true })))(
    'keeps corrections and the existing top MOJ banner for PUT $status retriable=$retriable',
    async ({ status, retriable }) => {
      await openAmendmentReview();
      const before = structuredClone(getState(store));
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const error = {
        title: 'Synthetic replacement failure',
        detail: 'The supplied correction could not be submitted',
        operation_id: 'SYNTHETIC-OPERATION',
        retriable,
      };
      (await dispatchReplacement()).flush(error, { status, statusText: 'Replacement failure' });
      await settle();
      expectMountedCorrections(before);
      expect(confirm).not.toHaveBeenCalled();
      expect(persisted.requiresReload()).toBe(![400, 422].includes(status));
      const submit: HTMLButtonElement = fixture.nativeElement.querySelector('#create_casefile_review_submit');
      expect(submit.disabled).toBe(false);
      expect(TestBed.inject(GlobalStore).bannerError()).toMatchObject({
        error: true,
        title: error.title,
        message: error.detail,
        operationId: error.operation_id,
      });
      const banner: HTMLElement = fixture.nativeElement.querySelector('[opal-lib-moj-alert]');
      expect(banner).not.toBeNull();
      expect(banner.textContent).toContain(error.title);
      expect(banner.textContent).toContain(error.detail);
      expect(banner.textContent).toContain(error.operation_id);
      expect(
        banner.compareDocumentPosition(fixture.nativeElement.querySelector('#review-heading')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(TestBed.inject(AppInsightsService).logException).toHaveBeenCalledTimes(status === 409 ? 0 : 1);
      if (![400, 422].includes(status)) {
        submit.click();
        submit.click();
        await settle();
        expectNoReplay();
        expect(banner.textContent).toContain('Select Back to reload the saved case');
        expect(banner.textContent).toContain('discards your unsaved corrections');
        expectMountedCorrections(before);
      }
    },
  );
  it.each([
    { status: 400, destination: 'internal-server' },
    { status: 422, destination: 'internal-server' },
    { status: 409, destination: 'concurrency-failure' },
    { status: 403, destination: 'permission-denied' },
    { status: 500, destination: 'internal-server' },
  ])('uses the shared error destination for non-retriable PUT $status', async ({ status, destination }) => {
    await openAmendmentReview();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    (await dispatchReplacement()).flush({ retriable: false }, { status, statusText: 'Failure' });
    await vi.waitFor(() => expect(router.url).toBe('/error/' + destination));
    await settle();
    expect(fixture.debugElement.query(By.directive(CasesCreateCasefileComponent))).toBeNull();
    expect(store.respondentDetails()).toBeNull();
    expect(persisted.draft()).toBeNull();
    expectNoReplay();
    expect(TestBed.inject(AppInsightsService).logException).toHaveBeenCalledOnce();
  });
  it.each([400, 422])('allows an explicit retry after a definite retriable $status rejection', async (status) => {
    await openAmendmentReview();
    const before = structuredClone(getState(store));
    (await dispatchReplacement()).flush({ retriable: true }, { status, statusText: 'Rejected' });
    await settle();
    expectMountedCorrections(before);
    expect(persisted.requiresReload()).toBe(false);
    (await dispatchReplacement()).flush({ retriable: true }, { status, statusText: 'Rejected again' });
    await settle();
    expectMountedCorrections(before);
    expect(persisted.requiresReload()).toBe(false);
  });
  it.each(['network', 'malformed receipt'] as const)(
    'retains corrections and existing generic banner after %s',
    async (failure) => {
      await openAmendmentReview();
      const before = structuredClone(getState(store));
      const request = await dispatchReplacement();
      if (failure === 'network') request.error(new ProgressEvent('error'));
      else request.flush({ draft_casefile_id: 17 }, { headers: { ETag: '"5"' } });
      await settle();
      expectMountedCorrections(before);
      expect(persisted.requiresReload()).toBe(true);
      expect(TestBed.inject(GlobalStore).bannerError()).toMatchObject({
        error: true,
        title: 'There was a problem',
        message: 'You can try again. If the problem persists, contact the service desk.',
        operationId: null,
      });
      expect(fixture.nativeElement.querySelector('[opal-lib-moj-alert]')?.textContent).toContain('There was a problem');
    },
  );
  it.each([
    { status: 403, destination: 'permission-denied' },
    { status: 500, destination: 'internal-server' },
  ])('keeps ordinary draft GET $status on the shared error-page policy', async ({ status, destination }) => {
    fixture.detectChanges();
    const arrival = router.navigateByUrl(amendmentUrl);
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.method === 'GET' && request.url === replacementUrl)
        .flush({ retriable: false }, { status, statusText: 'Failure' }),
    );
    await arrival;
    await settle();
    expect(router.url).toBe('/error/' + destination);
    http.expectNone((request) => request.method === 'PUT' || request.method === 'POST');
    expect(TestBed.inject(AppInsightsService).logException).toHaveBeenCalledOnce();
  });
  it('blocks departure and duplicate submit while the sole replacement PUT is pending', async () => {
    await openAmendmentReview();
    const before = structuredClone(getState(store));
    const request = await dispatchReplacement();
    await settle();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#create_casefile_review_submit')!.click();
    expect(await router.navigateByUrl('/error/internal-server')).toBe(false);
    expect(router.url).toBe(reviewUrl);
    http.expectNone((candidate) => candidate.method === 'PUT' && candidate.url === replacementUrl);
    http.expectNone((candidate) => candidate.url === '/opal-maintenance-service/maintenance-applications');
    request.flush({ retriable: true }, { status: 409, statusText: 'Conflict' });
    await settle();
    expectMountedCorrections(before);
  });
  it.each([false, true])(
    'preserves the unknown outcome through correction and Back reloads only after confirmed departure: %s',
    async (decision) => {
      await openAmendmentReview();
      (await dispatchReplacement()).error(new ProgressEvent('error'));
      await settle();
      expectNoReplay();
      (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('#review-respondent-change')!.click();
      await settle();
      const form = fixture.debugElement.query(By.directive(CasesCreateCasefileRespondentDetailsFormComponent))
        .componentInstance as CasesCreateCasefileRespondentDetailsFormComponent;
      form.form.controls['create_casefile_respondent_details_first_names'].setValue('Further correction');
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLFormElement>('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await flushReferences();
      await settle();
      expect(store.respondentDetails()?.firstNames).toBe('Further correction');
      expect(persisted.requiresReload()).toBe(true);
      expect(fixture.nativeElement.querySelector('#create_casefile_review_submit')?.disabled).toBe(false);
      const before = structuredClone(getState(store));
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(decision);
      (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('opal-lib-govuk-back-link a')!.click();
      await vi.waitFor(() => expect(confirm).toHaveBeenCalledOnce());
      if (decision) {
        const request = http.expectOne((candidate) => candidate.method === 'GET' && candidate.url === replacementUrl);
        const draft = createPersistedCasefileDetail();
        draft.casefile_status = 'REJECTED';
        request.flush(draft, { headers: { ETag: '"6"' } });
        await flushReferences(true);
      }
      await settle();
      if (decision) {
        expect(router.url).toBe(amendmentUrl);
        expect(persisted.etag()).toBe('"6"');
        expect(persisted.requiresReload()).toBe(false);
        expect(store.respondentDetails()?.firstNames).not.toBe('Further correction');
      } else {
        expectMountedCorrections(before);
        expect(persisted.requiresReload()).toBe(true);
        expect(persisted.etag()).toBe('"4"');
      }
      expectNoReplay();
    },
  );
  it.each(['cancelled', 'rejected'] as const)(
    'clears amendment data after success and retries %s originating-list navigation without PUT',
    async (failure) => {
      await openAmendmentReview();
      const navigate = router.navigateByUrl.bind(router);
      let preventConfirmation = true;
      const returnTarget = TestBed.inject(CasesDraftNavigationService).amendmentReturnUrl(17);
      const returnUrl = router.serializeUrl(returnTarget);
      vi.spyOn(router, 'navigateByUrl').mockImplementation((url, options) => {
        if ((typeof url === 'string' ? url : router.serializeUrl(url)) === returnUrl) {
          if (!preventConfirmation) return Promise.resolve(true);
          return failure === 'cancelled'
            ? Promise.resolve(false)
            : Promise.reject(new Error('Synthetic navigation failure'));
        }
        return navigate(url, options);
      });
      const draft = createPersistedCasefileDetail();
      draft.casefile_status = 'RESUBMITTED';
      draft.submitted_by = 'BUU-INPUTTER';
      (await dispatchReplacement()).flush(draft, { headers: { ETag: '"5"' } });
      await settle();
      expect(router.url).toBe(reviewUrl);
      expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
      expect(persisted.draft()).toBeNull();
      expect(persisted.references()).toBeNull();
      expectNoReplay();
      // A later activation repeats only originating-list navigation with the same scoped success notice.
      preventConfirmation = false;
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('#create_casefile_review_submit')!
        .click();
      await settle();
      expect(router.url).toBe(reviewUrl);
      expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
      expect(persisted.identity()).toBeNull();
      expectNoReplay();
    },
  );
  it.each([false, true])(
    'cancels only local amendments and returns to the originating rejected list (all rejected: %s)',
    async (allRejected) => {
      await openAmendmentReview(allRejected);
      const before = structuredClone(getState(store));
      const envelope = structuredClone(getState(persisted));
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const cancel = async () => {
        fixture.nativeElement.querySelector('#create_casefile_review_cancel a').click();
        await settle();
        expect(router.url).toBe('/cases/create-casefile/cancel');
      };
      await cancel();
      fixture.nativeElement.querySelector('#create_casefile_cancel_back a').click();
      await flushReferences();
      await settle();
      expectMountedCorrections(before);
      expect(getState(persisted)).toEqual(envelope);
      await cancel();
      fixture.nativeElement.querySelector('#create_casefile_cancel_confirm').click();
      const destination = allRejected
        ? '/cases/draft/create-and-manage/rejections'
        : '/cases/draft/create-and-manage/tabs#rejected';
      let listing!: TestRequest;
      await vi.waitFor(() => {
        listing = http.expectOne(
          (request) => request.url === '/opal-maintenance-service/draft-casefiles' && !request.params.has('restrict'),
        );
      });
      listing.flush({ count: 0, summaries: [] });
      for (const request of http.match((request) => request.url === '/opal-maintenance-service/draft-casefiles'))
        request.flush({ count: 0 });
      await settle();
      expect(listing.request.params.get('casefile_status')).toBe('REJECTED');
      expect(listing.request.params.get('submitted_by')).toBe(allRejected ? null : 'BUU-INPUTTER');
      expect(router.url).toBe(destination);
      expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
      expect(persisted.draft()).toBeNull();
      expect(persisted.etag()).toBeNull();
      expect(confirm).not.toHaveBeenCalled();
      expectNoReplay();
      http.expectNone((request) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method));
    },
  );
  it('clears corrections and working envelope when the live identity is lost', async () => {
    await openAmendmentReview();
    TestBed.inject(GlobalStore).setAuthenticated(false);
    await settle();
    expect(router.url).toBe('/error/permission-denied');
    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
    expect(persisted.draft()).toBeNull();
    expectNoReplay();
  });
});
