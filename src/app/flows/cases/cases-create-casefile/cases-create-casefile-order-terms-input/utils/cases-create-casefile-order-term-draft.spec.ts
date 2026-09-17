import { describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileOrderTermDraft } from '../../interfaces/cases-create-casefile-order-term-draft.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';
import { restoreOrderTermDraft } from './cases-create-casefile-order-term-draft';

const page: ICasesCreateCasefileOrderTermPage = {
  resultId: 'MAT',
  title: 'Maintenance',
  fields: [
    {
      name: 'amount',
      id: 'create_casefile_order_terms_input_amount',
      label: 'Amount',
      kind: 'money',
      required: true,
      hint: '',
      min: 0,
      max: null,
      past: false,
      options: [],
      lookup: null,
    },
    {
      name: 'frequency',
      id: 'create_casefile_order_terms_input_frequency',
      label: 'Payment frequency',
      kind: 'readonly',
      required: true,
      hint: '',
      min: null,
      max: null,
      past: false,
      options: [],
      lookup: null,
    },
    {
      name: 'expiry_date',
      id: 'create_casefile_order_terms_input_expiry_date',
      label: 'Expiry date',
      kind: 'date',
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

const previous: ICasesCreateCasefileOrderTermDraft = {
  resultId: 'MAT',
  fieldTypes: { amount: 'money', expiry_date: 'date', removed: 'text' },
  values: { amount: '12.30', expiry_date: '31/03/2027', removed: 'stale', frequency: 'Weekly' },
  dirty: true,
};

describe('restoreOrderTermDraft', () => {
  it('restores values with the same Result, parameter name and kind', () => {
    expect(restoreOrderTermDraft(page, previous)).toEqual({
      resultId: 'MAT',
      fieldTypes: { amount: 'money', expiry_date: 'date' },
      values: { amount: '12.30', expiry_date: '31/03/2027' },
      dirty: true,
    });
  });

  it('removes values when a parameter kind changes or the parameter disappears', () => {
    const changedPage = {
      ...page,
      fields: page.fields
        .filter((field) => field.name !== 'expiry_date')
        .map((field) => (field.name === 'amount' ? { ...field, kind: 'integer' as const } : field)),
    };

    expect(restoreOrderTermDraft(changedPage, previous)).toEqual({
      resultId: 'MAT',
      fieldTypes: { amount: 'integer' },
      values: {},
      dirty: false,
    });
  });

  it('isolates drafts for different Results', () => {
    expect(restoreOrderTermDraft({ ...page, resultId: 'MCHILD' }, previous)).toEqual({
      resultId: 'MCHILD',
      fieldTypes: { amount: 'money', expiry_date: 'date' },
      values: {},
      dirty: false,
    });
  });

  it('retains a same-kind value when validation constraints change', () => {
    const changedBounds = {
      ...page,
      fields: page.fields.map((field) => (field.name === 'amount' ? { ...field, min: 20, max: 100 } : field)),
    };

    expect(restoreOrderTermDraft(changedBounds, previous).values).toEqual({
      amount: '12.30',
      expiry_date: '31/03/2027',
    });
  });

  it('never includes frequency when metadata changes', () => {
    const editableFrequency = {
      ...page,
      fields: page.fields.map((field) =>
        field.name === 'frequency'
          ? { ...field, kind: 'select' as const, options: [{ value: 'W', label: 'Weekly' }] }
          : field,
      ),
    };

    expect(restoreOrderTermDraft(editableFrequency, previous)).toEqual({
      resultId: 'MAT',
      fieldTypes: { amount: 'money', frequency: 'select', expiry_date: 'date' },
      values: { amount: '12.30', expiry_date: '31/03/2027' },
      dirty: true,
    });
  });
});
