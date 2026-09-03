import type {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES } from '../constants/cases-create-casefile-managing-payments-field-names.constant';

export interface ICasesCreateCasefileManagingPaymentsFieldErrors extends IAbstractFormBaseFieldErrors {
  [CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement]: IAbstractFormBaseFieldError;
}
