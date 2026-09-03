import type {
  IAbstractFormBaseFieldError,
  IAbstractFormBaseFieldErrors,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base/interfaces';

export interface ICasesCreateCasefileApplicantFieldErrors extends IAbstractFormBaseFieldErrors {
  mainEmailAddress: IAbstractFormBaseFieldError;
  otherEmailAddress: IAbstractFormBaseFieldError;
  mainTelephoneNumber: IAbstractFormBaseFieldError;
  otherTelephoneNumber: IAbstractFormBaseFieldError;
  addressLine1: IAbstractFormBaseFieldError;
  addressLine2: IAbstractFormBaseFieldError;
  addressLine3: IAbstractFormBaseFieldError;
  addressLine4: IAbstractFormBaseFieldError;
  addressLine5: IAbstractFormBaseFieldError;
  postalOrZipCode: IAbstractFormBaseFieldError;
  countryId: IAbstractFormBaseFieldError;
  bankType: IAbstractFormBaseFieldError;
  ukBankNameOnAccount: IAbstractFormBaseFieldError;
  ukBankSortCode: IAbstractFormBaseFieldError;
  ukBankAccountNumber: IAbstractFormBaseFieldError;
  ukBankPaymentReference: IAbstractFormBaseFieldError;
  nonUkBankNameOnAccount: IAbstractFormBaseFieldError;
  nonUkBankAccountNumber: IAbstractFormBaseFieldError;
  nonUkBankBicSwiftCode: IAbstractFormBaseFieldError;
  nonUkBankIban: IAbstractFormBaseFieldError;
  nonUkBankBranchSortCode: IAbstractFormBaseFieldError;
}
