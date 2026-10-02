import type { ICasesCreateCasefileMinorCreditorDetails } from '../../interfaces/cases-create-casefile-minor-creditor-details.interface';
import type { ICasesCreateCasefileMinorCreditorSummaryRow } from '../interfaces/cases-create-casefile-minor-creditor-summary-row.interface';

export function minorCreditorSummaryRows(
  details: ICasesCreateCasefileMinorCreditorDetails,
  countryName: string,
  presentation: 'summary' | 'removal' = 'summary',
): ICasesCreateCasefileMinorCreditorSummaryRow[] {
  const { identity, address, bank } = details;
  const removalLabels: Readonly<Record<string, string>> = {
    bankType: 'Type of bank account',
    bicSwiftCode: 'BIC or SWIFT code',
    branchSortCode: 'Branch code or sort code',
  };
  const row = (id: string, label: string, value: string | null): ICasesCreateCasefileMinorCreditorSummaryRow => ({
    id,
    label: presentation === 'removal' ? (removalLabels[id] ?? label) : label,
    values: [value ?? '-'],
  });
  const name =
    identity.type === 'individual'
      ? [identity.title, identity.firstNames, identity.lastName].filter(Boolean).join(' ')
      : identity.organisationName;
  const rows: ICasesCreateCasefileMinorCreditorSummaryRow[] = [
    row('name', identity.type === 'individual' ? 'Name' : 'Organisation name', name),
    {
      id: 'address',
      label: 'Address',
      values: [
        address.addressLine1,
        address.addressLine2,
        address.addressLine3,
        address.addressLine4,
        address.addressLine5,
        address.postalOrZipCode,
        countryName,
      ].filter((line): line is string => line !== null && line !== ''),
    },
    row('bankType', 'Bank account type', bank.type === 'uk' ? 'UK' : bank.type === 'non-uk' ? 'Non-UK' : 'None'),
  ];

  if (bank.type === 'none') return rows;

  rows.push(row('nameOnAccount', 'Name on account', bank.nameOnAccount));
  if (bank.type === 'uk') {
    rows.push(row('sortCode', 'Sort code', bank.sortCode), row('accountNumber', 'Account number', bank.accountNumber));
  } else {
    rows.push(row('bicSwiftCode', 'BIC/SWIFT', bank.bicSwiftCode), row('iban', 'IBAN', bank.iban));
    if (!bank.bicSwiftCode && !bank.iban) {
      rows.push(
        row('bankName', 'Bank name', bank.bankName),
        row('branchSortCode', 'Branch/sort code', bank.branchSortCode),
        row('accountNumber', 'Account number', bank.accountNumber),
      );
    }
  }
  rows.push(row('paymentReference', 'Payment reference', bank.paymentReference));
  return rows;
}
