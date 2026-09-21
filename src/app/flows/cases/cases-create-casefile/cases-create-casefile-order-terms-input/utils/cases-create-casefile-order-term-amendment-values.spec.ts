import { TestBed } from '@angular/core/testing';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';
import { amendmentRawValues } from './cases-create-casefile-order-term-amendment-values';

describe('amendmentRawValues', () => {
  let dates: DateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    dates = TestBed.inject(DateService);
  });

  it('rehydrates compatible canonical values without losing falsy values or option selections', () => {
    const fields: ICasesCreateCasefileOrderTermPage['fields'] = [
      ['expiry', 'date'],
      ['amount', 'money'],
      ['count', 'integer'],
      ['active', 'checkbox'],
      ['frequency', 'select'],
    ].map(([name, kind]) => ({
      name,
      id: `field_${name}`,
      label: name,
      kind: kind as 'date' | 'money' | 'integer' | 'checkbox' | 'select',
      required: false,
      hint: '',
      min: null,
      max: null,
      past: false,
      options: name === 'frequency' ? [{ value: 'W', label: 'Weekly' }] : [],
      lookup: null,
    }));
    const page: ICasesCreateCasefileOrderTermPage = { resultId: 'MAT', title: 'Maintenance', fields };
    const term: ICasesCreateCasefileAcceptedOrderTerm = {
      termId: 1,
      resultId: 'MAT',
      creditor: null,
      parameters: { expiry: '2026-09-21', amount: '0.00', count: 0, active: false, frequency: 'W' },
      presentation: {
        title: 'Maintenance',
        fields: fields.map(({ name, label, kind, options }) => ({ name, label, kind, options })),
      },
    };

    expect(amendmentRawValues(term, page, dates)).toEqual({
      expiry: '21/09/2026',
      amount: '0.00',
      count: 0,
      active: false,
      frequency: 'W',
    });
  });

  it('excludes removed, changed-kind and readonly fields', () => {
    const page: ICasesCreateCasefileOrderTermPage = {
      resultId: 'MAT',
      title: 'Maintenance',
      fields: [
        {
          name: 'amount',
          id: 'amount',
          label: 'Amount',
          kind: 'integer',
          required: false,
          hint: '',
          min: null,
          max: null,
          past: false,
          options: [],
          lookup: null,
        },
        {
          name: 'frequency',
          id: 'frequency',
          label: 'Frequency',
          kind: 'readonly',
          required: false,
          hint: '',
          min: null,
          max: null,
          past: false,
          options: [],
          lookup: null,
        },
        {
          name: 'new_field',
          id: 'new_field',
          label: 'New',
          kind: 'text',
          required: false,
          hint: '',
          min: null,
          max: null,
          past: false,
          options: [],
          lookup: null,
        },
      ],
    };
    const term: ICasesCreateCasefileAcceptedOrderTerm = {
      termId: 1,
      resultId: 'MAT',
      creditor: null,
      parameters: { amount: '10.00', frequency: 'Weekly', removed: 'old' },
      presentation: {
        title: 'Maintenance',
        fields: [
          { name: 'amount', label: 'Amount', kind: 'money', options: [] },
          { name: 'frequency', label: 'Frequency', kind: 'readonly', options: [] },
          { name: 'removed', label: 'Removed', kind: 'text', options: [] },
        ],
      },
    };

    expect(amendmentRawValues(term, page, dates)).toEqual({});
  });
});
