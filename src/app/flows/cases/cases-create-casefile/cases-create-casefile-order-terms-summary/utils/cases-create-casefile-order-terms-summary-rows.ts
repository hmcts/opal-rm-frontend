import { DateTime } from 'luxon';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { CasesCreateCasefileApplicantBankDetails } from '../../types/cases-create-casefile-applicant-bank-details.type';
import type { CasesCreateCasefileMinorCreditorBank } from '../../types/cases-create-casefile-minor-creditor-bank.type';
import type { ICasesCreateCasefileOrderTermsSummaryRow } from '../interfaces/cases-create-casefile-order-terms-summary-row.interface';

function formatOrderTermValue(
  field: ICasesCreateCasefileAcceptedOrderTerm['presentation']['fields'][number],
  value: ICasesCreateCasefileAcceptedOrderTerm['parameters'][string],
): string {
  const text = String(value);
  if (field.kind === 'money') {
    const sign = text.startsWith('-') ? '-' : '';
    const [whole, fraction = '00'] = text.replace(/^-/, '').split('.');
    return `${sign}£${BigInt(whole).toLocaleString('en-GB')}.${fraction.padEnd(2, '0')}`;
  }
  if (field.kind === 'date') return DateTime.fromISO(text).setLocale('en-GB').toFormat('d LLLL yyyy');
  if (field.kind === 'checkbox') {
    if (Array.isArray(value)) {
      return value
        .map((selected) => field.options.find((option) => option.value === selected)?.label ?? selected)
        .join(', ');
    }
    return value === true ? 'Yes' : 'No';
  }
  if (['select', 'radio', 'autocomplete'].includes(field.kind)) {
    return field.options.find((option) => option.value === text)?.label ?? text;
  }
  return text;
}

export function orderTermRows(
  term: ICasesCreateCasefileAcceptedOrderTerm,
  frequency: string,
): ICasesCreateCasefileOrderTermsSummaryRow[] {
  return term.presentation.fields.flatMap((field) => {
    const value = field.kind === 'readonly' ? frequency : term.parameters[field.name];
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return [];

    if (Array.isArray(value) && !value.length) return [];
    return [{ id: field.name, label: field.label, value: formatOrderTermValue(field, value) }];
  });
}

export function creditorBankRows(
  bank: CasesCreateCasefileMinorCreditorBank | CasesCreateCasefileApplicantBankDetails | null,
): ICasesCreateCasefileOrderTermsSummaryRow[] {
  if (!bank || bank.type === 'none') return [];

  const rows: ICasesCreateCasefileOrderTermsSummaryRow[] = [];
  const add = (id: string, label: string, value: string | null): void => {
    if (value !== null && value.trim() !== '') rows.push({ id, label, value });
  };

  add('nameOnAccount', 'Name on account', bank.nameOnAccount);
  if (bank.type === 'uk') {
    add('sortCode', 'Sort code', bank.sortCode);
    add('accountNumber', 'Account number', bank.accountNumber);
  } else {
    add('bicSwiftCode', 'BIC/SWIFT', bank.bicSwiftCode);
    add('iban', 'IBAN', bank.iban);
    if (!bank.bicSwiftCode && !bank.iban) {
      add('bankName', 'Bank name', bank.bankName);
      add('branchSortCode', 'Branch/sort code', bank.branchSortCode);
      add('accountNumber', 'Account number', bank.accountNumber);
    }
  }
  add('paymentReference', 'Payment reference', bank.paymentReference);
  return rows;
}
