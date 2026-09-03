import type { ICasesCreateCasefileManagingPaymentsFieldErrors } from '../interfaces/cases-create-casefile-managing-payments-field-errors.interface';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES } from './cases-create-casefile-managing-payments-field-names.constant';

export const CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_ERRORS: ICasesCreateCasefileManagingPaymentsFieldErrors = {
  [CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement]: {
    required: { message: 'Choose payment arrangement', priority: 1 },
  },
};
