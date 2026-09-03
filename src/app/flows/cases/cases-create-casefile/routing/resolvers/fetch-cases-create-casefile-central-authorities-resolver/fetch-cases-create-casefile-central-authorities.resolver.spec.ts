import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { fetchCasesCreateCasefileCentralAuthoritiesResolver } from './fetch-cases-create-casefile-central-authorities.resolver';

describe('fetchCasesCreateCasefileCentralAuthoritiesResolver', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  const response: IOpalMaintenanceMajorCreditorReferenceDataResponse = {
    count: 1,
    refData: [
      {
        major_creditor_id: 1,
        business_unit_id: 77,
        major_creditor_code: '0001',
        name: 'Central authority',
        address_line_1: '1 Central Street',
        address_line_2: null,
        address_line_3: null,
        address_line_4: null,
        address_line_5: null,
        postcode: null,
        country_id: null,
        country_name: null,
        contact_name: null,
        contact_email: null,
        central_authority: true,
        active: true,
      },
    ],
  };
  const maintenanceService = { getMajorCreditors: vi.fn() };
  const globalStore = { setBannerError: vi.fn() };

  const executeResolver = () =>
    TestBed.runInInjectionContext(() => fetchCasesCreateCasefileCentralAuthoritiesResolver(route, state));

  beforeEach(() => {
    vi.clearAllMocks();
    maintenanceService.getMajorCreditors.mockReturnValue(of(response));
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: maintenanceService },
        { provide: GlobalStore, useValue: globalStore },
      ],
    });
  });

  it('returns the unmodified active Central Authorities response', async () => {
    await expect(firstValueFrom(executeResolver() as Observable<typeof response>)).resolves.toBe(response);
    expect(maintenanceService.getMajorCreditors).toHaveBeenCalledWith({
      business_unit_id: 77,
      central_authority: true,
      active: true,
    });
  });

  it('propagates HTTP failures so route activation is cancelled', async () => {
    const problem = new HttpErrorResponse({ status: 503, error: { detail: 'Major Creditors unavailable' } });
    maintenanceService.getMajorCreditors.mockReturnValue(throwError(() => problem));

    await expect(firstValueFrom(executeResolver() as Observable<never>)).rejects.toBe(problem);
  });

  it('sets the generic banner and completes without a value for an empty response', async () => {
    maintenanceService.getMajorCreditors.mockReturnValue(of({ count: 0, refData: [] }));

    await expect(
      firstValueFrom(executeResolver() as Observable<typeof response>, { defaultValue: null }),
    ).resolves.toBeNull();
    expect(globalStore.setBannerError).toHaveBeenCalledWith({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
  });
});
