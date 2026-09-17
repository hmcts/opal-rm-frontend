import { TestBed } from '@angular/core/testing';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from '../../../services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';
import { mapOrderTermParameters } from './cases-create-casefile-order-term-metadata';
import { canonicalOrderTerm } from './cases-create-casefile-order-term-values';

describe('canonicalOrderTerm', () => {
  let dates: DateService;
  const fields = mapOrderTermParameters(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MAT'].result_parameters);
  const childFields = mapOrderTermParameters(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MCHILD'].result_parameters);

  beforeEach(() => {
    TestBed.configureTestingModule({});
    dates = TestBed.inject(DateService);
    vi.spyOn(dates, 'getDateNow').mockReturnValue(DateTime.fromISO('2026-09-17'));
  });

  it('preserves money exactly and never saves frequency or removed fields', () => {
    expect(
      canonicalOrderTerm(
        { resultId: 'MAT', title: 'Maintenance', fields },
        {
          create_casefile_order_terms_input_amount: '9007199254740993.10',
          create_casefile_order_terms_input_frequency: 'Weekly',
          create_casefile_order_terms_input_removed: 'stale',
        },
        dates,
      ),
    ).toEqual({ resultId: 'MAT', parameters: { amount: '9007199254740993.10' } });
  });

  it('normalizes money, integer, date, choice, text and checkbox values', () => {
    const page: ICasesCreateCasefileOrderTermPage = {
      resultId: 'TEST',
      title: 'Test',
      fields: [
        { ...fields[0], id: 'money', name: 'money' },
        { ...fields[0], id: 'integer', name: 'integer', kind: 'integer', min: 0 },
        { ...fields[2], id: 'date', name: 'date' },
        {
          ...fields[2],
          id: 'choice',
          name: 'choice',
          kind: 'select',
          options: [{ value: 'A', label: 'Alpha' }],
        },
        { ...fields[2], id: 'text', name: 'text', kind: 'text' },
        { ...fields[2], id: 'check', name: 'check', kind: 'checkbox' },
      ],
    };
    expect(
      canonicalOrderTerm(
        page,
        { money: '00.1', integer: '7', date: '16/09/2026', choice: 'A', text: '  hello  ', check: true },
        dates,
      ),
    ).toEqual({
      resultId: 'TEST',
      parameters: { money: '0.10', integer: 7, date: '2026-09-16', choice: 'A', text: 'hello', check: true },
    });
  });

  it('omits optional blank values and emits false for an absent optional checkbox', () => {
    const page: ICasesCreateCasefileOrderTermPage = {
      resultId: 'TEST',
      title: 'Test',
      fields: [
        { ...fields[2], id: 'blank', name: 'blank', kind: 'text' },
        { ...fields[2], id: 'check', name: 'check', kind: 'checkbox' },
      ],
    };
    expect(canonicalOrderTerm(page, { blank: '   ' }, dates)).toEqual({
      resultId: 'TEST',
      parameters: { check: false },
    });
  });

  it('revalidates raw values before mapping', () => {
    expect(() =>
      canonicalOrderTerm(
        { resultId: 'MCHILD', title: 'Child maintenance', fields: childFields },
        {
          create_casefile_order_terms_input_child_name: 'Child',
          create_casefile_order_terms_input_child_date_of_birth: '17/09/2026',
          create_casefile_order_terms_input_amount: '10.00',
        },
        dates,
      ),
    ).toThrowError('Invalid order term');
  });
});
