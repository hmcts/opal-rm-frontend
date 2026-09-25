import type { ValidatorFn } from '@angular/forms';
import type { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';

const blank = (value: unknown): boolean => value == null || (typeof value === 'string' && !value.trim());

const units = (value: string): bigint => {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};

const moneyError = (value: string, field: ICasesCreateCasefileOrderTermField): string | null => {
  if (!/^-?\d+(\.\d+)?$/.test(value)) return 'numeric';
  if (value.startsWith('-')) return 'min';
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

const dateError = (value: string, field: ICasesCreateCasefileOrderTermField, dates: DateService): string | null => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return 'invalidDate';
  const date = dates.getFromFormat(value, 'dd/MM/yyyy');
  if (!date.isValid) return 'invalidDate';
  const iso = date.toFormat('yyyy-MM-dd');
  if (field.past && iso >= dates.getDateNow().toFormat('yyyy-MM-dd')) return 'past';
  if (field.min !== null && iso < String(field.min)) return 'min';
  if (field.max !== null && iso > String(field.max)) return 'max';
  return null;
};

export function createOrderTermValidator(field: ICasesCreateCasefileOrderTermField, dates: DateService): ValidatorFn {
  return (control) => {
    const raw: unknown = control.value;
    if (field.kind === 'readonly') return null;
    if (field.kind === 'checkbox') {
      if (raw !== true && raw !== false && raw != null) return { choice: true };
      return field.required && raw !== true ? { required: true } : null;
    }
    if (blank(raw)) return field.required ? { required: true } : null;
    if (typeof raw !== 'string') return { choice: true };
    const value = raw.trim();
    let error: string | null = null;
    switch (field.kind) {
      case 'money':
        error = moneyError(value, field);
        break;
      case 'integer':
        error = integerError(value, field);
        break;
      case 'date':
        error = dateError(value, field, dates);
        break;
      case 'select':
      case 'radio':
      case 'autocomplete':
        error = field.options.some((option) => option.value === raw) ? null : 'choice';
        break;
      case 'text':
      case 'long_text':
        if (field.min !== null && value.length < Number(field.min)) error = 'minLength';
        else if (field.max !== null && value.length > Number(field.max)) error = 'maxLength';
        break;
    }
    return error ? { [error]: true } : null;
  };
}
