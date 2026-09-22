import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN } from '../tokens/cases-create-casefile-mock-enabled.token';
import { CASES_CREATE_CASEFILE_MOCK_ENABLED } from '../config/cases-create-casefile-mock.config';
import { CasesCreateCasefileSubmissionGateway } from './cases-create-casefile-submission-gateway.service';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { acceptedCasefileSnapshot } from '../utils/cases-create-casefile-accepted-snapshot';

describe('CasesCreateCasefileSubmissionGateway', () => {
  afterEach(() => vi.useRealTimers());

  it('returns an asynchronous, distinct mock receipt without changing accepted data', async () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: CASES_CREATE_CASEFILE_MOCK_ENABLED_TOKEN, useValue: true }],
    });
    const gateway = TestBed.inject(CasesCreateCasefileSubmissionGateway);
    const snapshot = acceptedCasefileSnapshot(CASES_CREATE_CASEFILE_STATE);
    snapshot.caseTypeSelection = { caseType: 'REMO Out' };
    const before = structuredClone(snapshot);
    const first = firstValueFrom(gateway.submit(snapshot));
    await vi.advanceTimersByTimeAsync(400);
    expect(await first).toEqual({ status: 'success', receipt: 'MOCK-9817-1' });
    const second = firstValueFrom(gateway.submit(snapshot));
    await vi.advanceTimersByTimeAsync(400);
    expect(await second).toEqual({ status: 'success', receipt: 'MOCK-9817-2' });
    expect(snapshot).toEqual(before);
  });

  it('does not enable simulated submission in the default configuration', async () => {
    expect(CASES_CREATE_CASEFILE_MOCK_ENABLED).toBe(false);
    const gateway = TestBed.inject(CasesCreateCasefileSubmissionGateway);
    expect(gateway.available).toBe(false);
    await expect(firstValueFrom(gateway.submit(acceptedCasefileSnapshot(CASES_CREATE_CASEFILE_STATE)))).rejects.toThrow(
      'Casefile submission is unavailable',
    );
  });
});
