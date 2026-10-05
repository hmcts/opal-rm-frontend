import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CasesDraftNavigationService } from '../../cases-draft/services/cases-draft-navigation.service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { signal } from '@angular/core';
import { Router, UrlTree, provideRouter } from '@angular/router';
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
  const returnUrl = new UrlTree();
  const dashboardNavigation = { creationReturnUrl: () => returnUrl };
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
        { provide: CasesDraftNavigationService, useValue: dashboardNavigation },
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

      expect(router.navigateByUrl).toHaveBeenCalledWith(returnUrl);
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
      'Continue and delete all details',
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

  it('discards only once when confirmed deletion is activated again before navigation settles', async () => {
    let finish!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
    );
    const reset = vi.spyOn(store, 'resetStore');
    const action = fixture.componentInstance.handleConfirm();
    await fixture.componentInstance.handleConfirm();
    expect(reset).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    finish(true);
    await action;
  });

  it('retains the complete state when the component is destroyed', () => {
    const before = structuredClone(getState(store));
    fixture.detectChanges();

    fixture.destroy();

    expect(getState(store)).toEqual(before);
    expect(reviewNavigation.clearContext).not.toHaveBeenCalled();
  });
});

describe('Confirmed cancellation dashboard metadata', () => {
  it.each(['false', 'throw'])(
    'retries %s navigation without discarding twice or clearing the remembered origin',
    async (failure) => {
      const user = structuredClone(OPAL_USER_STATE_MOCK);
      user.status = 'active';
      user.business_unit_users = [
        {
          business_unit_id: 44,
          business_unit_user_id: 'BUU-SYNTHETIC',
          permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
        },
      ];
      await TestBed.configureTestingModule({
        imports: [CasesCreateCasefileCancelComponent],
        providers: [
          provideRouter([]),
          {
            provide: GlobalStore,
            useValue: {
              authenticated: signal(true),
              userState: signal(user),
              featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
            },
          },
        ],
      }).compileComponents();
      const navigation = TestBed.inject(CasesDraftNavigationService);
      navigation.setSelection({ tab: 'rejected', page: 2, sort: 'created', direction: 'descending' });
      navigation.rememberCreateOrigin();
      const store = TestBed.inject(CasesCreateCasefileStore);
      patchState(
        store as unknown as WritableStateSource<ICasesCreateCasefileState>,
        createCasesCreateCasefileCancellationState(),
      );
      const fixture = TestBed.createComponent(CasesCreateCasefileCancelComponent);
      const reset = vi.spyOn(store, 'resetStore');
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      if (failure === 'false') navigate.mockResolvedValueOnce(false);
      else navigate.mockRejectedValueOnce(new Error('Synthetic router failure'));
      await fixture.componentInstance.handleConfirm();
      expect(fixture.componentInstance.navigationFailed()).toBe(true);
      await fixture.componentInstance.handleConfirm();
      expect(reset).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenLastCalledWith(navigation.creationReturnUrl());
      expect(router.serializeUrl(navigate.mock.lastCall![0] as UrlTree)).toBe(
        '/cases/draft/create-and-manage/tabs?page=2&sort=created&direction=descending#rejected',
      );
      expect(navigation.selection()).toEqual({ tab: 'rejected', page: 2, sort: 'created', direction: 'descending' });
      expect(getState(store)).toEqual(CASES_CREATE_CASEFILE_STATE);
    },
  );
});
