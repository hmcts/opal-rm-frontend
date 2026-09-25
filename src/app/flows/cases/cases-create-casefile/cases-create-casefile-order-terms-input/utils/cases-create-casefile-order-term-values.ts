import { FormControl } from '@angular/forms';
import type { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { ICasesCreateCasefileOrderTerm } from '../../interfaces/cases-create-casefile-order-term.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';
import type { CasesCreateCasefileOrderTermRawValue } from '../types/cases-create-casefile-order-term-raw-value.type';
import { createOrderTermValidator } from '../validators/cases-create-casefile-order-term.validator';

export function canonicalOrderTerm(
  page: ICasesCreateCasefileOrderTermPage,
  raw: Record<string, CasesCreateCasefileOrderTermRawValue>,
  dates: DateService,
): ICasesCreateCasefileOrderTerm {
  const entries: [string, string | number | boolean][] = [];
  for (const field of page.fields) {
    if (field.kind === 'readonly') continue;
    const value = raw[field.id] ?? (field.kind === 'checkbox' ? false : null);
    if (createOrderTermValidator(field, dates)(new FormControl(value))) throw new Error('Invalid order term');
    if (value == null || (typeof value === 'string' && !value.trim())) continue;
    if (field.kind === 'checkbox') {
      entries.push([field.name, value === true]);
      continue;
    }
    const text = String(value).trim();
    if (field.kind === 'money') {
      const [whole, fraction = ''] = text.split('.');
      entries.push([field.name, `${BigInt(whole)}.${fraction.padEnd(2, '0')}`]);
    } else if (field.kind === 'integer') entries.push([field.name, Number(text)]);
    else if (field.kind === 'date')
      entries.push([field.name, dates.getFromFormat(text, 'dd/MM/yyyy').toFormat('yyyy-MM-dd')]);
    else entries.push([field.name, text]);
  }
  return { resultId: page.resultId, parameters: Object.fromEntries(entries) };
}
