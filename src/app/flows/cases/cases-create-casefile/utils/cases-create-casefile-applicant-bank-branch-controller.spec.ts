import { type ValidatorFn, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES } from '../cases-create-casefile-applicant-individual/constants/cases-create-casefile-applicant-individual-field-names.constant';
import type { ICasesCreateCasefileBankDetailsFieldNames } from '../components/cases-create-casefile-bank-details/interfaces/cases-create-casefile-bank-details-field-names.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../constants/cases-create-casefile-applicant-bank-types.constant';
import {
  casesCreateCasefileApplicantBicSwiftValidator,
  casesCreateCasefileApplicantBranchSortCodeValidator,
  casesCreateCasefileApplicantIbanValidator,
  casesCreateCasefileApplicantUkAccountNumberValidator,
  casesCreateCasefileApplicantUkSortCodeValidator,
} from '../validators/cases-create-casefile-applicant-bank.validator';
import { createCasesCreateCasefileApplicantBankBranchController } from './cases-create-casefile-applicant-bank-branch-controller';
import {
  createCasesCreateCasefileApplicantBankControls,
  type ICasesCreateCasefileApplicantBankControls,
} from './cases-create-casefile-form-control-builders';

const FIELD_NAMES: ICasesCreateCasefileBankDetailsFieldNames = {
  bankType: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.bankType,
  ukNameOnAccount: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.ukBankNameOnAccount,
  ukSortCode: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.ukBankSortCode,
  ukAccountNumber: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.ukBankAccountNumber,
  ukPaymentReference: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.ukBankPaymentReference,
  nonUkNameOnAccount: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.nonUkBankNameOnAccount,
  nonUkAccountNumber: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.nonUkBankAccountNumber,
  nonUkPaymentReference: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.nonUkBankPaymentReference,
  nonUkBicSwiftCode: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.nonUkBankBicSwiftCode,
  nonUkIban: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.nonUkBankIban,
  nonUkBankName: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.nonUkBankName,
  nonUkBranchSortCode: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES.nonUkBankBranchSortCode,
};

const UK_FIELD_NAMES = [
  FIELD_NAMES.ukNameOnAccount,
  FIELD_NAMES.ukSortCode,
  FIELD_NAMES.ukAccountNumber,
  FIELD_NAMES.ukPaymentReference,
] as const;

const NON_UK_FIELD_NAMES = [
  FIELD_NAMES.nonUkNameOnAccount,
  FIELD_NAMES.nonUkBicSwiftCode,
  FIELD_NAMES.nonUkIban,
  FIELD_NAMES.nonUkPaymentReference,
  FIELD_NAMES.nonUkBankName,
  FIELD_NAMES.nonUkBranchSortCode,
  FIELD_NAMES.nonUkAccountNumber,
] as const;

const INDIVIDUAL_NON_UK_FIELD_ORDER = [
  'nonUkNameOnAccount',
  'nonUkAccountNumber',
  'nonUkPaymentReference',
  'nonUkBicSwiftCode',
  'nonUkIban',
  'nonUkBankName',
  'nonUkBranchSortCode',
] as const;

const ORGANISATION_NON_UK_FIELD_ORDER = [
  'nonUkNameOnAccount',
  'nonUkBicSwiftCode',
  'nonUkIban',
  'nonUkPaymentReference',
  'nonUkBankName',
  'nonUkBranchSortCode',
  'nonUkAccountNumber',
] as const;

type NonUkFieldName = (typeof ORGANISATION_NON_UK_FIELD_ORDER)[number];

const requiredTextValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() !== '' ? null : { required: true };

describe('createCasesCreateCasefileApplicantBankBranchController', () => {
  let controls: ICasesCreateCasefileApplicantBankControls;
  let destroy$: Subject<void>;
  let clearErrors: Mock<(fieldNames: readonly string[]) => void>;
  let nonUkAccountNumberValidator: ValidatorFn;

  beforeEach(() => {
    nonUkAccountNumberValidator = Validators.maxLength(20);
    controls = createCasesCreateCasefileApplicantBankControls({
      bankTypeValidators: Validators.required,
      nonUkAccountNumberValidators: nonUkAccountNumberValidator,
    });
    destroy$ = new Subject<void>();
    clearErrors = vi.fn();
  });

  const createController = (
    nonUkFieldOrder:
      typeof INDIVIDUAL_NON_UK_FIELD_ORDER | typeof ORGANISATION_NON_UK_FIELD_ORDER = ORGANISATION_NON_UK_FIELD_ORDER,
  ) =>
    createCasesCreateCasefileApplicantBankBranchController({
      controls,
      fieldNames: FIELD_NAMES,
      requiredTextValidator,
      clearErrors,
      destroy$,
      nonUkFieldOrder,
    });

  const ukControls = () => [
    controls.ukBankNameOnAccount,
    controls.ukBankSortCode,
    controls.ukBankAccountNumber,
    controls.ukBankPaymentReference,
  ];

  const nonUkControls = () => [
    controls.nonUkBankNameOnAccount,
    controls.nonUkBankBicSwiftCode,
    controls.nonUkBankIban,
    controls.nonUkBankPaymentReference,
    controls.nonUkBankName,
    controls.nonUkBankBranchSortCode,
    controls.nonUkBankAccountNumber,
  ];

  const nonUkControlsByFieldName = (): Record<NonUkFieldName, ReturnType<typeof nonUkControls>[number]> => ({
    nonUkNameOnAccount: controls.nonUkBankNameOnAccount,
    nonUkAccountNumber: controls.nonUkBankAccountNumber,
    nonUkPaymentReference: controls.nonUkBankPaymentReference,
    nonUkBicSwiftCode: controls.nonUkBankBicSwiftCode,
    nonUkIban: controls.nonUkBankIban,
    nonUkBankName: controls.nonUkBankName,
    nonUkBranchSortCode: controls.nonUkBankBranchSortCode,
  });

  it('keeps both branches inactive for an initial null selection without emitting reset changes', () => {
    const controller = createController();
    const branchControls = [...ukControls(), ...nonUkControls()];
    const valueChangeSpies = branchControls.map(() => vi.fn().mockName('valueChange'));
    branchControls.forEach((control, index) => {
      control.setValue('stale value');
      control.setErrors({ stale: true });
      control.valueChanges.subscribe(valueChangeSpies[index]);
    });

    controller.applySelection(null);

    for (const control of branchControls) {
      expect(control.value).toBeNull();
      expect(control.disabled).toBe(true);
      expect(control.validator).toBeNull();
      expect(control.errors).toBeNull();
    }
    for (const valueChangeSpy of valueChangeSpies) {
      expect(valueChangeSpy).not.toHaveBeenCalled();
    }
    expect(clearErrors).toHaveBeenNthCalledWith(1, UK_FIELD_NAMES);
    expect(clearErrors).toHaveBeenNthCalledWith(2, NON_UK_FIELD_NAMES);
  });

  it('enables the UK branch with the existing required and format validators', () => {
    const controller = createController();

    controller.applySelection(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK);

    for (const control of ukControls()) {
      expect(control.enabled).toBe(true);
      expect(control.hasValidator(requiredTextValidator)).toBe(true);
      expect(control.hasError('required')).toBe(true);
    }
    expect(controls.ukBankSortCode.hasValidator(casesCreateCasefileApplicantUkSortCodeValidator)).toBe(true);
    expect(controls.ukBankAccountNumber.hasValidator(casesCreateCasefileApplicantUkAccountNumberValidator)).toBe(true);
    for (const control of nonUkControls()) {
      expect(control.disabled).toBe(true);
      expect(control.validator).toBeNull();
    }
  });

  it('preserves inactive reset and active validator-enable-validity operation order', () => {
    const controller = createController();
    const activeControl = controls.ukBankNameOnAccount;
    const inactiveControl = controls.nonUkBankNameOnAccount;
    const reset = vi.spyOn(inactiveControl, 'reset');
    const clearValidators = vi.spyOn(inactiveControl, 'clearValidators');
    const setErrors = vi.spyOn(inactiveControl, 'setErrors');
    const disable = vi.spyOn(inactiveControl, 'disable');
    const inactiveValidity = vi.spyOn(inactiveControl, 'updateValueAndValidity');
    const enable = vi.spyOn(activeControl, 'enable');
    const setValidators = vi.spyOn(activeControl, 'setValidators');
    const activeValidity = vi.spyOn(activeControl, 'updateValueAndValidity');

    controller.applySelection(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK);

    expect(reset).toHaveBeenCalledWith(null, { emitEvent: false });
    expect(disable).toHaveBeenCalledWith({ emitEvent: false });
    expect(reset.mock.invocationCallOrder[0]).toBeLessThan(clearValidators.mock.invocationCallOrder[0]);
    expect(clearValidators.mock.invocationCallOrder[0]).toBeLessThan(setErrors.mock.invocationCallOrder[0]);
    expect(setErrors.mock.invocationCallOrder[0]).toBeLessThan(disable.mock.invocationCallOrder[0]);
    expect(disable.mock.invocationCallOrder[0]).toBeLessThan(inactiveValidity.mock.invocationCallOrder.at(-1)!);
    expect(enable).toHaveBeenCalledWith({ emitEvent: false });
    expect(setValidators.mock.invocationCallOrder[0]).toBeLessThan(enable.mock.invocationCallOrder[0]);
    expect(enable.mock.invocationCallOrder[0]).toBeLessThan(activeValidity.mock.invocationCallOrder.at(-1)!);
  });

  it.each([
    ['Applicant Individual', INDIVIDUAL_NON_UK_FIELD_ORDER],
    ['Applicant Organisation', ORGANISATION_NON_UK_FIELD_ORDER],
  ] as const)('activates the %s non-UK controls in its baseline semantic order', (_page, nonUkFieldOrder) => {
    const controlsByFieldName = nonUkControlsByFieldName();
    const validatorSpies = Object.entries(controlsByFieldName).map(([fieldName, control]) => ({
      fieldName,
      setValidators: vi.spyOn(control, 'setValidators'),
    }));
    const controller = createController(nonUkFieldOrder);

    controller.applySelection(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK);

    const activationOrder = validatorSpies
      .sort(
        (left, right) =>
          left.setValidators.mock.invocationCallOrder[0] - right.setValidators.mock.invocationCallOrder[0],
      )
      .map(({ fieldName }) => fieldName);
    expect(activationOrder).toEqual(nonUkFieldOrder);
  });

  it('enables the non-UK branch with its exact validator composition', () => {
    const controller = createController();

    controller.applySelection(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK);

    for (const control of nonUkControls()) {
      expect(control.enabled).toBe(true);
    }
    expect(controls.nonUkBankNameOnAccount.hasValidator(requiredTextValidator)).toBe(true);
    expect(controls.nonUkBankNameOnAccount.hasError('required')).toBe(true);
    expect(controls.nonUkBankBicSwiftCode.hasValidator(casesCreateCasefileApplicantBicSwiftValidator)).toBe(true);
    expect(controls.nonUkBankBicSwiftCode.hasError('internationalIdentifierRequired')).toBe(true);
    expect(controls.nonUkBankIban.hasValidator(casesCreateCasefileApplicantIbanValidator)).toBe(true);
    expect(controls.nonUkBankBranchSortCode.hasValidator(casesCreateCasefileApplicantBranchSortCodeValidator)).toBe(
      true,
    );
    expect(controls.nonUkBankAccountNumber.hasValidator(nonUkAccountNumberValidator)).toBe(true);
    expect(controls.nonUkBankPaymentReference.validator).toBeNull();
    expect(controls.nonUkBankName.validator).toBeNull();
    for (const control of ukControls()) {
      expect(control.disabled).toBe(true);
      expect(control.validator).toBeNull();
    }
  });

  it('clears UK state when switching to non-UK and non-UK state when switching to None', () => {
    const controller = createController();
    const ukValueChangeSpies = ukControls().map(() => vi.fn().mockName('ukValueChange'));
    const nonUkValueChangeSpies = nonUkControls().map(() => vi.fn().mockName('nonUkValueChange'));

    controller.applySelection(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK);
    ukControls().forEach((control, index) => {
      control.setValue('uk value');
      control.setErrors({ stale: true });
      control.valueChanges.subscribe(ukValueChangeSpies[index]);
    });
    clearErrors.mockClear();

    controller.applySelection(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK);

    for (const control of ukControls()) {
      expect(control.value).toBeNull();
      expect(control.disabled).toBe(true);
      expect(control.validator).toBeNull();
      expect(control.errors).toBeNull();
    }
    expect(clearErrors).toHaveBeenCalledWith(UK_FIELD_NAMES);
    for (const valueChangeSpy of ukValueChangeSpies) {
      expect(valueChangeSpy).not.toHaveBeenCalled();
    }

    nonUkControls().forEach((control, index) => {
      control.setValue('non-UK value');
      control.setErrors({ stale: true });
      control.valueChanges.subscribe(nonUkValueChangeSpies[index]);
    });
    clearErrors.mockClear();

    controller.applySelection(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE);

    for (const control of nonUkControls()) {
      expect(control.value).toBeNull();
      expect(control.disabled).toBe(true);
      expect(control.validator).toBeNull();
      expect(control.errors).toBeNull();
    }
    expect(clearErrors).toHaveBeenCalledWith(NON_UK_FIELD_NAMES);
    for (const valueChangeSpy of nonUkValueChangeSpies) {
      expect(valueChangeSpy).not.toHaveBeenCalled();
    }
  });

  it('connects once, applies bank-type changes, revalidates BIC on IBAN changes, and stops both effects on destroy', () => {
    const controller = createController();
    const bicValiditySpy = vi.spyOn(controls.nonUkBankBicSwiftCode, 'updateValueAndValidity');

    controller.connect();
    controller.connect();
    controls.bankType.setValue(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK);

    expect(clearErrors).toHaveBeenCalledTimes(1);
    expect(clearErrors).toHaveBeenCalledWith(UK_FIELD_NAMES);
    bicValiditySpy.mockClear();
    controls.nonUkBankIban.setValue('GB82WEST12345698765432');
    expect(bicValiditySpy).toHaveBeenCalledTimes(1);
    expect(bicValiditySpy).toHaveBeenCalledWith({ emitEvent: false });

    destroy$.next();
    destroy$.complete();
    clearErrors.mockClear();
    bicValiditySpy.mockClear();
    controls.bankType.setValue(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE);
    controls.nonUkBankIban.setValue('GB82WEST12345698765433');

    expect(clearErrors).not.toHaveBeenCalled();
    expect(bicValiditySpy).not.toHaveBeenCalled();
  });
});
