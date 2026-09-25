import { TestBed } from '@angular/core/testing';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceApplicationReferenceDataItem } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-item.interface';
import type { ICasesCreateCasefileOrderDetails } from '../../interfaces/cases-create-casefile-order-details.interface';
import type { ICasesCreateCasefileOrderDetailsFormData } from '../interfaces/cases-create-casefile-order-details-form-data.interface';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES } from '../constants/cases-create-casefile-order-details-payment-frequencies.constant';
import { CasesCreateCasefileOrderDetailsMapperService } from './cases-create-casefile-order-details-mapper.service';

describe('CasesCreateCasefileOrderDetailsMapperService', () => {
  let mapper: CasesCreateCasefileOrderDetailsMapperService;

  const applications: IOpalMaintenanceApplicationReferenceDataItem[] = [
    {
      application_id: 901,
      application_code: 'TEST01',
      application_title: 'Synthetic application',
      application_group: 'Synthetic group',
      active: true,
    },
    {
      application_id: 902,
      application_code: 'TEST02',
      application_title: 'Second application',
      application_group: 'Synthetic group',
      active: true,
    },
  ];

  const validFormData: ICasesCreateCasefileOrderDetailsFormData = {
    create_casefile_order_details_application_id: '901',
    create_casefile_order_details_court: '  Test Court  ',
    create_casefile_order_details_date_order_made: '01/09/2026',
    create_casefile_order_details_payment_frequency: 'Monthly',
    create_casefile_order_details_date_arrears_last_updated: '15/09/2026',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    vi.spyOn(TestBed.inject(DateService), 'getDateNow').mockReturnValue(DateTime.fromISO('2026-09-16'));
    mapper = TestBed.inject(CasesCreateCasefileOrderDetailsMapperService);
  });

  it('maps application records to autocomplete items', () => {
    expect(mapper.toAutocompleteItems(applications)).toEqual([
      { name: 'TEST01 - Synthetic application', value: 901 },
      { name: 'TEST02 - Second application', value: 902 },
    ]);
  });

  it('maps an empty snapshot to complete empty form data', () => {
    expect(mapper.toFormData(null)).toEqual({
      create_casefile_order_details_application_id: null,
      create_casefile_order_details_court: null,
      create_casefile_order_details_date_order_made: null,
      create_casefile_order_details_payment_frequency: null,
      create_casefile_order_details_date_arrears_last_updated: null,
    });
  });

  it('preserves a numeric saved application ID and maps canonical dates for editing', () => {
    const saved: ICasesCreateCasefileOrderDetails = {
      applicationId: 999,
      court: 'Test Court',
      dateOrderMade: '2026-09-01',
      paymentFrequency: 'Monthly',
      dateArrearsLastUpdated: '2026-09-15',
    };

    expect(mapper.toFormData(saved)).toEqual({
      create_casefile_order_details_application_id: 999,
      create_casefile_order_details_court: 'Test Court',
      create_casefile_order_details_date_order_made: '01/09/2026',
      create_casefile_order_details_payment_frequency: 'Monthly',
      create_casefile_order_details_date_arrears_last_updated: '15/09/2026',
    });
  });

  it('maps valid form data to canonical Order Details and trims court', () => {
    expect(mapper.toOrderDetails(validFormData, applications)).toEqual({
      applicationId: 901,
      court: 'Test Court',
      dateOrderMade: '2026-09-01',
      paymentFrequency: 'Monthly',
      dateArrearsLastUpdated: '2026-09-15',
    });
  });

  it('round-trips a saved snapshot without changing its domain values', () => {
    const saved: ICasesCreateCasefileOrderDetails = {
      applicationId: 901,
      court: 'Test Court',
      dateOrderMade: '2026-09-01',
      paymentFrequency: 'Fortnightly',
      dateArrearsLastUpdated: '2026-09-15',
    };

    expect(mapper.toOrderDetails(mapper.toFormData(saved), applications)).toEqual(saved);
  });

  it('maps blank optional court and date to null', () => {
    expect(
      mapper.toOrderDetails(
        {
          ...validFormData,
          create_casefile_order_details_court: '   ',
          create_casefile_order_details_date_order_made: '',
        },
        applications,
      ),
    ).toEqual({
      applicationId: 901,
      court: null,
      dateOrderMade: null,
      paymentFrequency: 'Monthly',
      dateArrearsLastUpdated: '2026-09-15',
    });
  });

  it.each(CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES)(
    'accepts the local display frequency %s',
    (paymentFrequency) => {
      expect(
        mapper.toOrderDetails(
          { ...validFormData, create_casefile_order_details_payment_frequency: paymentFrequency },
          applications,
        ).paymentFrequency,
      ).toBe(paymentFrequency);
    },
  );

  it.each([999, 'TEST01 - Synthetic application', ' 901', '901x'])(
    'rejects stale or non-canonical application selection %s',
    (applicationId) => {
      expect(() =>
        mapper.toOrderDetails(
          { ...validFormData, create_casefile_order_details_application_id: applicationId },
          applications,
        ),
      ).toThrow('Invalid Order Details selection');
    },
  );

  it('rejects an unsupported payment frequency', () => {
    expect(() =>
      mapper.toOrderDetails(
        { ...validFormData, create_casefile_order_details_payment_frequency: 'Every two months' },
        applications,
      ),
    ).toThrow('Invalid Order Details selection');
  });

  it('rejects a court longer than 40 characters after trimming', () => {
    expect(() =>
      mapper.toOrderDetails(
        { ...validFormData, create_casefile_order_details_court: ` ${'A'.repeat(41)} ` },
        applications,
      ),
    ).toThrow('Invalid Order Details selection');
  });

  it('rejects an empty required arrears date', () => {
    expect(() =>
      mapper.toOrderDetails(
        { ...validFormData, create_casefile_order_details_date_arrears_last_updated: null },
        applications,
      ),
    ).toThrow('Invalid Order Details date');
  });

  it.each([
    ['16/09', '15/09/2026'],
    ['31/02/2026', '15/09/2026'],
    ['17/09/2026', '15/09/2026'],
    ['01/09/2026', '31/02/2026'],
    ['01/09/2026', '17/09/2026'],
  ])('rejects invalid boundary dates %s and %s', (dateOrderMade, dateArrearsLastUpdated) => {
    expect(() =>
      mapper.toOrderDetails(
        {
          ...validFormData,
          create_casefile_order_details_date_order_made: dateOrderMade,
          create_casefile_order_details_date_arrears_last_updated: dateArrearsLastUpdated,
        },
        applications,
      ),
    ).toThrow('Invalid Order Details date');
  });
});
