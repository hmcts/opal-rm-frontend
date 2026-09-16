import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceResultReferenceDataResponse } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-result-reference-data-response.interface';
import { OPAL_MAINTENANCE_RESULTS_MOCK } from '../../../services/opal-maintenance-service/mocks/opal-maintenance-results.mock';
import { CasesCreateCasefileOrderTermsLoadService } from './cases-create-casefile-order-terms-load.service';

function setup() {
  const requests: Subject<IOpalMaintenanceResultReferenceDataResponse>[] = [];
  const teardowns = vi.fn();
  const getResults = vi.fn(
    () =>
      new Observable<IOpalMaintenanceResultReferenceDataResponse>((subscriber) => {
        const response = new Subject<IOpalMaintenanceResultReferenceDataResponse>();
        requests.push(response);
        const subscription = response.subscribe(subscriber);
        return () => {
          subscription.unsubscribe();
          teardowns();
        };
      }),
  );
  const owner = new CasesCreateCasefileOrderTermsLoadService({ getResults });
  return { owner, requests, getResults, teardowns };
}

describe('Order terms load owner', () => {
  it('starts one filtered load and ignores repeated retry while pending', () => {
    const { owner, getResults, requests, teardowns } = setup();
    owner.load();
    owner.load();
    expect(owner.state().status).toBe('loading');
    expect(getResults).toHaveBeenCalledExactlyOnceWith({ order_term: true, active: true });
    requests[0].next(structuredClone(OPAL_MAINTENANCE_RESULTS_MOCK));
    expect(owner.state().status).toBe('ready');
    expect(owner.state().records).toEqual(OPAL_MAINTENANCE_RESULTS_MOCK.refData);
    expect(teardowns).toHaveBeenCalledTimes(1);
    owner.dispose();
  });

  it('retains labels after failure and replaces them only on success', () => {
    const { owner, requests } = setup();
    owner.load();
    requests[0].next(structuredClone(OPAL_MAINTENANCE_RESULTS_MOCK));
    owner.load();
    requests[1].error(
      new HttpErrorResponse({
        status: 503,
        error: { operation_id: 'synthetic-reference', detail: 'Do not display this detail' },
      }),
    );
    expect(owner.state()).toEqual({
      status: 'error',
      records: OPAL_MAINTENANCE_RESULTS_MOCK.refData,
      correlationReference: 'synthetic-reference',
    });
    owner.load();
    requests[2].next({ count: 0, refData: [] });
    expect(owner.state()).toEqual({ status: 'empty', records: [], correlationReference: null });
    owner.dispose();
  });

  it('treats completion without a payload as recoverable error', () => {
    const { owner, requests } = setup();
    owner.load();
    requests[0].complete();
    expect(owner.state().status).toBe('error');
    expect(owner.state().correlationReference).toBeNull();
    owner.dispose();
  });

  it('cancels pending work and cannot restart a disposed owner', () => {
    const { owner, requests, teardowns, getResults } = setup();
    owner.load();
    owner.dispose();
    requests[0].next(structuredClone(OPAL_MAINTENANCE_RESULTS_MOCK));
    owner.load();
    expect(teardowns).toHaveBeenCalledTimes(1);
    expect(getResults).toHaveBeenCalledTimes(1);
    expect(owner.state().status).toBe('loading');
  });

  it.each([new Error('private error'), new HttpErrorResponse({ status: 500, error: { operation_id: 42 } })])(
    'does not invent a correlation reference',
    (error) => {
      const { owner, requests } = setup();
      owner.load();
      requests[0].error(error);
      expect(owner.state().correlationReference).toBeNull();
      owner.dispose();
    },
  );
});
