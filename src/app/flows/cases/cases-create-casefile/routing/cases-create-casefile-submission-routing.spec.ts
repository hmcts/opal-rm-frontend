import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { CasesCreateCasefileCheckDetailsComponent } from '../cases-create-casefile-check-details/cases-create-casefile-check-details.component';
import { By, Title } from '@angular/platform-browser';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { CasesCreateCasefileOrderTermsRemoveComponent } from '../cases-create-casefile-order-terms-remove/cases-create-casefile-order-terms-remove.component';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { CasesCreateCasefileComponent } from '../cases-create-casefile.component';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { routing } from './cases-create-casefile.routes';

@Component({ template: '<h1>Outside journey</h1>' })
class OutsideComponent {}

/** Uses the production route guards and parent lifecycle, with reference data supplied locally. */
describe('Submission route lifecycle', () => {
  const submissionUrl = '/opal-maintenance-service/draft-casefiles';
  const children = routing.map((route) => ({
    ...route,
    resolve: {},
    data: {
      ...route.data,
      countries: { refData: [{ country_id: 1, cjs_code: 101, country_name: 'United Kingdom', active: true }] },
      applications: {
        refData: [
          { application_id: 901, application_code: 'TEST', application_title: 'Synthetic application', active: true },
        ],
      },
    },
  }));
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        provideLocationMocks(),
        { provide: GlobalStore, useValue: new GlobalStore() },
        { provide: AppInsightsService, useValue: { logException: vi.fn() } },
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it.each(['create_casefile_confirmation_create_new'])(
    'starts an empty case and focuses its heading through the actual %s link',
    async (linkId) => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([
            {
              path: 'cases/create-casefile',
              component: CasesCreateCasefileComponent,
              children,
            },
          ]),
        ],
      });
      const store = TestBed.inject(CasesCreateCasefileStore);
      patchState(
        store as unknown as WritableStateSource<ICasesCreateCasefileState>,
        createCasesCreateCasefileReviewState(),
      );
      const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
      await harness.fixture.whenStable();
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('#create_casefile_review_submit')!.click();
      TestBed.inject(HttpTestingController)
        .expectOne(submissionUrl)
        .flush({ draft_casefile_id: 9817, casefile_status: 'SUBMITTED' }, { status: 201, statusText: 'Created' });
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/submission-confirmation');
      const link = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('#' + linkId);
      expect(link).not.toBeNull();
      link!.focus();
      expect(document.activeElement).toBe(link);
      link!.click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
      const heading = harness.routeNativeElement!.querySelector('#create_casefile_case_type_heading');
      expect(heading).not.toBeNull();
      expect(document.activeElement).toBe(heading);
      expect(harness.routeNativeElement!.querySelectorAll('input:checked')).toHaveLength(0);
      expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
    },
  );

  it('sets the document title through the production confirmation resolver', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'cases/create-casefile', component: CasesCreateCasefileComponent, children: routing }]),
      ],
    });
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    store.setSubmissionSucceeded(true);
    const setTitle = vi.spyOn(TestBed.inject(Title), 'setTitle');
    await RouterTestingHarness.create('/cases/create-casefile/submission-confirmation');
    expect(setTitle).toHaveBeenCalledWith('OPAL - Submission confirmation');
  });

  it.each([false, true])('denies direct confirmation for an unsubmitted draft (complete: %s)', async (complete) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'cases/create-casefile',
            component: CasesCreateCasefileComponent,
            children: routing.map((route) => ({ ...route, resolve: {} })),
          },
        ]),
      ],
    });
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.setCaseTypeSelection({ caseType: 'REMO In', applicantType: 'Individual' });
    if (complete)
      patchState(
        store as unknown as WritableStateSource<ICasesCreateCasefileState>,
        createCasesCreateCasefileReviewState(),
      );
    const before = structuredClone(getState(store));

    const harness = await RouterTestingHarness.create('/cases/create-casefile/submission-confirmation');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe(
      complete ? '/cases/create-casefile/check-case-details' : '/cases/create-casefile/task-list',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain('Case submitted for review');
    expect(getState(store)).toEqual(before);
  });

  it('clears the accepted draft after HTTP 201 and prevents Back from reopening it', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cases/create-casefile', component: CasesCreateCasefileComponent, children },
          { path: 'dashboard/cases', component: OutsideComponent },
        ]),
      ],
    });
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const before = structuredClone(getState(store));
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/respondent-details');
    await harness.navigateByUrl('/cases/create-casefile/check-case-details');
    await harness.fixture.whenStable();
    const review = harness.fixture.debugElement.query(By.directive(CasesCreateCasefileCheckDetailsComponent))
      .componentInstance as CasesCreateCasefileCheckDetailsComponent;
    const submission = review.handleSubmit();
    const request = http.expectOne(submissionUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.casefile.respondent_account.respondent.party_details.address.cjs_code).toBe(101);
    expect(router.url).toBe('/cases/create-casefile/check-case-details');
    expect(getState(store)).toEqual(before);
    expect(await router.navigateByUrl('/cases/create-casefile/task-list')).toBe(false);
    expect(router.url).toBe('/cases/create-casefile/check-case-details');
    expect(request.cancelled).toBe(false);
    request.flush({ draft_casefile_id: 9817, casefile_status: 'SUBMITTED' }, { status: 201, statusText: 'Created' });
    await submission;
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/cases/create-casefile/submission-confirmation');
    expect(harness.routeNativeElement?.textContent).toContain('You’ve submitted this case for review');
    expect(getState(store)).toEqual({ ...CASES_CREATE_CASEFILE_STATE, submissionSucceeded: true });
    // The harness navigates explicitly; enable the listener used by browser Back.
    router.setUpLocationChangeListener();
    TestBed.inject(Location).historyGo(-2);
    await vi.waitFor(() => expect(router.url).toBe('/cases/create-casefile/case-type'));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/cases/create-casefile/case-type');
    expect(harness.routeNativeElement?.querySelector('app-cases-create-casefile-respondent-details')).toBeNull();
    for (const path of [
      'respondent-details',
      'applicant-details/individual',
      'applicant-details/organisation',
      'check-case-details',
    ]) {
      await harness.navigateByUrl('/cases/create-casefile/' + path);
      expect(router.url).toBe('/cases/create-casefile/case-type');
      expect(harness.routeNativeElement?.querySelector('#create_casefile_review_submit')).toBeNull();
      expect(store.respondentDetails()).toBeNull();
      expect(store.applicantDetails()).toBeNull();
    }
    http.expectNone(submissionUrl);
    await router.navigateByUrl('/dashboard/cases');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/dashboard/cases');
    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
  });

  it.each([400, 409, 500])('uses the generic banner and retains the draft after retriable HTTP %i', async (status) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'cases/create-casefile', component: CasesCreateCasefileComponent, children }]),
      ],
    });
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const before = structuredClone(getState(store));
    const http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
    await harness.fixture.whenStable();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('#create_casefile_review_submit')!.click();
    http
      .expectOne(submissionUrl)
      .flush({ retriable: true, detail: 'Synthetic submission failure' }, { status, statusText: 'Error' });
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/check-case-details');
    expect(getState(store)).toEqual(before);
    expect(TestBed.inject(GlobalStore).bannerError()).toMatchObject({
      error: true,
      message: 'Synthetic submission failure',
    });
    expect(harness.routeNativeElement?.querySelector('#review-errors')).toBeNull();
    expect(
      harness.routeNativeElement?.querySelector<HTMLButtonElement>('#create_casefile_review_submit')?.disabled,
    ).toBe(false);
    http.expectNone(submissionUrl);
  });
  it('allows the generic interceptor to navigate away after a non-retriable permission error', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cases/create-casefile', component: CasesCreateCasefileComponent, children },
          { path: 'error/permission-denied', component: OutsideComponent },
        ]),
      ],
    });
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
    await harness.fixture.whenStable();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('#create_casefile_review_submit')!.click();
    TestBed.inject(HttpTestingController)
      .expectOne(submissionUrl)
      .flush({ retriable: false, detail: 'Synthetic permission failure' }, { status: 403, statusText: 'Forbidden' });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/error/permission-denied');
    expect(store.submissionSucceeded()).toBe(false);
    expect(TestBed.inject(GlobalStore).bannerError().error).toBeFalsy();
  });

  it('returns saved corrections to review and permits rebuilding after removal of the last term', async () => {
    const children = routing.map((route) => ({
      ...route,
      resolve: {},
      data: {
        countries: { refData: [{ country_id: 1, country_name: 'United Kingdom', active: true }] },
        applications: { refData: [{ application_id: 901, application_title: 'Synthetic application', active: true }] },
      },
    }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'cases/create-casefile', component: CasesCreateCasefileComponent, children }]),
      ],
    });
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    store.setCommentsAndNotes({ comment: 'Synthetic comment', note: null });
    const beforeTerms = structuredClone(store.orderTerms());
    const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
    const router = TestBed.inject(Router);
    await harness.fixture.whenStable();
    harness.detectChanges();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('#review-commentsAndNotes-change')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/cases/create-casefile/comments-and-notes');
    const textarea = harness.routeNativeElement!.querySelector<HTMLTextAreaElement>('textarea')!;
    textarea.value = 'Corrected synthetic comment';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    harness.detectChanges();
    harness
      .routeNativeElement!.querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/cases/create-casefile/check-case-details');
    expect(harness.routeNativeElement!.textContent).toContain('Corrected synthetic comment');
    expect(store.orderTerms()).toEqual(beforeTerms);
    await harness.fixture.whenStable();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('[id^="review-term-remove-"]')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    const removal = harness.fixture.debugElement.query(By.directive(CasesCreateCasefileOrderTermsRemoveComponent))
      .componentInstance as CasesCreateCasefileOrderTermsRemoveComponent;
    await removal.handleConfirm();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/cases/create-casefile/task-list');
    expect(store.orderTerms()).toEqual([]);
    expect(TestBed.inject(CasesCreateCasefileReviewNavigationService).context()).toBeNull();
    await harness.navigateByUrl('/cases/create-casefile/order-terms/summary');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/cases/create-casefile/order-terms/summary');
  });
});
