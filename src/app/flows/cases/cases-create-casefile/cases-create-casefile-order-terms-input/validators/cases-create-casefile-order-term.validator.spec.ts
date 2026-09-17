import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from '../../../services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';
import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';
import { mapOrderTermParameters } from '../utils/cases-create-casefile-order-term-metadata';
import { createOrderTermValidator } from './cases-create-casefile-order-term.validator';

describe('createOrderTermValidator', () => {
  let dates: DateService;
  const fields = mapOrderTermParameters(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MAT'].result_parameters);
  const childFields = mapOrderTermParameters(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MCHILD'].result_parameters);

  const field = (overrides: Partial<ICasesCreateCasefileOrderTermField>): ICasesCreateCasefileOrderTermField => ({
    name: 'test',
    id: 'create_casefile_order_terms_input_test',
    label: 'Test value',
    kind: 'text',
    required: false,
    hint: '',
    min: null,
    max: null,
    past: false,
    options: [],
    lookup: null,
    ...overrides,
  });

  const errors = (definition: ICasesCreateCasefileOrderTermField, raw: unknown) =>
    createOrderTermValidator(definition, dates)(new FormControl(raw));

  beforeEach(() => {
    TestBed.configureTestingModule({});
    dates = TestBed.inject(DateService);
    vi.spyOn(dates, 'getDateNow').mockReturnValue(DateTime.fromISO('2026-09-17'));
  });

  it.each([
    ['', 'required'],
    ['abc', 'numeric'],
    ['1e2', 'numeric'],
    ['1,000', 'numeric'],
    ['-1', 'min'],
    ['1.234', 'precision'],
    ['0', null],
    ['00.10', null],
    ['1.2', null],
    ['12.30', null],
  ])('validates amount %s without changing the raw value', (raw, error) => {
    const amount = fields.find((item) => item.name === 'amount')!;
    const control = new FormControl(raw, createOrderTermValidator(amount, dates));
    expect(control.errors).toEqual(error ? { [error]: true } : null);
    expect(control.value).toBe(raw);
  });

  it.each([
    [null, null],
    ['', null],
    ['   ', null],
    ['31/02/2026', 'invalidDate'],
    ['2026-09-16', 'invalidDate'],
    ['16/09/2026', null],
    ['29/02/2024', null],
    ['29/02/2025', 'invalidDate'],
  ])('validates optional expiry %s', (raw, error) => {
    const expiry = fields.find((item) => item.name === 'expiry_date')!;
    expect(errors(expiry, raw)).toEqual(error ? { [error]: true } : null);
  });

  it.each([
    ['16/09/2026', null],
    ['17/09/2026', 'past'],
    ['18/09/2026', 'past'],
  ])('requires birth date %s to be before today', (raw, error) => {
    const birthDate = childFields.find((item) => item.name === 'child_date_of_birth')!;
    expect(errors(birthDate, raw)).toEqual(error ? { [error]: true } : null);
  });

  it.each([
    ['00.10', 'min'],
    ['1.2', 'min'],
    ['-0.01', 'min'],
    ['1.', 'numeric'],
    ['.10', 'numeric'],
    ['1.2.3', 'numeric'],
    ['10.001', 'precision'],
    ['9.99', 'min'],
    ['10.00', null],
    ['20.00', null],
    ['20.01', 'max'],
  ])('validates bounded money %s', (raw, error) => {
    const money = field({ kind: 'money', min: '10.00', max: '20.00' });
    expect(errors(money, raw)).toEqual(error ? { [error]: true } : null);
  });

  it.each([
    ['1.5', 'integer'],
    ['1e2', 'integer'],
    ['9007199254740992', 'integer'],
    ['-1', 'min'],
    ['0', null],
    ['10', null],
    ['11', 'max'],
  ])('validates bounded integer %s', (raw, error) => {
    const integer = field({ kind: 'integer', min: 0, max: 10 });
    expect(errors(integer, raw)).toEqual(error ? { [error]: true } : null);
  });

  it.each([
    [' ', null],
    [' a ', 'minLength'],
    [' ab ', null],
    [' abcde ', null],
    [' abcdef ', 'maxLength'],
  ])('validates trimmed text length for %s', (raw, error) => {
    const text = field({ kind: 'text', min: 2, max: 5 });
    expect(errors(text, raw)).toEqual(error ? { [error]: true } : null);
  });

  it.each([
    ['28/02/2024', 'min'],
    ['29/02/2024', null],
    ['01/03/2024', null],
    ['02/03/2024', 'max'],
  ])('validates concrete date bounds for %s', (raw, error) => {
    const date = field({ kind: 'date', min: '2024-02-29', max: '2024-03-01' });
    expect(errors(date, raw)).toEqual(error ? { [error]: true } : null);
  });

  it.each(['select', 'radio', 'autocomplete'] as const)('accepts only configured %s option values', (kind) => {
    const choice = field({ kind, options: [{ value: 'A', label: 'Alpha' }] });
    expect(errors(choice, 'A')).toBeNull();
    expect(errors(choice, 'Alpha')).toEqual({ choice: true });
    expect(errors(choice, 'unknown')).toEqual({ choice: true });
  });

  it('validates required and optional checkboxes', () => {
    expect(errors(field({ kind: 'checkbox', required: true }), false)).toEqual({ required: true });
    expect(errors(field({ kind: 'checkbox', required: true }), true)).toBeNull();
    expect(errors(field({ kind: 'checkbox' }), false)).toBeNull();
    expect(errors(field({ kind: 'checkbox' }), null)).toBeNull();
    expect(errors(field({ kind: 'checkbox' }), 'true')).toEqual({ choice: true });
  });

  it('ignores readonly values and rejects non-string values for other fields', () => {
    expect(errors(field({ kind: 'readonly', required: true }), undefined)).toBeNull();
    expect(errors(field({ kind: 'text' }), 123)).toEqual({ choice: true });
  });
});
