import type { IOpalMaintenanceDraftCasefileRequest as Request } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { CasesCreateCasefileApplicantBankDetails } from '@app/flows/cases/cases-create-casefile/types/cases-create-casefile-applicant-bank-details.type';
import { text, required } from './cases-create-casefile-payload-values';
type Bank = Request['casefile']['applicant']['bank_account_details'];
export function buildBankDetails(value: CasesCreateCasefileApplicantBankDetails): Bank {
  if (value.type === 'none') return { bank_account_type: 'None or not applicable' };
  if (value.type === 'uk')
    return {
      bank_account_type: 'UK Bank',
      uk_bank_details: {
        account_name: required(value.nameOnAccount),
        sort_code: required(value.sortCode),
        account_number: required(value.accountNumber),
        payment_reference: required(value.paymentReference),
      },
    };
  return {
    bank_account_type: 'Non-UK Bank',
    non_uk_bank_details: {
      account_name: required(value.nameOnAccount),
      payment_reference: required(value.paymentReference),
      bic_or_swift_code: text(value.bicSwiftCode),
      iban: text(value.iban),
      bank_name: text(value.bankName),
      branch_code_or_sort_code: text(value.branchSortCode),
      account_number: text(value.accountNumber),
    },
  };
}
