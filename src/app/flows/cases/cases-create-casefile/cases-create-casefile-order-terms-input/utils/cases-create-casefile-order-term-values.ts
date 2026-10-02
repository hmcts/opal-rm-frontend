import { FormControl } from '@angular/forms';
import type { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { ICasesCreateCasefileOrderTerm } from '../../interfaces/cases-create-casefile-order-term.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';
import type { CasesCreateCasefileOrderTermRawValue } from '../types/cases-create-casefile-order-term-raw-value.type';
import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';
import { createOrderTermValidator } from '../validators/cases-create-casefile-order-term.validator';

const emptyValue = (field: ICasesCreateCasefileOrderTermField): CasesCreateCasefileOrderTermRawValue => {
  if (field.kind !== 'checkbox') return null;
  return field.options.length ? [] : false;
};

const canonicalValue = (
  field: ICasesCreateCasefileOrderTermField,
  value: Exclude<CasesCreateCasefileOrderTermRawValue, null>,
  dates: DateService,
): string | string[] | number | boolean => {
  if (field.kind === 'checkbox') {
    if (Array.isArray(value))
      return field.options.filter((option) => value.includes(option.value)).map((option) => option.value);
    return value === true;
  }
  const text = String(value).trim();
  switch (field.kind) {
    case 'money': {
      const [whole, fraction = ''] = text.replace(/^-/, '').split('.');
      const sign = text.startsWith('-') && /[1-9]/.test(text) ? '-' : '';
      return `${sign}${BigInt(whole)}.${fraction.padEnd(2, '0')}`;
    }
    case 'integer':
      return Number(text);
    case 'date':
      return dates.getFromFormat(text, 'dd/MM/yyyy').toFormat('yyyy-MM-dd');
    default:
      return text;
  }
};

export function canonicalOrderTerm(
  page: ICasesCreateCasefileOrderTermPage,
  raw: Record<string, CasesCreateCasefileOrderTermRawValue>,
  dates: DateService,
): ICasesCreateCasefileOrderTerm {
  const entries: [string, string | string[] | number | boolean][] = [];
  for (const field of page.fields) {
    if (field.kind === 'readonly') continue;
    const value = raw[field.id] ?? emptyValue(field);
    if (createOrderTermValidator(field, dates)(new FormControl(value))) throw new Error('Invalid order term');
    if (value == null || (typeof value === 'string' && !value.trim())) continue;
    entries.push([field.name, canonicalValue(field, value, dates)]);
  }
  return { resultId: page.resultId, parameters: Object.fromEntries(entries) };
}
