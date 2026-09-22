import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { getState, patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileCancellationState } from '../mocks/cases-create-casefile-cancellation-state.mock';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import { CasesCreateCasefileCancelComponent } from './cases-create-casefile-cancel.component';

describe('CasesCreateCasefileCancelComponent', () => {
  const router = { navigateByUrl: vi.fn<(...args: unknown[]) => Promise<boolean>>() };
  const reviewNavigation = { clearContext: vi.fn() };
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  let fixture: ComponentFixture<CasesCreateCasefileCancelComponent>;

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigateByUrl.mockResolvedValue(true);
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCancelComponent],
      providers: [
        CasesCreateCasefileStore,
        { provide: Router, useValue: router },
        { provide: CasesCreateCasefileReviewNavigationService, useValue: reviewNavigation },
      ],
    }).compileComponents();
    store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileCancellationState(),
    );
    fixture = TestBed.createComponent(CasesCreateCasefileCancelComponent);
  });

  function click(selector: string): void {
    const element = fixture.nativeElement.querySelector(selector) as HTMLElement | null;
    expect(element).not.toBeNull();
    element!.click();
  }

  it('renders the approved cancellation content without an additional back link', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const heading = fixture.nativeElement.querySelector('#create_casefile_cancel_heading') as HTMLElement;
    expect(heading.textContent?.trim()).toBe('Cancel case creation');
    expect(document.activeElement).toBe(heading);
    expect(fixture.nativeElement.querySelector('#create_casefile_cancel_warning')?.textContent.trim()).toBe(
      'If you continue, all of the details added for this case will be lost.',
    );
    expect(fixture.nativeElement.querySelector('#create_casefile_cancel_confirm')?.textContent.trim()).toBe(
      'Continue and delete all details',
    );
    expect(fixture.nativeElement.querySelector('#create_casefile_cancel_back a')?.textContent.trim()).toBe('Go back');
    expect(fixture.nativeElement.querySelector('.govuk-back-link')).toBeNull();
  });

  it('retains the complete state on rendering and Go back', async () => {
    const before = structuredClone(getState(store));
    fixture.detectChanges();
    expect(getState(store)).toEqual(before);

    click('#create_casefile_cancel_back a');
    await fixture.whenStable();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/check-case-details');
    expect(getState(store)).toEqual(before);
    expect(reviewNavigation.clearContext).not.toHaveBeenCalled();
  });

  it.each([
    { caseType: 'REMO Out' },
    { caseType: 'REMO In', applicantType: 'Individual' },
    { caseType: 'REMO In', applicantType: 'Organisation' },
  ] satisfies CasesCreateCasefileCaseTypeSelection[])(
    'discards all state for $caseType $applicantType and resets owned context before navigating',
    async (caseTypeSelection) => {
      patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, { caseTypeSelection });
      router.navigateByUrl.mockImplementation(async () => {
        expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
        expect(reviewNavigation.clearContext).toHaveBeenCalledOnce();
        return true;
      });
      fixture.detectChanges();

      click('#create_casefile_cancel_confirm');
      await fixture.whenStable();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/case-type', {
        state: { focusCaseTypeHeading: true },
      });
      expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
    },
  );

  it.each(['false', 'rejection'] as const)('retains data on failed return: %s', async (failure) => {
    if (failure === 'false') router.navigateByUrl.mockResolvedValueOnce(false);
    else router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic router failure'));
    const before = structuredClone(getState(store));
    fixture.detectChanges();

    click('#create_casefile_cancel_back a');
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const error = fixture.nativeElement.querySelector('#create_casefile_cancel_error') as HTMLElement;
    expect(getState(store)).toEqual(before);
    expect(error.textContent.trim()).toBe('The next page could not be opened. Try again.');
    expect(document.activeElement).toBe(error);
    expect(reviewNavigation.clearContext).not.toHaveBeenCalled();

    click('#create_casefile_cancel_back a');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.navigationFailed()).toBe(false);
    expect(fixture.nativeElement.querySelector('#create_casefile_cancel_error')).toBeNull();
  });

  it.each(['false', 'rejection'] as const)('retries only navigation after deletion: %s', async (failure) => {
    if (failure === 'false') router.navigateByUrl.mockResolvedValueOnce(false);
    else router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic router failure'));
    const reset = vi.spyOn(store, 'resetStore');
    fixture.detectChanges();

    click('#create_casefile_cancel_confirm');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
    expect(fixture.nativeElement.querySelector('#create_casefile_cancel_back')).toBeNull();
    expect(fixture.nativeElement.querySelector('#create_casefile_cancel_confirm').textContent.trim()).toBe(
      'Continue to case type',
    );

    click('#create_casefile_cancel_confirm');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(reset).toHaveBeenCalledOnce();
    expect(reviewNavigation.clearContext).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.navigationFailed()).toBe(false);
    expect(fixture.nativeElement.querySelector('#create_casefile_cancel_error')).toBeNull();
  });

  it('rejects competing activation until navigation settles', async () => {
    let finish!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValue(new Promise<boolean>((resolve) => (finish = resolve)));
    const before = structuredClone(getState(store));
    fixture.detectChanges();

    click('#create_casefile_cancel_back a');
    expect(fixture.componentInstance.busy()).toBe(true);
    expect(fixture.componentInstance.blocked()).toBe(true);
    await fixture.componentInstance.handleConfirm();
    await fixture.componentInstance.handleBack();

    expect(getState(store)).toEqual(before);
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    finish(false);
    await fixture.whenStable();
  });

  it('retains the complete state when the component is destroyed', () => {
    const before = structuredClone(getState(store));
    fixture.detectChanges();

    fixture.destroy();

    expect(getState(store)).toEqual(before);
    expect(reviewNavigation.clearContext).not.toHaveBeenCalled();
  });
});
