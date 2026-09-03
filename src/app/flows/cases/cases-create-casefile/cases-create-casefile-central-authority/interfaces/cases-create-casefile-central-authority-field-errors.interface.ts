import type {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';
import { CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-central-authority-field-names.constant';

export interface ICasesCreateCasefileCentralAuthorityFieldErrors extends IAbstractFormBaseFieldErrors {
  [FIELD_NAMES.remoReference]: IAbstractFormBaseFieldError;
  [FIELD_NAMES.centralAuthorityReference]: IAbstractFormBaseFieldError;
  [FIELD_NAMES.majorCreditorId]: IAbstractFormBaseFieldError;
}
