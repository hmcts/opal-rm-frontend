import { FormControl, type ValidatorFn, Validators } from '@angular/forms';
import { optionalMaxLengthValidator } from '@hmcts/opal-frontend-common/validators/optional-max-length';
import type { CasesCreateCasefileApplicantBankType } from '../types/cases-create-casefile-applicant-bank-type.type';

type ValidatorsConfig = ValidatorFn | ValidatorFn[];

export interface ICasesCreateCasefileContactControlsConfig {
  emailValidators: ValidatorsConfig;
  telephoneValidators: ValidatorsConfig;
}

export interface ICasesCreateCasefileAddressControlsConfig {
  requiredTextValidator: ValidatorFn;
  countryValidators: ValidatorsConfig;
}

export interface ICasesCreateCasefileApplicantBankControlsConfig {
  bankTypeValidators: ValidatorsConfig;
  nonUkAccountNumberValidators: ValidatorsConfig;
}

export interface ICasesCreateCasefileContactControls {
  mainEmailAddress: FormControl<string | null>;
  otherEmailAddress: FormControl<string | null>;
  mainTelephoneNumber: FormControl<string | null>;
  otherTelephoneNumber: FormControl<string | null>;
}

export interface ICasesCreateCasefileAddressControls {
  addressLine1: FormControl<string | null>;
  addressLine2: FormControl<string | null>;
  addressLine3: FormControl<string | null>;
  addressLine4: FormControl<string | null>;
  addressLine5: FormControl<string | null>;
  postalOrZipCode: FormControl<string | null>;
  countryId: FormControl<number | null>;
}

export interface ICasesCreateCasefileApplicantBankControls {
  bankType: FormControl<CasesCreateCasefileApplicantBankType | null>;
  ukBankNameOnAccount: FormControl<string | null>;
  ukBankSortCode: FormControl<string | null>;
  ukBankAccountNumber: FormControl<string | null>;
  ukBankPaymentReference: FormControl<string | null>;
  nonUkBankNameOnAccount: FormControl<string | null>;
  nonUkBankBicSwiftCode: FormControl<string | null>;
  nonUkBankIban: FormControl<string | null>;
  nonUkBankPaymentReference: FormControl<string | null>;
  nonUkBankName: FormControl<string | null>;
  nonUkBankBranchSortCode: FormControl<string | null>;
  nonUkBankAccountNumber: FormControl<string | null>;
}

const disabled = <T>(value: T): { value: T; disabled: true } => ({ value, disabled: true });

export const createCasesCreateCasefileContactControls = (
  config: ICasesCreateCasefileContactControlsConfig,
): ICasesCreateCasefileContactControls => ({
  mainEmailAddress: new FormControl<string | null>(null, config.emailValidators),
  otherEmailAddress: new FormControl<string | null>(null, config.emailValidators),
  mainTelephoneNumber: new FormControl<string | null>(null, config.telephoneValidators),
  otherTelephoneNumber: new FormControl<string | null>(null, config.telephoneValidators),
});

export const createCasesCreateCasefileAddressControls = (
  config: ICasesCreateCasefileAddressControlsConfig,
): ICasesCreateCasefileAddressControls => ({
  addressLine1: new FormControl<string | null>(null, [config.requiredTextValidator, Validators.maxLength(30)]),
  addressLine2: new FormControl<string | null>(null, optionalMaxLengthValidator(30)),
  addressLine3: new FormControl<string | null>(null, optionalMaxLengthValidator(30)),
  addressLine4: new FormControl<string | null>(null, optionalMaxLengthValidator(30)),
  addressLine5: new FormControl<string | null>(null, optionalMaxLengthValidator(30)),
  postalOrZipCode: new FormControl<string | null>(null, optionalMaxLengthValidator(10)),
  countryId: new FormControl<number | null>(null, config.countryValidators),
});

export const createCasesCreateCasefileApplicantBankControls = (
  config: ICasesCreateCasefileApplicantBankControlsConfig,
): ICasesCreateCasefileApplicantBankControls => ({
  bankType: new FormControl<CasesCreateCasefileApplicantBankType | null>(null, config.bankTypeValidators),
  ukBankNameOnAccount: new FormControl<string | null>(disabled(null)),
  ukBankSortCode: new FormControl<string | null>(disabled(null)),
  ukBankAccountNumber: new FormControl<string | null>(disabled(null)),
  ukBankPaymentReference: new FormControl<string | null>(disabled(null)),
  nonUkBankNameOnAccount: new FormControl<string | null>(disabled(null)),
  nonUkBankBicSwiftCode: new FormControl<string | null>(disabled(null)),
  nonUkBankIban: new FormControl<string | null>(disabled(null)),
  nonUkBankPaymentReference: new FormControl<string | null>(disabled(null)),
  nonUkBankName: new FormControl<string | null>(disabled(null)),
  nonUkBankBranchSortCode: new FormControl<string | null>(disabled(null)),
  nonUkBankAccountNumber: new FormControl<string | null>(disabled(null), config.nonUkAccountNumberValidators),
});
