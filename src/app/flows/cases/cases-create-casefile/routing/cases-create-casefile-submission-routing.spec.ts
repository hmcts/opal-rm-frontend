import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { By, Title } from '@angular/platform-browser';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { CasesCreateCasefileOrderTermsRemoveComponent } from '../cases-create-casefile-order-terms-remove/cases-create-casefile-order-terms-remove.component';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileComponent } from '../cases-create-casefile.component';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { routing } from './cases-create-casefile.routes';

@Component({ template: '<h1>Outside journey</h1>' })
class OutsideComponent {}

/** Uses the production route guards and parent lifecycle, with reference data supplied locally. */
describe('Mock submission route lifecycle', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('retains the submitted draft until leaving the flow', async () => {
    const children = routing.map((route) => ({ ...route, resolve: {} }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'cases/create-casefile', component: CasesCreateCasefileComponent, children },
          { path: 'outside', component: OutsideComponent },
        ]),
      ],
    });
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const review = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    const submit = vi.spyOn(TestBed.inject(OpalMaintenanceService), 'submitCasefile');
    const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
    await harness.fixture.whenStable();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('#create_casefile_review_submit')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/submission-confirmation');
    expect(harness.routeNativeElement?.textContent).toContain('You’ve submitted this case for review');
    expect(getState(store)).toEqual(createCasesCreateCasefileReviewState());
    expect(review.context()).toBeNull();
    await harness.navigateByUrl('/cases/create-casefile/submission-confirmation');
    expect(submit).toHaveBeenCalledOnce();
    await harness.navigateByUrl('/cases/create-casefile/check-case-details');
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/check-case-details');
    expect(getState(store)).toEqual(createCasesCreateCasefileReviewState());
    review.setContext({ origin: 'review', section: 'respondent' });
    await harness.navigateByUrl('/outside');
    expect(review.context()).toBeNull();
    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
  });
  it.each(['create_casefile_confirmation_create_new', 'create_casefile_confirmation_in_review'])(
    'starts an empty case through the actual %s link',
    async (linkId) => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
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
      patchState(
        store as unknown as WritableStateSource<ICasesCreateCasefileState>,
        createCasesCreateCasefileReviewState(),
      );
      const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
      await harness.fixture.whenStable();
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('#create_casefile_review_submit')!.click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/submission-confirmation');
      const link = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('#' + linkId);
      expect(link).not.toBeNull();
      link!.click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
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
    store.setCaseTypeSelection({ caseType: 'REMO Out' });
    const setTitle = vi.spyOn(TestBed.inject(Title), 'setTitle');
    await RouterTestingHarness.create('/cases/create-casefile/submission-confirmation');
    expect(setTitle).toHaveBeenCalledWith('OPAL - Submission confirmation');
  });

  it('redirects direct confirmation with an empty store to case type', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: 'cases/create-casefile',
            component: CasesCreateCasefileComponent,
            children: routing.map((route) => ({ ...route, resolve: {} })),
          },
        ]),
      ],
    });
    await RouterTestingHarness.create('/cases/create-casefile/submission-confirmation');
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
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
        provideHttpClient(),
        provideHttpClientTesting(),
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
    await removal.handleRemove();
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
