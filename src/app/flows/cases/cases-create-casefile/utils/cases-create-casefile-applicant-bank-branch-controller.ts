import type { FormControl, ValidatorFn } from '@angular/forms';
import type { Observable } from 'rxjs';
import { takeUntil } from 'rxjs';
import type { ICasesCreateCasefileBankDetailsFieldNames } from '../components/cases-create-casefile-bank-details/interfaces/cases-create-casefile-bank-details-field-names.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../constants/cases-create-casefile-applicant-bank-types.constant';
import type { CasesCreateCasefileApplicantBankType } from '../types/cases-create-casefile-applicant-bank-type.type';
import {
  casesCreateCasefileApplicantBicSwiftValidator,
  casesCreateCasefileApplicantBranchSortCodeValidator,
  casesCreateCasefileApplicantIbanValidator,
  casesCreateCasefileApplicantInternationalIdentifierRequiredValidator,
  casesCreateCasefileApplicantUkAccountNumberValidator,
  casesCreateCasefileApplicantUkSortCodeValidator,
} from '../validators/cases-create-casefile-applicant-bank.validator';
import type { ICasesCreateCasefileApplicantBankControls } from './cases-create-casefile-form-control-builders';

export interface ICasesCreateCasefileApplicantBankBranchControllerConfig {
  controls: ICasesCreateCasefileApplicantBankControls;
  fieldNames: ICasesCreateCasefileBankDetailsFieldNames;
  requiredTextValidator: ValidatorFn;
  clearErrors: (fieldNames: readonly string[]) => void;
  destroy$: Observable<void>;
}

export interface ICasesCreateCasefileApplicantBankBranchController {
  applySelection: (selection: CasesCreateCasefileApplicantBankType | null) => void;
  connect: () => void;
}

interface IBankBranchControl {
  control: FormControl<string | null>;
  fieldName: string;
  validators: ValidatorFn | ValidatorFn[] | null;
}

const resetAndDisableBranch = (
  config: ICasesCreateCasefileApplicantBankBranchControllerConfig,
  branch: readonly IBankBranchControl[],
): void => {
  for (const { control } of branch) {
    control.reset(null, { emitEvent: false });
    control.clearValidators();
    control.setErrors(null);
    control.disable({ emitEvent: false });
    control.updateValueAndValidity({ emitEvent: false });
  }
  config.clearErrors(branch.map(({ fieldName }) => fieldName));
};

const enableBranch = (branch: readonly IBankBranchControl[]): void => {
  for (const { control, validators } of branch) {
    control.enable({ emitEvent: false });
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }
};

export const createCasesCreateCasefileApplicantBankBranchController = (
  config: ICasesCreateCasefileApplicantBankBranchControllerConfig,
): ICasesCreateCasefileApplicantBankBranchController => {
  const { controls, fieldNames, requiredTextValidator } = config;
  const nonUkAccountNumberValidator = controls.nonUkBankAccountNumber.validator;
  const ukBranch: readonly IBankBranchControl[] = [
    {
      control: controls.ukBankNameOnAccount,
      fieldName: fieldNames.ukNameOnAccount,
      validators: [requiredTextValidator],
    },
    {
      control: controls.ukBankSortCode,
      fieldName: fieldNames.ukSortCode,
      validators: [requiredTextValidator, casesCreateCasefileApplicantUkSortCodeValidator],
    },
    {
      control: controls.ukBankAccountNumber,
      fieldName: fieldNames.ukAccountNumber,
      validators: [requiredTextValidator, casesCreateCasefileApplicantUkAccountNumberValidator],
    },
    {
      control: controls.ukBankPaymentReference,
      fieldName: fieldNames.ukPaymentReference,
      validators: [requiredTextValidator],
    },
  ];
  const nonUkBranch: readonly IBankBranchControl[] = [
    {
      control: controls.nonUkBankNameOnAccount,
      fieldName: fieldNames.nonUkNameOnAccount,
      validators: [requiredTextValidator],
    },
    {
      control: controls.nonUkBankBicSwiftCode,
      fieldName: fieldNames.nonUkBicSwiftCode,
      validators: [
        casesCreateCasefileApplicantBicSwiftValidator,
        casesCreateCasefileApplicantInternationalIdentifierRequiredValidator(controls.nonUkBankIban),
      ],
    },
    {
      control: controls.nonUkBankIban,
      fieldName: fieldNames.nonUkIban,
      validators: [casesCreateCasefileApplicantIbanValidator],
    },
    {
      control: controls.nonUkBankPaymentReference,
      fieldName: fieldNames.nonUkPaymentReference,
      validators: [],
    },
    {
      control: controls.nonUkBankName,
      fieldName: fieldNames.nonUkBankName,
      validators: [],
    },
    {
      control: controls.nonUkBankBranchSortCode,
      fieldName: fieldNames.nonUkBranchSortCode,
      validators: [casesCreateCasefileApplicantBranchSortCodeValidator],
    },
    {
      control: controls.nonUkBankAccountNumber,
      fieldName: fieldNames.nonUkAccountNumber,
      validators: nonUkAccountNumberValidator,
    },
  ];
  let connected = false;

  const applySelection = (selection: CasesCreateCasefileApplicantBankType | null): void => {
    if (selection !== CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK) {
      resetAndDisableBranch(config, ukBranch);
    }
    if (selection !== CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK) {
      resetAndDisableBranch(config, nonUkBranch);
    }

    if (selection === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK) {
      enableBranch(ukBranch);
    } else if (selection === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK) {
      enableBranch(nonUkBranch);
    }
  };

  const connect = (): void => {
    if (connected) {
      return;
    }
    connected = true;

    controls.bankType.valueChanges.pipe(takeUntil(config.destroy$)).subscribe(applySelection);
    controls.nonUkBankIban.valueChanges.pipe(takeUntil(config.destroy$)).subscribe(() => {
      controls.nonUkBankBicSwiftCode.updateValueAndValidity({ emitEvent: false });
    });
  };

  return { applySelection, connect };
};
