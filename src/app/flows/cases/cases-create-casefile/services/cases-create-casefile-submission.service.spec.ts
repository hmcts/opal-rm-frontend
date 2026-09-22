import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import type { CasesCreateCasefileSubmissionOutcome } from '../types/cases-create-casefile-submission-outcome.type';
import { CasesCreateCasefileAuthorityService } from './cases-create-casefile-authority.service';
import { CasesCreateCasefileSubmissionGateway } from './cases-create-casefile-submission-gateway.service';
import { CasesCreateCasefileSubmissionService } from './cases-create-casefile-submission.service';

describe('CasesCreateCasefileSubmissionService', () => {
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
  const authority = { authorised: vi.fn(() => true) };
  let response: Subject<CasesCreateCasefileSubmissionOutcome>;
  let submit: ReturnType<typeof vi.fn>;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  let service: CasesCreateCasefileSubmissionService;

  beforeEach(() => {
    response = new Subject();
    submit = vi.fn(() => response);
    router.navigateByUrl.mockReset().mockResolvedValue(true);
    authority.authorised.mockReturnValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: CasesCreateCasefileAuthorityService, useValue: authority },
        { provide: CasesCreateCasefileSubmissionGateway, useValue: { available: true, submit } },
      ],
    });
    store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    service = TestBed.inject(CasesCreateCasefileSubmissionService);
  });

  it('locks synchronously and passes one detached accepted snapshot', () => {
    service.submit();
    service.submit();
    expect(submit).toHaveBeenCalledOnce();
    expect(service.state()).toBe('submitting');
    const sent = submit.mock.calls[0][0];
    expect(sent.respondentDetails).not.toBe(store.respondentDetails());
    expect(sent).not.toHaveProperty('taskStatuses');
  });

  it('makes no attempt when authority is revoked or the draft is incomplete', () => {
    authority.authorised.mockReturnValue(false);
    service.submit();
    expect(service.issues()).toContain('authority');
    authority.authorised.mockReturnValue(true);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, { respondentDetails: null });
    service.submit();
    expect(service.issues()).toContain('respondent');
    expect(submit).not.toHaveBeenCalled();
  });

  it('retains a rejected draft and checks authority again before explicit retry', () => {
    const before = structuredClone(getState(store));
    service.submit();
    response.next({ status: 'definiteFailure' });
    expect(service.state()).toBe('definiteFailure');
    expect(getState(store)).toEqual(before);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    authority.authorised.mockReturnValue(false);
    service.submit();
    expect(submit).toHaveBeenCalledOnce();
    authority.authorised.mockReturnValue(true);
    service.submit();
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it.each(['error', 'empty', 'unknown', 'malformed'] as const)('does not replay an uncertain %s outcome', (kind) => {
    const before = structuredClone(getState(store));
    service.submit();
    if (kind === 'error') response.error(new Error('Untrusted response text'));
    if (kind === 'empty') response.complete();
    if (kind === 'unknown') response.next({ status: 'outcomeUnknown' });
    if (kind === 'malformed') response.next({ status: 'success', receipt: '' });
    expect(service.state()).toBe('outcomeUnknown');
    service.submit();
    expect(submit).toHaveBeenCalledOnce();
    expect(getState(store)).toEqual(before);
    expect(service.feedback()).not.toContain('Untrusted');
  });

  it('records the receipt before reset and retries only failed navigation', async () => {
    router.navigateByUrl.mockResolvedValueOnce(false);
    const reset = vi.spyOn(store, 'resetStore').mockImplementation(() => {
      expect(service.receipt()).toBe('MOCK-9817-1');
      expect(service.state()).toBe('succeeded');
    });
    service.submit();
    response.next({ status: 'success', receipt: 'MOCK-9817-1' });
    await Promise.resolve();
    expect(reset).toHaveBeenCalledOnce();
    expect(service.navigationFailed()).toBe(true);
    service.submit();
    await service.retryConfirmation();
    expect(submit).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(service.navigationFailed()).toBe(false);
  });

  it('retains active submission feedback if an unrelated success clears the global banner', () => {
    service.submit();
    response.next({ status: 'definiteFailure' });
    TestBed.tick();
    const global = TestBed.inject(GlobalStore);
    global.setBannerError({ error: false, title: null, message: null, operationId: null });
    TestBed.tick();
    expect(global.bannerError().message).toBe(service.feedback());
  });

  it('does not clear a pending operation when the review component is recreated', () => {
    service.submit();
    service.reset();
    expect(service.state()).toBe('submitting');
    expect(TestBed.inject(CasesCreateCasefileSubmissionService)).toBe(service);
    service.submit();
    expect(submit).toHaveBeenCalledOnce();
  });
});
