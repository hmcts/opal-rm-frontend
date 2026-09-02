import {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';

export interface ICasesCreateCasefileCaseTypeFieldErrors extends IAbstractFormBaseFieldErrors {
  caseType: IAbstractFormBaseFieldError;
  applicantType: IAbstractFormBaseFieldError;
}
