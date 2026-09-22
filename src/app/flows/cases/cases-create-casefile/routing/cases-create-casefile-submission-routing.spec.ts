import { By } from '@angular/platform-browser';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { CasesCreateCasefileOrderTermsRemoveComponent } from '../cases-create-casefile-order-terms-remove/cases-create-casefile-order-terms-remove.component';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileComponent } from '../cases-create-casefile.component';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefileSubmissionGateway } from '../services/cases-create-casefile-submission-gateway.service';
import { CasesCreateCasefileSubmissionService } from '../services/cases-create-casefile-submission.service';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN } from '../tokens/cases-create-casefile-mock-enabled.token';
import type { CasesCreateCasefileSubmissionOutcome } from '../types/cases-create-casefile-submission-outcome.type';
import { routing } from './cases-create-casefile.routes';

@Component({ template: '<h1>Outside journey</h1>' })
class OutsideComponent {}

/** Uses the production route guards and parent lifecycle, with reference data supplied locally. */
describe('Mock submission route lifecycle', () => {
  it('blocks departure pending submission, retains receipt after draft reset, and rejects stale review entry', async () => {
    const response = new Subject<CasesCreateCasefileSubmissionOutcome>();
    const submit = vi.fn(() => response);
    const children = routing
      .filter((route) => ['check-case-details', 'submission-confirmation'].includes(route.path ?? ''))
      .map((route) => ({
        ...route,
        resolve: {},
        data: {
          countries: { refData: [{ country_id: 1, country_name: 'United Kingdom', active: true }] },
          applications: {
            refData: [{ application_id: 901, application_title: 'Synthetic application', active: true }],
          },
        },
      }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cases/create-casefile', component: CasesCreateCasefileComponent, children },
          { path: 'outside', component: OutsideComponent },
        ]),
        { provide: CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN, useValue: true },
        { provide: CasesCreateCasefileSubmissionGateway, useValue: { available: true, submit } },
      ],
    });
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
    const service = TestBed.inject(CasesCreateCasefileSubmissionService);
    const router = TestBed.inject(Router);
    service.submit();
    expect(await router.navigateByUrl('/outside')).toBe(false);
    expect(router.url).toBe('/cases/create-casefile/check-case-details');
    expect(store.respondentDetails()).not.toBeNull();
    response.next({ status: 'success', receipt: 'MOCK-9817-1' });
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/cases/create-casefile/submission-confirmation');
    expect(harness.routeNativeElement?.textContent).toContain('MOCK-9817-1');
    expect(store.caseTypeSelection()).toBeNull();
    expect(store.respondentDetails()).toBeNull();
    await harness.navigateByUrl('/cases/create-casefile/check-case-details');
    expect(router.url).toBe('/cases/create-casefile/submission-confirmation');
    expect(submit).toHaveBeenCalledOnce();
    await harness.navigateByUrl('/outside');
    expect(service.receipt()).toBeNull();
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
        { provide: CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN, useValue: true },
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
