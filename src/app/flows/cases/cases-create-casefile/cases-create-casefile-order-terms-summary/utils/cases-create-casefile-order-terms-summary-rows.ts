import type { ICasesCreateCasefileAcceptedOrderTerm } from '../../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { CasesCreateCasefileApplicantBankDetails } from '../../types/cases-create-casefile-applicant-bank-details.type';
import type { CasesCreateCasefileMinorCreditorBank } from '../../types/cases-create-casefile-minor-creditor-bank.type';
import type { ICasesCreateCasefileOrderTermsSummaryRow } from '../interfaces/cases-create-casefile-order-terms-summary-row.interface';

export function orderTermRows(
  term: ICasesCreateCasefileAcceptedOrderTerm,
  frequency: string,
): ICasesCreateCasefileOrderTermsSummaryRow[] {
  return term.presentation.fields.flatMap((field) => {
    const value = field.kind === 'readonly' ? frequency : term.parameters[field.name];
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return [];

    let formatted = String(value);
    if (field.kind === 'money') {
      const [whole, fraction = '00'] = formatted.split('.');
      formatted = `£${BigInt(whole).toLocaleString('en-GB')}.${fraction.padEnd(2, '0')}`;
    } else if (field.kind === 'date') {
      formatted = DateTime.fromISO(formatted).setLocale('en-GB').toFormat('d LLLL yyyy');
    } else if (field.kind === 'checkbox') {
      formatted = value === true ? 'Yes' : 'No';
    } else if (['select', 'radio', 'autocomplete'].includes(field.kind)) {
      formatted = field.options.find((option) => option.value === String(value))?.label ?? String(value);
    }

    return [{ id: field.name, label: field.label, value: formatted }];
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
import { DateTime } from 'luxon';
