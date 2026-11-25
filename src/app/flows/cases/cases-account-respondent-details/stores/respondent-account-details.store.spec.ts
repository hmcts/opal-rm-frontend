import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
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
import { observeTag, RespondentAccountDetailsStore } from './respondent-account-details.store';

describe('RespondentAccountDetailsStore', () => {
  let state: InstanceType<typeof RespondentAccountDetailsStore>;
  let globalStore: InstanceType<typeof GlobalStore>;
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
        { provide: GlobalStore, useValue: new GlobalStore() },
        RespondentAccountDetailsStore,
        {
          provide: OpalMaintenanceService,
          useValue: {
            getRespondentAccountHeaderSummary: () => recordRead(headerResults),
            getRespondentAccountAtAGlance: () => recordRead(summaryResults),
          },
        },
      ],
    });
    state = TestBed.inject(RespondentAccountDetailsStore);
    globalStore = TestBed.inject(GlobalStore);
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
    globalStore.setBannerError({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: 'Summary unavailable',
      message: 'Synthetic read failure',
    });
    summaryResults[1].error(new HttpErrorResponse({ status: 503 }));
    expect(globalStore.bannerError()).toEqual(GLOBAL_ERROR_STATE);
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

  it('cancels the other read when the shared interceptor starts terminal navigation', () => {
    state.open(11748, null);
    headerResults[0].error(new HttpErrorResponse({ status: 403, error: { retriable: false } }));
    expect(summaryResults[0].observed).toBe(false);
    expect(state.header().error).toBeNull();
  });

  it('retains the failed read banner after a later successful sibling clears shared error state', () => {
    state.open(11748, null);
    globalStore.setBannerError({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: 'Summary unavailable',
      message: 'The summary can be retried.',
    });
    summaryResults[0].error(new HttpErrorResponse({ status: 503 }));
    expect(globalStore.bannerError()).toEqual(GLOBAL_ERROR_STATE);

    globalStore.resetBannerError();
    reply(headerResults[0], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v1"');
    expect(state.summary().error).toEqual({
      title: 'Summary unavailable',
      message: 'The summary can be retried.',
    });
    expect(state.header().phase).toBe('ready');
  });

  it('settles an empty response stream with the shared banner and allows Retry', () => {
    state.open(11748, null);
    globalStore.setBannerError({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: 'Summary unavailable',
      message: 'The shared interceptor consumed the error.',
    });
    summaryResults[0].complete();
    expect(state.summary().phase).toBe('error');
    expect(state.summary().error?.title).toBe('Summary unavailable');
    expect(globalStore.bannerError()).toEqual(GLOBAL_ERROR_STATE);

    state.retry('summary');
    expect(summaryResults).toHaveLength(2);
    expect(headerResults).toHaveLength(1);
  });

  it('uses generic copy for a decoding failure without consuming unrelated banner state', () => {
    state.open(11748, null);
    const original = {
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: 'Other request',
      message: 'Another feature reported this error.',
    };
    globalStore.setBannerError(original);
    summaryResults[0].error(new Error('Invalid respondent account response'));

    expect(state.summary().error).toEqual({
      title: 'There was a problem',
      message: 'You can try again. If the problem persists, contact the service desk.',
    });
    expect(globalStore.bannerError()).toEqual(original);
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
      headerResults[0].error(new HttpErrorResponse({ status: 503 }));
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

  it.each(['header', 'summary'] as const)('cancels the sibling for a terminal %s Refresh failure', (read) => {
    state.open(11748, null);
    reply(headerResults[0], RESPONDENT_ACCOUNT_HEADER_MOCK, '"v1"');
    reply(summaryResults[0], RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, '"v2"');
    state.refresh();
    const rejected = read === 'header' ? headerResults[1] : summaryResults[1];
    rejected.error(new HttpErrorResponse({ status: 403, error: { retriable: false } }));
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

  it('stops further work and cancels the pending Summary after a terminal Header Retry failure', () => {
    state.open(11748, null);
    headerResults[0].error(new HttpErrorResponse({ status: 503 }));
    state.retry('header');
    headerResults[1].error(new HttpErrorResponse({ status: 500, error: { retriable: false } }));

    state.retry('header');
    expect(headerResults).toHaveLength(2);
    expect(summaryResults[0].observed).toBe(false);
  });

  it('cancels pending reads when the page state is destroyed', () => {
    state.open(11748, null);
    TestBed.resetTestingModule();
    expect(headerResults[0].observed).toBe(false);
    expect(summaryResults[0].observed).toBe(false);
  });
});
