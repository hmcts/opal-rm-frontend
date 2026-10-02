import type { ICasesCreateCasefileOrderTermDatePermissions } from '../interfaces/cases-create-casefile-order-term-date-permissions.interface';
import type { ValidatorFn } from '@angular/forms';
import type { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';

const blank = (value: unknown): boolean => value == null || (typeof value === 'string' && !value.trim());

const units = (value: string): bigint => {
  const [whole, fraction = ''] = value.replace(/^-/, '').split('.');
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return value.startsWith('-') ? -amount : amount;
};

const moneyError = (value: string, field: ICasesCreateCasefileOrderTermField): string | null => {
  if (!/^-?\d+(\.\d+)?$/.test(value)) return 'numeric';
  if ((value.split('.')[1]?.length ?? 0) > 2) return 'precision';
  const amount = units(value);
  if (field.min !== null && amount < units(String(field.min))) return 'min';
  if (field.max !== null && amount > units(String(field.max))) return 'max';
  return null;
};

const integerError = (value: string, field: ICasesCreateCasefileOrderTermField): string | null => {
  if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) return 'integer';
  if (field.min !== null && Number(value) < Number(field.min)) return 'min';
  if (field.max !== null && Number(value) > Number(field.max)) return 'max';
  return null;
};

const datePermitted = (
  iso: string,
  today: string,
  permissions: ICasesCreateCasefileOrderTermDatePermissions,
): boolean => {
  if (iso < today) return permissions.past;
  if (iso === today) return permissions.today;
  return permissions.future;
};

const dateError = (value: string, field: ICasesCreateCasefileOrderTermField, dates: DateService): string | null => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return 'invalidDate';
  const date = dates.getFromFormat(value, 'dd/MM/yyyy');
  if (!date.isValid) return 'invalidDate';
  const iso = date.toFormat('yyyy-MM-dd');
  if (field.past && iso >= dates.getDateNow().toFormat('yyyy-MM-dd')) return 'past';
  if (field.datePermissions && !datePermitted(iso, dates.getDateNow().toFormat('yyyy-MM-dd'), field.datePermissions))
    return 'datePeriod';
  if (field.min !== null && iso < String(field.min)) return 'min';
  if (field.max !== null && iso > String(field.max)) return 'max';
  return null;
};

const checkboxErrors = (raw: unknown, field: ICasesCreateCasefileOrderTermField) => {
  if (
    !Array.isArray(raw) ||
    new Set(raw).size !== raw.length ||
    raw.some((value) => !field.options.some((option) => option.value === value))
  )
    return { choice: true };
  if (!raw.length) return field.required ? { required: true } : null;
  if (field.min !== null && raw.length < Number(field.min)) return { minSelections: true };
  if (field.max !== null && raw.length > Number(field.max)) return { maxSelections: true };
  return null;
};

const booleanCheckboxErrors = (raw: unknown, required: boolean) => {
  if (raw !== true && raw !== false && raw != null) return { choice: true };
  return required && raw !== true ? { required: true } : null;
};

const textError = (value: string, field: ICasesCreateCasefileOrderTermField): string | null => {
  if (field.min !== null && value.length < Number(field.min)) return 'minLength';
  if (field.max !== null && value.length > Number(field.max)) return 'maxLength';
  return null;
};

const valueError = (raw: string, field: ICasesCreateCasefileOrderTermField, dates: DateService): string | null => {
  const value = raw.trim();
  switch (field.kind) {
    case 'money':
      return moneyError(value, field);
    case 'integer':
      return integerError(value, field);
    case 'date':
      return dateError(value, field, dates);
    case 'select':
    case 'radio':
    case 'autocomplete':
      return field.options.some((option) => option.value === raw) ? null : 'choice';
    default:
      return textError(value, field);
  }
};

export function createOrderTermValidator(field: ICasesCreateCasefileOrderTermField, dates: DateService): ValidatorFn {
  return (control) => {
    const raw: unknown = control.value;
    if (field.kind === 'readonly') return null;
    if (field.kind === 'checkbox') {
      return field.options.length ? checkboxErrors(raw, field) : booleanCheckboxErrors(raw, field.required);
    }
    if (blank(raw)) return field.required ? { required: true } : null;
    if (typeof raw !== 'string') return { choice: true };
    const error = valueError(raw, field, dates);
    return error ? { [error]: true } : null;
  };
}
