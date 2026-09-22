import { Component } from '@angular/core';
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
  beforeEach(() => {
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
        provideRouter([
          {
            path: 'cases/create-casefile',
            component: CasesCreateCasefileComponent,
            canDeactivate: [canDeactivateGuard],
            children,
          },
          { path: 'outside', component: OutsideComponent },
        ]),
      ],
    });
  });

  afterEach(() => vi.restoreAllMocks());

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
    await click(harness, '#create_casefile_review_cancel');
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

  it('discards the complete case and stale review context, then focuses the empty Case Type form', async () => {
    seedReview();
    const store = TestBed.inject(CasesCreateCasefileStore);
    const context = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    context.setContext({ origin: 'review', section: 'commentsAndNotes' });
    const harness = await RouterTestingHarness.create('/cases/create-casefile/check-case-details');
    await click(harness, '#create_casefile_review_cancel');
    await click(harness, '#create_casefile_cancel_confirm');
    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
    expect(context.context()).toBeNull();
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
    expect(parent.handleBeforeUnload()).toBe(true);
    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
  });

  it('guards stale review and cancellation URLs after discard without restoring the case', async () => {
    seedReview();
    const harness = await RouterTestingHarness.create('/cases/create-casefile/cancel');
    await click(harness, '#create_casefile_cancel_confirm');
    for (const path of ['check-case-details', 'cancel']) {
      await harness.navigateByUrl('/cases/create-casefile/' + path);
      expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
      expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
      expect(harness.routeNativeElement!.querySelector('#create_casefile_case_type_heading')).not.toBeNull();
    }
  });
});
