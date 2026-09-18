import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, Subject, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import { fetchCasesCreateCasefileMajorCreditorsResolver } from './fetch-cases-create-casefile-major-creditors.resolver';

const usable = {
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
};

@Component({ template: '<h1>Start</h1>' })
class StartComponent {}

@Component({ template: '<h1>Creditor</h1>' })
class CreditorComponent {
  public readonly majorCreditors = inject(ActivatedRoute).snapshot.data[
    'majorCreditors'
  ] as IOpalMaintenanceMajorCreditorReferenceDataResponse;
}

function configure(getMajorCreditors: ReturnType<typeof vi.fn>): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: OpalMaintenanceService, useValue: { getMajorCreditors } },
      provideRouter([
        { path: 'start', component: StartComponent },
        {
          path: 'creditor',
          component: CreditorComponent,
          resolve: { majorCreditors: fetchCasesCreateCasefileMajorCreditorsResolver },
        },
      ]),
    ],
  });
}

describe('fetchCasesCreateCasefileMajorCreditorsResolver', () => {
  it('waits for the unconditional scoped request and passes usable records in server order', async () => {
    const pending = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const getMajorCreditors = vi.fn(() => pending);
    configure(getMajorCreditors);
    const harness = await RouterTestingHarness.create('/start');

    let settled = false;
    const navigation = harness.navigateByUrl('/creditor').finally(() => {
      settled = true;
    });
    await vi.waitFor(() => expect(getMajorCreditors).toHaveBeenCalledOnce());

    expect(settled).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/start');
    expect(getMajorCreditors).toHaveBeenCalledExactlyOnceWith({
      business_unit_id: 77,
      active: true,
      central_authority: false,
    });

    pending.next({
      count: 5,
      refData: [
        { ...usable, major_creditor_id: 902, major_creditor_code: 'SECOND' },
        { ...usable, major_creditor_id: 0, major_creditor_code: 'INVALID-ID' },
        { ...usable, major_creditor_id: 901, major_creditor_code: 'FIRST' },
        { ...usable, major_creditor_id: 903, business_unit_id: 78 },
        { ...usable, major_creditor_id: 904, central_authority: true },
      ],
    });
    pending.complete();

    const component = (await navigation) as CreditorComponent;
    expect(component.majorCreditors).toEqual({
      count: 2,
      refData: [
        { ...usable, major_creditor_id: 902, major_creditor_code: 'SECOND' },
        { ...usable, major_creditor_id: 901, major_creditor_code: 'FIRST' },
      ],
    });
  });

  it('activates with an empty successful response so non-Major choices remain available', async () => {
    const getMajorCreditors = vi.fn(
      () =>
        new Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>((subscriber) => {
          subscriber.next({ count: 0, refData: [] });
          subscriber.complete();
        }),
    );
    configure(getMajorCreditors);

    const harness = await RouterTestingHarness.create('/creditor');
    const component = harness.routeDebugElement?.componentInstance as CreditorComponent;
    expect(component.majorCreditors).toEqual({ count: 0, refData: [] });
  });

  it('prevents activation and propagates an HTTP failure', async () => {
    const failure = new Error('Synthetic Major creditor failure');
    configure(vi.fn(() => throwError(() => failure)));
    const harness = await RouterTestingHarness.create('/start');

    await expect(harness.navigateByUrl('/creditor')).rejects.toThrow(failure);
    expect(TestBed.inject(Router).url).toBe('/start');
  });

  it('cancels the pending request when navigation is superseded', async () => {
    const teardown = vi.fn();
    configure(
      vi.fn(
        () =>
          new Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>(() => {
            return teardown;
          }),
      ),
    );
    const harness = await RouterTestingHarness.create('/start');

    const pendingNavigation = harness.navigateByUrl('/creditor');
    await vi.waitFor(() =>
      expect(TestBed.inject(Router).getCurrentNavigation()?.finalUrl?.toString()).toBe('/creditor'),
    );
    await harness.navigateByUrl('/start');
    await pendingNavigation;

    expect(teardown).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).url).toBe('/start');
  });
});
