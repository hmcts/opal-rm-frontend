import type {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import { CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES } from '../constants/cases-create-casefile-interest-indexation-field-names.constant';

export interface ICasesCreateCasefileInterestIndexationFieldErrors extends IAbstractFormBaseFieldErrors {
  [CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES.interestApplies]: IAbstractFormBaseFieldError;
  [CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES.indexationType]: IAbstractFormBaseFieldError;
}
