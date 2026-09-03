import {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import { CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES } from '../constants/cases-create-casefile-case-type-field-names.constant';

export interface ICasesCreateCasefileCaseTypeFieldErrors extends IAbstractFormBaseFieldErrors {
  [CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES.caseType]: IAbstractFormBaseFieldError;
  [CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES.applicantType]: IAbstractFormBaseFieldError;
}
