import {
  FormControl,
  FormGroup,
  Validators,
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from '@angular/forms';
import { createCasesCreateCasefileCountrySelectionValidator } from '../../validators/cases-create-casefile-country-selection.validator';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from '../constants/cases-create-casefile-minor-creditor-field-names.constant';
import type { ICasesCreateCasefileMinorCreditorFormData } from '../interfaces/cases-create-casefile-minor-creditor-form-data.interface';

export type CasesCreateCasefileMinorCreditorFormControls = {
  [K in keyof ICasesCreateCasefileMinorCreditorFormData]: FormControl<ICasesCreateCasefileMinorCreditorFormData[K]>;
};

export type CasesCreateCasefileMinorCreditorFormGroup = FormGroup<CasesCreateCasefileMinorCreditorFormControls>;

type MinorCreditorControlName = keyof ICasesCreateCasefileMinorCreditorFormData;
type Branch = readonly { name: MinorCreditorControlName; validators: readonly ValidatorFn[] }[];

const trimRequiredValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };

const selectionValidator =
  (allowed: readonly string[]): ValidatorFn =>
  (control: AbstractControl) => {
    if (control.value === null || control.value === '') return { required: true };
    return allowed.includes(control.value) ? null : { invalidSelection: true };
  };

const requiredText = (maxLength: number): readonly ValidatorFn[] => [
  trimRequiredValidator,
  Validators.maxLength(maxLength),
];
const optionalText = (maxLength: number): readonly ValidatorFn[] => [Validators.maxLength(maxLength)];

export const minorCreditorSortCodeValidator: ValidatorFn = (control) => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  if (!/^[0-9-]+$/.test(value)) return { sortCodeFormat: true };
  if (value.replaceAll('-', '').length !== 6) return { sortCodeLength: true };
  return /^(?:[0-9]{6}|[0-9]{2}-[0-9]{2}-[0-9]{2})$/.test(value) ? null : { sortCodeFormat: true };
};

const INDIVIDUAL_BRANCH: Branch = [
  { name: F.title, validators: optionalText(20) },
  { name: F.firstNames, validators: requiredText(40) },
  { name: F.lastName, validators: requiredText(40) },
];
const ORGANISATION_BRANCH: Branch = [{ name: F.organisationName, validators: requiredText(40) }];
const UK_BRANCH: Branch = [
  { name: F.ukNameOnAccount, validators: requiredText(18) },
  { name: F.ukSortCode, validators: [trimRequiredValidator, minorCreditorSortCodeValidator] },
  { name: F.ukAccountNumber, validators: [trimRequiredValidator, Validators.pattern(/^[0-9]{6,8}$/)] },
  { name: F.ukPaymentReference, validators: requiredText(18) },
];
const NON_UK_BRANCH: Branch = [
  { name: F.nonUkNameOnAccount, validators: requiredText(18) },
  { name: F.nonUkAccountNumber, validators: [Validators.pattern(/^[0-9]{1,20}$/), Validators.maxLength(20)] },
  { name: F.nonUkPaymentReference, validators: requiredText(18) },
  { name: F.nonUkBicSwiftCode, validators: [Validators.pattern(/^[A-Za-z0-9]{8,11}$/)] },
  { name: F.nonUkIban, validators: [Validators.pattern(/^[A-Za-z0-9]{1,34}$/)] },
  { name: F.nonUkBankName, validators: [] },
  { name: F.nonUkBranchSortCode, validators: [Validators.pattern(/^[0-9]+$/), Validators.maxLength(12)] },
];

const disabledControl = <T>(): FormControl<T | null> => new FormControl<T | null>({ value: null, disabled: true });

export const createMinorCreditorForm = (
  countryOptions: readonly { value: string | number }[],
): CasesCreateCasefileMinorCreditorFormGroup =>
  new FormGroup<CasesCreateCasefileMinorCreditorFormControls>({
    [F.creditorType]: new FormControl<'individual' | 'organisation' | null>(
      null,
      selectionValidator(['individual', 'organisation']),
    ),
    [F.title]: disabledControl<string>(),
    [F.firstNames]: disabledControl<string>(),
    [F.lastName]: disabledControl<string>(),
    [F.organisationName]: disabledControl<string>(),
    [F.addressLine1]: new FormControl<string | null>(null, [...requiredText(40)]),
    [F.addressLine2]: new FormControl<string | null>(null, Validators.maxLength(30)),
    [F.addressLine3]: new FormControl<string | null>(null, Validators.maxLength(30)),
    [F.addressLine4]: new FormControl<string | null>(null, Validators.maxLength(30)),
    [F.addressLine5]: new FormControl<string | null>(null, Validators.maxLength(30)),
    [F.postalOrZipCode]: new FormControl<string | null>(null, Validators.maxLength(10)),
    [F.countryId]: new FormControl<number | string | null>(
      null,
      createCasesCreateCasefileCountrySelectionValidator(countryOptions),
    ),
    [F.bankType]: new FormControl<'uk' | 'non-uk' | 'none' | null>(null, selectionValidator(['uk', 'non-uk', 'none'])),
    [F.ukNameOnAccount]: disabledControl<string>(),
    [F.ukSortCode]: disabledControl<string>(),
    [F.ukAccountNumber]: disabledControl<string>(),
    [F.ukPaymentReference]: disabledControl<string>(),
    [F.nonUkNameOnAccount]: disabledControl<string>(),
    [F.nonUkAccountNumber]: disabledControl<string>(),
    [F.nonUkPaymentReference]: disabledControl<string>(),
    [F.nonUkBicSwiftCode]: disabledControl<string>(),
    [F.nonUkIban]: disabledControl<string>(),
    [F.nonUkBankName]: disabledControl<string>(),
    [F.nonUkBranchSortCode]: disabledControl<string>(),
  });

const applyBranch = (
  form: CasesCreateCasefileMinorCreditorFormGroup,
  branch: Branch,
  active: boolean,
  clearErrors: (names: readonly string[]) => void,
): void => {
  for (const { name, validators } of branch) {
    const control = form.controls[name];
    if (active) {
      control.setValidators([...validators]);
      control.enable({ emitEvent: false });
    } else {
      control.reset(null, { emitEvent: false });
      control.clearValidators();
      control.setErrors(null);
      control.disable({ emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  }
  if (!active) clearErrors(branch.map(({ name }) => name));
};

export const applyMinorCreditorBranches = (
  form: CasesCreateCasefileMinorCreditorFormGroup,
  clearErrors: (names: readonly string[]) => void,
): void => {
  const creditorType = form.controls[F.creditorType].value;
  const bankType = form.controls[F.bankType].value;
  applyBranch(form, INDIVIDUAL_BRANCH, creditorType === 'individual', clearErrors);
  applyBranch(form, ORGANISATION_BRANCH, creditorType === 'organisation', clearErrors);
  applyBranch(form, UK_BRANCH, bankType === 'uk', clearErrors);
  applyBranch(form, NON_UK_BRANCH, bankType === 'non-uk', clearErrors);
  form.updateValueAndValidity({ emitEvent: false });
};
