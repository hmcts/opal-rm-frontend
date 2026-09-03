import type { CasesCreateCasefilePaymentArrangement } from '../../types/cases-create-casefile-payment-arrangement.type';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES } from '../constants/cases-create-casefile-managing-payments-field-names.constant';

export interface ICasesCreateCasefileManagingPaymentsFormData {
  [CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement]: CasesCreateCasefilePaymentArrangement | null;
}
