import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceResultReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-result-reference-data-response.interface';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import { OPAL_MAINTENANCE_RESULTS_MOCK } from '../../../../services/opal-maintenance-service/mocks/opal-maintenance-results.mock';
import { fetchCasesCreateCasefileOrderTermsResolver } from './fetch-cases-create-casefile-order-terms.resolver';

@Component({ template: '<h1>Test destination</h1>' })
class TestDestinationComponent {}

describe('Order terms resolver activation lifecycle', () => {
  it('disposes the pending request if another resolver cancels activation', async () => {
    const teardown = vi.fn();
    const getResults = vi.fn(() => new Observable<IOpalMaintenanceResultReferenceDataResponse>(() => teardown));
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: { getResults } },
        provideRouter([
          { path: 'start', component: TestDestinationComponent },
          {
            path: 'selection',
            component: TestDestinationComponent,
            resolve: { orderTerms: fetchCasesCreateCasefileOrderTermsResolver, cancelled: () => EMPTY },
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/start');
    await harness.navigateByUrl('/selection');
    expect(getResults).toHaveBeenCalledExactlyOnceWith({ order_term: true, active: true });
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('disposes the pending request when another resolver errors', async () => {
    const teardown = vi.fn();
    const getResults = vi.fn(() => new Observable<IOpalMaintenanceResultReferenceDataResponse>(() => teardown));
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: { getResults } },
        provideRouter([
          { path: 'start', component: TestDestinationComponent },
          {
            path: 'selection',
            component: TestDestinationComponent,
            resolve: {
              orderTerms: fetchCasesCreateCasefileOrderTermsResolver,
              failed: () => throwError(() => new Error('Synthetic resolver failure')),
            },
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/start');
    await expect(harness.navigateByUrl('/selection')).rejects.toThrow('Synthetic resolver failure');
    expect(getResults).toHaveBeenCalledTimes(1);
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('creates a fresh owner and loads again on a second visit', async () => {
    const getResults = vi.fn(() => of(structuredClone(OPAL_MAINTENANCE_RESULTS_MOCK)));
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: { getResults } },
        provideRouter([
          { path: 'start', component: TestDestinationComponent },
          {
            path: 'selection',
            component: TestDestinationComponent,
            resolve: { orderTerms: fetchCasesCreateCasefileOrderTermsResolver },
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/start');
    await harness.navigateByUrl('/selection');
    await harness.navigateByUrl('/start');
    await harness.navigateByUrl('/selection');
    expect(getResults).toHaveBeenCalledTimes(2);
  });
});
