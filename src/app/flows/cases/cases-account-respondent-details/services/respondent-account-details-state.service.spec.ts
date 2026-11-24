import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import type {
  RespondentAccountAtAGlance,
  RespondentAccountHeaderSummary,
  RespondentAccountRead,
} from '../../services/opal-maintenance-service/interfaces/opal-maintenance-respondent-account.interface';
import {
  RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
  RESPONDENT_ACCOUNT_HEADER_MOCK,
} from '../../services/opal-maintenance-service/mocks/opal-maintenance-respondent-account.mock';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { RespondentAccountReadError } from '../../services/opal-maintenance-service/utils/opal-maintenance-respondent-account-read-error';
import { observeTag, RespondentAccountDetailsState } from './respondent-account-details-state.service';

describe('RespondentAccountDetailsState', () => {
  let state: RespondentAccountDetailsState;
  let headerResults: Subject<RespondentAccountRead<RespondentAccountHeaderSummary>>[];
  let summaryResults: Subject<RespondentAccountRead<RespondentAccountAtAGlance>>[];

  function recordRead<T>(results: Subject<RespondentAccountRead<T>>[]): Subject<RespondentAccountRead<T>> {
    const request = new Subject<RespondentAccountRead<T>>();
    results.push(request);
    return request;
  }

  beforeEach(() => {
    headerResults = [];
    summaryResults = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        RespondentAccountDetailsState,
        {
          provide: OpalMaintenanceService,
          useValue: {
            getRespondentAccountHeaderSummary: () => recordRead(headerResults),
            getRespondentAccountAtAGlance: () => recordRead(summaryResults),
          },
        },
      ],
    });
    state = TestBed.inject(RespondentAccountDetailsState);
  });

  function reply<T>(result: Subject<RespondentAccountRead<T>>, body: T, etag: string | null): void {
    result.next({ body, etag });
    result.complete();
  }

  it('publishes the refreshed Header and waits for both reads to confirm', () => {
    state.open(11748, null);
    reply(headerResults[0], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v1"');
    reply(summaryResults[0], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
    expect(state.freshness()).toEqual({ baseline: '"v1"', warning: true, confirmed: false });

    state.refresh();
    expect(headerResults).toHaveLength(2);
    expect(summaryResults).toHaveLength(2);
    reply(headerResults[1], { ...RESPONDENT_ACCOUNT_HEADER_MOCK, arrears: 126.5 }, '"v2"');
    expect(state.header().data?.body.arrears).toBe(126.5);
    expect(state.freshness()).toEqual({ baseline: '"v1"', warning: true, confirmed: false });
    reply(summaryResults[1], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
    expect(state.freshness()).toEqual({ baseline: '"v2"', warning: false, confirmed: true });
    state.dismissConfirmation();
    expect(state.freshness()).toEqual({ baseline: '"v2"', warning: false, confirmed: false });
  });

  it.each([null, 'unquoted', 'W/"v2"', '"v3"'])('preserves warning and baseline with %s', (tag) => {
    state.open(11748, null);
    reply(summaryResults[0], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
    reply(headerResults[0], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v1"');
    state.refresh();
    reply(headerResults[1], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v2"');
    reply(summaryResults[1], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, tag);
    expect(state.freshness()).toEqual({ baseline: '"v1"', warning: true, confirmed: false });
  });

  it('keeps the Header and retries only the failed Summary', () => {
    state.open(11748, null);
    reply(headerResults[0], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v1"');
    reply(summaryResults[0], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
    state.refresh();
    reply(headerResults[1], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v2"');
    summaryResults[1].error(
      new RespondentAccountReadError({
        kind: 'retryable',
        title: 'There was a problem',
        message: 'Synthetic read failure',
      }),
    );
    expect(state.header().phase).toBe('ready');
    expect(state.summary().error?.message).toBe('Synthetic read failure');
    state.retry('summary');
    state.retry('summary');
    expect(headerResults).toHaveLength(2);
    expect(summaryResults).toHaveLength(3);
    reply(summaryResults[2], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
    expect(state.freshness()).toEqual({ baseline: '"v1"', warning: true, confirmed: false });
  });

  it.each([
    [11749, null],
    [11748, 10],
  ] as const)('discards obsolete responses on a change to account %s and relationship %s', (accountId, applicantId) => {
    state.open(11748, null);
    reply(headerResults[0], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v1"');
    expect(state.freshness().baseline).toBe('"v1"');
    state.open(accountId, applicantId);
    expect(state.header().data).toBeNull();
    reply(summaryResults[0], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"obsolete"');
    expect(state.summary().phase).toBe('loading');
    expect(state.freshness()).toEqual({ baseline: null, warning: false, confirmed: false });
    reply(headerResults[1], { ...RESPONDENT_ACCOUNT_HEADER_MOCK, respondentAccountId: accountId }, '"v2"');
    reply(summaryResults[1], { ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, respondentAccountId: accountId }, '"v2"');
    expect(state.freshness()).toEqual({ baseline: '"v2"', warning: false, confirmed: false });
  });

  it('routes a terminal read failure while the other read is still pending', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    state.open(11748, null);
    headerResults[0].error(
      new RespondentAccountReadError({
        kind: 'route',
        path: '/error/permission-denied',
        operationId: null,
      }),
    );
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/error/permission-denied', { state: { operationId: null } });
    summaryResults[0].error(
      new RespondentAccountReadError({
        kind: 'route',
        path: '/error/internal-server',
        operationId: 'read-synthetic',
      }),
    );
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('clears confirmation when a later comparable tag differs', () => {
    expect(observeTag({ baseline: '"v2"', warning: false, confirmed: true }, '"v3"')).toEqual({
      baseline: '"v2"',
      warning: true,
      confirmed: false,
    });
  });

  it.each(['header-retry-first', 'summary-first'] as const)(
    'detects a mismatch after Header Retry with %s',
    (order) => {
      state.open(11748, null);
      headerResults[0].error(
        new RespondentAccountReadError({
          kind: 'retryable',
          title: 'There was a problem',
          message: 'Synthetic Header failure',
        }),
      );
      state.retry('header');
      if (order === 'summary-first') reply(summaryResults[0], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
      reply(headerResults[1], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v1"');
      if (order === 'header-retry-first') {
        expect(state.freshness()).toEqual({ baseline: '"v1"', warning: false, confirmed: false });
        reply(summaryResults[0], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
      }
      expect(state.header().phase).toBe('ready');
      expect(state.summary().phase).toBe('ready');
      expect(headerResults).toHaveLength(2);
      expect(summaryResults).toHaveLength(1);
      expect(state.freshness()).toEqual({ baseline: '"v1"', warning: true, confirmed: false });
    },
  );

  it.each(['header', 'summary'] as const)('uses shared routing for a terminal %s Refresh failure', (read) => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    state.open(11748, null);
    reply(headerResults[0], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v1"');
    reply(summaryResults[0], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
    state.refresh();
    const rejected = read === 'header' ? headerResults[1] : summaryResults[1];
    rejected.error(
      new RespondentAccountReadError({
        kind: 'route',
        path: '/error/permission-denied',
        operationId: 'read-synthetic',
      }),
    );
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/error/permission-denied', {
      state: { operationId: 'read-synthetic' },
    });
    if (read === 'header') {
      expect(summaryResults[1].observed).toBe(false);
      reply(summaryResults[1], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
    } else {
      expect(headerResults[1].observed).toBe(false);
      reply(headerResults[1], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v2"');
    }
    expect(state.freshness()).toEqual({ baseline: '"v1"', warning: true, confirmed: false });
    expect(state[read]().error).toBeNull();
  });

  it('keeps the in-flight requests when the account and relationship stay the same', () => {
    state.open(11748, null);
    state.open(11748, null);
    expect(headerResults).toHaveLength(1);
    expect(summaryResults).toHaveLength(1);
  });

  it('starts no Refresh without a warning or twice for one warning', () => {
    state.refresh();
    state.open(11748, null);
    reply(headerResults[0], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v1"');
    state.refresh();
    expect(headerResults).toHaveLength(1);
    expect(summaryResults).toHaveLength(1);
    reply(summaryResults[0], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
    state.refresh();
    state.refresh();
    expect(headerResults).toHaveLength(2);
    expect(summaryResults).toHaveLength(2);
    expect(state.header().data?.etag).toBe('"v1"');
    expect(state.summary().data?.etag).toBe('"v2"');
  });

  it('routes a terminal Header Retry failure and cancels the pending Summary', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    state.open(11748, null);
    headerResults[0].error(
      new RespondentAccountReadError({ kind: 'retryable', title: 'There was a problem', message: 'Retry the Header' }),
    );
    state.retry('header');
    headerResults[1].error(
      new RespondentAccountReadError({
        kind: 'route',
        path: '/error/internal-server',
        operationId: 'read-retry',
      }),
    );
    state.retry('header');
    expect(headerResults).toHaveLength(2);
    expect(summaryResults[0].observed).toBe(false);
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/error/internal-server', {
      state: { operationId: 'read-retry' },
    });
  });

  it('cancels pending reads when the page state is destroyed', () => {
    state.open(11748, null);
    TestBed.resetTestingModule();
    expect(headerResults[0].observed).toBe(false);
    expect(summaryResults[0].observed).toBe(false);
  });
});
