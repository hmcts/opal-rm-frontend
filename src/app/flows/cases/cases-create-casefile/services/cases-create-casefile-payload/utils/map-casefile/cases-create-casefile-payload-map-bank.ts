import type { IOpalMaintenanceDraftCasefileRequest } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { CasesCreateCasefileApplicantBankDetails } from '../../../../types/cases-create-casefile-applicant-bank-details.type';

type SavedBank = IOpalMaintenanceDraftCasefileRequest['casefile']['applicant']['bank_account_details'];
function requireBankText(values: readonly unknown[]): void {
  if (values.some((value) => typeof value !== 'string' || !value.trim())) throw new Error('Unusable saved bank');
}

/** Restore the saved discriminated bank branch without retaining input references. */
export function mapSavedBank(value: SavedBank): CasesCreateCasefileApplicantBankDetails {
  if (value?.bank_account_type === 'None or not applicable') {
    if (value.uk_bank_details !== undefined || value.non_uk_bank_details !== undefined)
      throw new Error('Unusable saved bank');
    return { type: 'none' };
  }
  if (value?.bank_account_type === 'UK Bank') {
    const bank = value.uk_bank_details;
    if (!bank || value.non_uk_bank_details !== undefined) throw new Error('Unusable saved bank');
    requireBankText([bank.account_name, bank.sort_code, bank.account_number, bank.payment_reference]);
    return {
      type: 'uk',
      nameOnAccount: bank.account_name,
      sortCode: bank.sort_code,
      accountNumber: bank.account_number,
      paymentReference: bank.payment_reference,
    };
  }
  const bank = value?.non_uk_bank_details;
  if (value?.bank_account_type !== 'Non-UK Bank' || !bank || value.uk_bank_details !== undefined)
    throw new Error('Unusable saved bank');
  requireBankText([bank.account_name, bank.payment_reference]);
  const optionalValues = [
    bank.bic_or_swift_code,
    bank.iban,
    bank.bank_name,
    bank.branch_code_or_sort_code,
    bank.account_number,
  ];
  if (optionalValues.some((field) => field !== undefined && typeof field !== 'string'))
    throw new Error('Unusable saved bank');
  return {
    type: 'non-uk',
    nameOnAccount: bank.account_name,
    paymentReference: bank.payment_reference,
    bicSwiftCode: bank.bic_or_swift_code ?? null,
    iban: bank.iban ?? null,
    bankName: bank.bank_name ?? null,
    branchSortCode: bank.branch_code_or_sort_code ?? null,
    accountNumber: bank.account_number ?? null,
  };
}
