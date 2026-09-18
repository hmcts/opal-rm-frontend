import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { CasesCreateCasefileMajorCreditorsLoadService } from './cases-create-casefile-major-creditors-load.service';

const validRecord = (overrides: Partial<IOpalMaintenanceMajorCreditorReferenceDataItem> = {}) => ({
  major_creditor_id: 901,
  business_unit_id: 77,
  major_creditor_code: '0123',
  name: 'Synthetic creditor',
  address_line_1: '1 Test Street',
  address_line_2: null,
  address_line_3: null,
  address_line_4: null,
  address_line_5: null,
  postcode: null,
  country_id: null,
  country_name: null,
  contact_name: null,
  contact_email: null,
  active: true,
  central_authority: false,
  ...overrides,
});

describe('Major creditors load owner', () => {
  it('starts once, scopes the request and allows a fresh retry after failure', () => {
    const first = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const second = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const service = { getMajorCreditors: vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second) };
    const owner = new CasesCreateCasefileMajorCreditorsLoadService(service, 77);
    owner.load();
    owner.load();
    expect(service.getMajorCreditors).toHaveBeenCalledTimes(1);
    expect(service.getMajorCreditors).toHaveBeenCalledWith({
      business_unit_id: 77,
      active: true,
      central_authority: false,
    });
    first.error(new HttpErrorResponse({ status: 503, error: { operation_id: 'synthetic-reference' } }));
    expect(owner.state()).toEqual({ status: 'error', records: [], correlationReference: 'synthetic-reference' });
    owner.load();
    owner.load();
    expect(service.getMajorCreditors).toHaveBeenCalledTimes(2);
    second.next({ count: 0, refData: [] });
    expect(owner.state().status).toBe('empty');
    owner.dispose();
    owner.load();
    expect(service.getMajorCreditors).toHaveBeenCalledTimes(2);
  });

  it('preserves usable response order and clones the accepted records', () => {
    const first = validRecord({ major_creditor_id: 901, name: 'First' });
    const second = validRecord({ major_creditor_id: 902, name: 'Second' });
    const response = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const owner = new CasesCreateCasefileMajorCreditorsLoadService({ getMajorCreditors: () => response }, 77);
    owner.load();
    response.next({ count: 2, refData: [first, second] });
    expect(owner.state()).toEqual({ status: 'ready', records: [first, second], correlationReference: null });
    expect(owner.state().records[0]).not.toBe(first);
    expect(owner.state().records[1]).not.toBe(second);
    owner.dispose();
  });

  it('rejects records outside the active non-Central-Authority Business Unit contract', () => {
    const response = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const owner = new CasesCreateCasefileMajorCreditorsLoadService({ getMajorCreditors: () => response }, 77);
    owner.load();
    response.next({
      count: 6,
      refData: [
        validRecord({ business_unit_id: 78 }),
        validRecord({ active: false }),
        validRecord({ central_authority: true }),
        validRecord({ major_creditor_id: 0 }),
        validRecord({ major_creditor_id: -1 }),
        validRecord({ major_creditor_id: 1.5 }),
      ],
    });
    expect(owner.state()).toEqual({ status: 'empty', records: [], correlationReference: null });
    owner.dispose();
  });

  it('treats completion without a payload as a recoverable error', () => {
    const response = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const owner = new CasesCreateCasefileMajorCreditorsLoadService({ getMajorCreditors: () => response }, 77);
    owner.load();
    response.complete();
    expect(owner.state()).toEqual({ status: 'error', records: [], correlationReference: null });
    owner.dispose();
  });

  it('handles a synchronous request failure and permits retry', () => {
    const response = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const getMajorCreditors = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('Synthetic synchronous failure');
      })
      .mockReturnValueOnce(response);
    const owner = new CasesCreateCasefileMajorCreditorsLoadService({ getMajorCreditors }, 77);
    owner.load();
    expect(owner.state()).toEqual({ status: 'error', records: [], correlationReference: null });
    owner.load();
    response.next({ count: 1, refData: [validRecord()] });
    expect(owner.state().status).toBe('ready');
    owner.dispose();
  });

  it.each([
    new Error('Private failure'),
    new HttpErrorResponse({ status: 500, error: {} }),
    new HttpErrorResponse({ status: 500, error: { operation_id: 42 } }),
    new HttpErrorResponse({ status: 500, error: { operation_id: '   ' } }),
  ])('does not expose an unusable correlation reference', (error) => {
    const owner = new CasesCreateCasefileMajorCreditorsLoadService(
      { getMajorCreditors: () => throwError(() => error) },
      77,
    );
    owner.load();
    expect(owner.state()).toEqual({ status: 'error', records: [], correlationReference: null });
    owner.dispose();
  });

  it('clears records and correlation reference when a retry begins', () => {
    const first = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const second = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const getMajorCreditors = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const owner = new CasesCreateCasefileMajorCreditorsLoadService({ getMajorCreditors }, 77);
    owner.load();
    first.next({ count: 1, refData: [validRecord()] });
    owner.load();
    expect(owner.state()).toEqual({ status: 'loading', records: [], correlationReference: null });
    owner.dispose();
  });

  it('cancels pending work and ignores later source emissions after disposal', () => {
    const response = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const teardown = vi.fn();
    const request = new Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>((subscriber) => {
      const subscription = response.subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        teardown();
      };
    });
    const getMajorCreditors = vi.fn(() => request);
    const owner = new CasesCreateCasefileMajorCreditorsLoadService({ getMajorCreditors }, 77);
    owner.load();
    owner.dispose();
    response.next({ count: 1, refData: [validRecord()] });
    owner.load();
    expect(teardown).toHaveBeenCalledTimes(1);
    expect(getMajorCreditors).toHaveBeenCalledTimes(1);
    expect(owner.state()).toEqual({ status: 'loading', records: [], correlationReference: null });
  });
});
