import { provideRouter, Router } from '@angular/router';
import { CasesCreateCasefileTaskListComponent } from '../cases-create-casefile-task-list/cases-create-casefile-task-list.component';
import { CasesCreateCasefileOrderTermsSummaryComponent } from '../cases-create-casefile-order-terms-summary/cases-create-casefile-order-terms-summary.component';
import { TestBed } from '@angular/core/testing';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileReviewNavigationService } from './cases-create-casefile-review-navigation.service';

describe('CasesCreateCasefileReviewNavigationService', () => {
  it('keeps normal navigation and retains context until the destination consumes focus', () => {
    const service = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    expect(service.returnPath('/cases/create-casefile/task-list')).toBe('/cases/create-casefile/task-list');
    service.setContext({ origin: 'review', section: 'respondent' });
    expect(service.destination(false)).toBe('/cases/create-casefile/task-list');
    expect(service.context()?.section).toBe('respondent');
    service.clearContext();
    expect(service.context()).toBeNull();
  });

  it('returns a complete corrected draft to review and an incomplete one to tasks', () => {
    const service = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    service.setContext({ origin: 'review', section: 'orderTerm', termId: 1 });
    expect(service.returnPath('/cases/create-casefile/order-terms/summary')).toBe(
      '/cases/create-casefile/check-case-details',
    );
    expect(service.focusId()).toBe('review-order-term-1');
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, { orderTerms: [] });
    expect(service.returnPath('/cases/create-casefile/order-terms/summary')).toBe('/cases/create-casefile/task-list');
  });
  it('returns a discarded edit to accepted review without clearing dirtiness before confirmation', () => {
    const service = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      ...createCasesCreateCasefileReviewState(),
      unsavedChanges: true,
    });
    service.setContext({ origin: 'review', section: 'respondent' });
    expect(service.returnPath('/cases/create-casefile/task-list', true)).toBe(
      '/cases/create-casefile/check-case-details',
    );
    expect(store.unsavedChanges()).toBe(true);
  });

  it('allows adding replacement terms after the last reviewed term was removed', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const navigation = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      ...createCasesCreateCasefileReviewState(),
      orderTerms: [],
    });
    navigation.setContext({ origin: 'review', section: 'orderTerm', termId: 1 });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    TestBed.createComponent(CasesCreateCasefileTaskListComponent);
    expect(navigation.context()).toBeNull();
    const summary = TestBed.createComponent(CasesCreateCasefileOrderTermsSummaryComponent);
    summary.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    summary.componentInstance.handleAddTerms();
    expect(navigate).toHaveBeenCalledWith('/cases/create-casefile/order-terms/select');
  });
});
