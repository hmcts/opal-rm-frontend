import type {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-order-details-field-names.constant';

export interface ICasesCreateCasefileOrderDetailsFieldErrors extends IAbstractFormBaseFieldErrors {
  [FIELD_NAMES.applicationId]: IAbstractFormBaseFieldError;
  [FIELD_NAMES.court]: IAbstractFormBaseFieldError;
  [FIELD_NAMES.dateOrderMade]: IAbstractFormBaseFieldError;
  [FIELD_NAMES.paymentFrequency]: IAbstractFormBaseFieldError;
  [FIELD_NAMES.dateArrearsLastUpdated]: IAbstractFormBaseFieldError;
}
