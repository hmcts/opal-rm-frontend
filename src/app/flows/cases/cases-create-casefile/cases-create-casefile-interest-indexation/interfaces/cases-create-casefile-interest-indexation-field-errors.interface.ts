import type {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';

export interface ICasesCreateCasefileInterestIndexationFieldErrors extends IAbstractFormBaseFieldErrors {
  interestApplies: IAbstractFormBaseFieldError;
  indexationType: IAbstractFormBaseFieldError;
}
