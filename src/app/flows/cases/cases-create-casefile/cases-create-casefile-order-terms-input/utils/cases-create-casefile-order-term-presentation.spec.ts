import { describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';
import { orderTermPresentation } from './cases-create-casefile-order-term-presentation';

describe('orderTermPresentation', () => {
  it('preserves field order and creates independent option arrays', () => {
    const page: ICasesCreateCasefileOrderTermPage = {
      resultId: 'MAT',
      title: 'Maintenance',
      fields: [
        {
          name: 'frequency',
          id: 'frequency',
          label: 'Frequency',
          kind: 'select',
          required: true,
          hint: '',
          min: null,
          max: null,
          past: false,
          options: [{ value: 'W', label: 'Weekly' }],
          lookup: null,
        },
        {
          name: 'amount',
          id: 'amount',
          label: 'Amount',
          kind: 'money',
          required: true,
          hint: '',
          min: null,
          max: null,
          past: false,
          options: [],
          lookup: null,
        },
      ],
    };

    const presentation = orderTermPresentation(page);

    expect(presentation.fields.map((field) => field.name)).toEqual(['frequency', 'amount']);
    expect(presentation.fields[0].options).toEqual([{ value: 'W', label: 'Weekly' }]);
    expect(presentation.fields[0].options).not.toBe(page.fields[0].options);
    expect(presentation.fields[0].options[0]).not.toBe(page.fields[0].options[0]);
  });
});
