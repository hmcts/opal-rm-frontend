import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { EMAIL_ADDRESS_PATTERN } from '@hmcts/opal-frontend-common/constants';
import { optionalMaxLengthValidator } from '@hmcts/opal-frontend-common/validators/optional-max-length';
import { patternValidator } from '@hmcts/opal-frontend-common/validators/pattern-validator';
import { Subject, takeUntil } from 'rxjs';
import { CasesCreateCasefileAddressComponent } from '../../components/cases-create-casefile-address/cases-create-casefile-address.component';
import type { ICasesCreateCasefileAddressFieldNames } from '../../components/cases-create-casefile-address/interfaces/cases-create-casefile-address-field-names.interface';
import { CasesCreateCasefileBankDetailsComponent } from '../../components/cases-create-casefile-bank-details/cases-create-casefile-bank-details.component';
import type { ICasesCreateCasefileBankDetailsFieldNames } from '../../components/cases-create-casefile-bank-details/interfaces/cases-create-casefile-bank-details-field-names.interface';
import { CasesCreateCasefileContactDetailsComponent } from '../../components/cases-create-casefile-contact-details/cases-create-casefile-contact-details.component';
import type { ICasesCreateCasefileContactFieldNames } from '../../components/cases-create-casefile-contact-details/interfaces/cases-create-casefile-contact-field-names.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS } from '../../constants/cases-create-casefile-applicant-bank-options.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { CasesCreateCasefileApplicantBankType } from '../../types/cases-create-casefile-applicant-bank-type.type';
import {
  createCasesCreateCasefileAddressControls,
  createCasesCreateCasefileApplicantBankControls,
  createCasesCreateCasefileContactControls,
} from '../../utils/cases-create-casefile-form-control-builders';
import {
  casesCreateCasefileApplicantBicSwiftValidator,
  casesCreateCasefileApplicantBranchSortCodeValidator,
  casesCreateCasefileApplicantIbanValidator,
  casesCreateCasefileApplicantInternationalIdentifierRequiredValidator,
  casesCreateCasefileApplicantUkAccountNumberValidator,
  casesCreateCasefileApplicantUkSortCodeValidator,
} from '../../validators/cases-create-casefile-applicant-bank.validator';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS } from '../constants/cases-create-casefile-applicant-organisation-field-errors.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-applicant-organisation-field-names.constant';
import type { ICasesCreateCasefileApplicantOrganisationFieldErrors } from '../interfaces/cases-create-casefile-applicant-organisation-field-errors.interface';
import type { ICasesCreateCasefileApplicantOrganisationFormData } from '../interfaces/cases-create-casefile-applicant-organisation-form-data.interface';
import type { ICasesCreateCasefileApplicantOrganisationForm } from '../interfaces/cases-create-casefile-applicant-organisation-form.interface';
import { casesCreateCasefileApplicantOrganisationTrimRequiredValidator } from '../validators/cases-create-casefile-applicant-organisation-trim-required.validator';

const UK_BANK_CONTROL_NAMES = [
  'create_casefile_applicant_organisation_uk_bank_name_on_account',
  'create_casefile_applicant_organisation_uk_bank_sort_code',
  'create_casefile_applicant_organisation_uk_bank_account_number',
  'create_casefile_applicant_organisation_uk_bank_payment_reference',
] as const;

const NON_UK_BANK_CONTROL_NAMES = [
  'create_casefile_applicant_organisation_non_uk_bank_name_on_account',
  'create_casefile_applicant_organisation_non_uk_bank_bic_swift_code',
  'create_casefile_applicant_organisation_non_uk_bank_iban',
  'create_casefile_applicant_organisation_non_uk_bank_payment_reference',
  'create_casefile_applicant_organisation_non_uk_bank_name',
  'create_casefile_applicant_organisation_non_uk_bank_branch_sort_code',
  'create_casefile_applicant_organisation_non_uk_bank_account_number',
] as const;

type BankControlName = (typeof UK_BANK_CONTROL_NAMES)[number] | (typeof NON_UK_BANK_CONTROL_NAMES)[number];

interface IApplicantOrganisationFormControls {
  create_casefile_applicant_organisation_name: FormControl<string | null>;
  create_casefile_applicant_organisation_foreign_authority_reference: FormControl<string | null>;
  create_casefile_applicant_organisation_main_email_address: FormControl<string | null>;
  create_casefile_applicant_organisation_other_email_address: FormControl<string | null>;
  create_casefile_applicant_organisation_main_telephone_number: FormControl<string | null>;
  create_casefile_applicant_organisation_other_telephone_number: FormControl<string | null>;
  create_casefile_applicant_organisation_address_line_1: FormControl<string | null>;
  create_casefile_applicant_organisation_address_line_2: FormControl<string | null>;
  create_casefile_applicant_organisation_address_line_3: FormControl<string | null>;
  create_casefile_applicant_organisation_address_line_4: FormControl<string | null>;
  create_casefile_applicant_organisation_address_line_5: FormControl<string | null>;
  create_casefile_applicant_organisation_postal_or_zip_code: FormControl<string | null>;
  create_casefile_applicant_organisation_country_id: FormControl<number | null>;
  create_casefile_applicant_organisation_bank_type: FormControl<CasesCreateCasefileApplicantBankType | null>;
  create_casefile_applicant_organisation_uk_bank_name_on_account: FormControl<string | null>;
  create_casefile_applicant_organisation_uk_bank_sort_code: FormControl<string | null>;
  create_casefile_applicant_organisation_uk_bank_account_number: FormControl<string | null>;
  create_casefile_applicant_organisation_uk_bank_payment_reference: FormControl<string | null>;
  create_casefile_applicant_organisation_non_uk_bank_name_on_account: FormControl<string | null>;
  create_casefile_applicant_organisation_non_uk_bank_bic_swift_code: FormControl<string | null>;
  create_casefile_applicant_organisation_non_uk_bank_iban: FormControl<string | null>;
  create_casefile_applicant_organisation_non_uk_bank_payment_reference: FormControl<string | null>;
  create_casefile_applicant_organisation_non_uk_bank_name: FormControl<string | null>;
  create_casefile_applicant_organisation_non_uk_bank_branch_sort_code: FormControl<string | null>;
  create_casefile_applicant_organisation_non_uk_bank_account_number: FormControl<string | null>;
}

@Component({
  selector: 'app-cases-create-casefile-applicant-organisation-form',
  imports: [
    ReactiveFormsModule,
    GovukCancelLinkComponent,
    GovukErrorSummaryComponent,
    GovukTextInputComponent,
    CasesCreateCasefileContactDetailsComponent,
    CasesCreateCasefileAddressComponent,
    CasesCreateCasefileBankDetailsComponent,
  ],
  templateUrl: './cases-create-casefile-applicant-organisation-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileApplicantOrganisationFormComponent
  extends AbstractFormBaseComponent
  implements OnInit, OnDestroy
{
  private readonly bankBranchesDestroyed = new Subject<void>();
  protected override fieldErrors: ICasesCreateCasefileApplicantOrganisationFieldErrors =
    CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS;
  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileApplicantOrganisationForm>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileApplicantOrganisationFormData;
  @Input({ required: true }) public countryAutocompleteItems!: IAlphagovAccessibleAutocompleteItem[];
  public override form!: FormGroup<IApplicantOrganisationFormControls>;
  public readonly fieldNames = FIELD_NAMES;
  public readonly contactDetailsFieldNames: ICasesCreateCasefileContactFieldNames = {
    mainEmailAddress: FIELD_NAMES.mainEmailAddress,
    otherEmailAddress: FIELD_NAMES.otherEmailAddress,
    mainTelephoneNumber: FIELD_NAMES.mainTelephoneNumber,
    otherTelephoneNumber: FIELD_NAMES.otherTelephoneNumber,
  };
  public readonly addressFieldNames: ICasesCreateCasefileAddressFieldNames = {
    addressLine1: FIELD_NAMES.addressLine1,
    addressLine2: FIELD_NAMES.addressLine2,
    addressLine3: FIELD_NAMES.addressLine3,
    addressLine4: FIELD_NAMES.addressLine4,
    addressLine5: FIELD_NAMES.addressLine5,
    postalOrZipCode: FIELD_NAMES.postalOrZipCode,
    countryId: FIELD_NAMES.countryId,
  };
  public readonly bankFieldNames: ICasesCreateCasefileBankDetailsFieldNames = {
    bankType: FIELD_NAMES.bankType,
    ukNameOnAccount: FIELD_NAMES.ukBankNameOnAccount,
    ukSortCode: FIELD_NAMES.ukBankSortCode,
    ukAccountNumber: FIELD_NAMES.ukBankAccountNumber,
    ukPaymentReference: FIELD_NAMES.ukBankPaymentReference,
    nonUkNameOnAccount: FIELD_NAMES.nonUkBankNameOnAccount,
    nonUkAccountNumber: FIELD_NAMES.nonUkBankAccountNumber,
    nonUkPaymentReference: FIELD_NAMES.nonUkBankPaymentReference,
    nonUkBicSwiftCode: FIELD_NAMES.nonUkBankBicSwiftCode,
    nonUkIban: FIELD_NAMES.nonUkBankIban,
    nonUkBankName: FIELD_NAMES.nonUkBankName,
    nonUkBranchSortCode: FIELD_NAMES.nonUkBankBranchSortCode,
  };
  public readonly bankOptions = CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS;
  public readonly bankTypes = CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES;
  public readonly ukBankConditionalId = 'applicantUkBankConditional';
  public readonly nonUkBankConditionalId = 'applicantNonUkBankConditional';
  public readonly bankLayout = {
    headingMode: 'fieldset',
    nonUkFieldOrder: [
      'nonUkNameOnAccount',
      'nonUkBicSwiftCode',
      'nonUkIban',
      'nonUkPaymentReference',
      'nonUkBankName',
      'nonUkBranchSortCode',
      'nonUkAccountNumber',
    ],
  } as const;

  private countrySelectionValidator(options: ReadonlyArray<{ value: string | number }>): ValidatorFn {
    const countryIds = new Set(options.map((option) => String(option.value)));

    return (control: AbstractControl): ValidationErrors | null =>
      control.value !== null && control.value !== '' && countryIds.has(String(control.value))
        ? null
        : { required: true };
  }

  private setupForm(): void {
    const emailValidators = [optionalMaxLengthValidator(76), patternValidator(EMAIL_ADDRESS_PATTERN, 'emailPattern')];
    const contactControls = createCasesCreateCasefileContactControls({
      emailValidators,
      telephoneValidators: [optionalMaxLengthValidator(35)],
    });
    const addressControls = createCasesCreateCasefileAddressControls({
      requiredTextValidator: casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
      countryValidators: [Validators.required, this.countrySelectionValidator(this.countryAutocompleteItems)],
    });
    const bankControls = createCasesCreateCasefileApplicantBankControls({
      bankTypeValidators: [Validators.required],
      nonUkAccountNumberValidators: [optionalMaxLengthValidator(20)],
    });

    this.form = new FormGroup<IApplicantOrganisationFormControls>({
      create_casefile_applicant_organisation_name: new FormControl<string | null>(null, [
        casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
        Validators.maxLength(80),
      ]),
      create_casefile_applicant_organisation_foreign_authority_reference: new FormControl<string | null>(null, [
        casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
        Validators.maxLength(40),
      ]),
      create_casefile_applicant_organisation_main_email_address: contactControls.mainEmailAddress,
      create_casefile_applicant_organisation_other_email_address: contactControls.otherEmailAddress,
      create_casefile_applicant_organisation_main_telephone_number: contactControls.mainTelephoneNumber,
      create_casefile_applicant_organisation_other_telephone_number: contactControls.otherTelephoneNumber,
      create_casefile_applicant_organisation_address_line_1: addressControls.addressLine1,
      create_casefile_applicant_organisation_address_line_2: addressControls.addressLine2,
      create_casefile_applicant_organisation_address_line_3: addressControls.addressLine3,
      create_casefile_applicant_organisation_address_line_4: addressControls.addressLine4,
      create_casefile_applicant_organisation_address_line_5: addressControls.addressLine5,
      create_casefile_applicant_organisation_postal_or_zip_code: addressControls.postalOrZipCode,
      create_casefile_applicant_organisation_country_id: addressControls.countryId,
      create_casefile_applicant_organisation_bank_type: bankControls.bankType,
      create_casefile_applicant_organisation_uk_bank_name_on_account: bankControls.ukBankNameOnAccount,
      create_casefile_applicant_organisation_uk_bank_sort_code: bankControls.ukBankSortCode,
      create_casefile_applicant_organisation_uk_bank_account_number: bankControls.ukBankAccountNumber,
      create_casefile_applicant_organisation_uk_bank_payment_reference: bankControls.ukBankPaymentReference,
      create_casefile_applicant_organisation_non_uk_bank_name_on_account: bankControls.nonUkBankNameOnAccount,
      create_casefile_applicant_organisation_non_uk_bank_bic_swift_code: bankControls.nonUkBankBicSwiftCode,
      create_casefile_applicant_organisation_non_uk_bank_iban: bankControls.nonUkBankIban,
      create_casefile_applicant_organisation_non_uk_bank_payment_reference: bankControls.nonUkBankPaymentReference,
      create_casefile_applicant_organisation_non_uk_bank_name: bankControls.nonUkBankName,
      create_casefile_applicant_organisation_non_uk_bank_branch_sort_code: bankControls.nonUkBankBranchSortCode,
      create_casefile_applicant_organisation_non_uk_bank_account_number: bankControls.nonUkBankAccountNumber,
    });
  }

  private clearBankBranchErrors(controlNames: readonly BankControlName[]): void {
    for (const controlName of controlNames) {
      this.formControlErrorMessages[controlName] = null;
    }
    this.formErrorSummaryMessage = this.formErrorSummaryMessage.filter(
      (error) => !controlNames.includes(error.fieldId as BankControlName),
    );
    this.formErrors = (this.formErrors ?? []).filter(
      (error) => !controlNames.includes(error.fieldId as BankControlName),
    );
  }

  private resetAndDisableBankBranch(controlNames: readonly BankControlName[]): void {
    for (const controlName of controlNames) {
      const control = this.form.controls[controlName];
      control.reset(null, { emitEvent: false });
      control.clearValidators();
      control.setErrors(null);
      control.disable({ emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
    }
    this.clearBankBranchErrors(controlNames);
  }

  private enableUkBankBranch(): void {
    const validators: Record<(typeof UK_BANK_CONTROL_NAMES)[number], ValidatorFn[]> = {
      create_casefile_applicant_organisation_uk_bank_name_on_account: [
        casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
      ],
      create_casefile_applicant_organisation_uk_bank_sort_code: [
        casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
        casesCreateCasefileApplicantUkSortCodeValidator,
      ],
      create_casefile_applicant_organisation_uk_bank_account_number: [
        casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
        casesCreateCasefileApplicantUkAccountNumberValidator,
      ],
      create_casefile_applicant_organisation_uk_bank_payment_reference: [
        casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
      ],
    };

    for (const controlName of UK_BANK_CONTROL_NAMES) {
      const control = this.form.controls[controlName];
      control.setValidators(validators[controlName]);
      control.enable({ emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private enableNonUkBankBranch(): void {
    const ibanControl = this.form.controls.create_casefile_applicant_organisation_non_uk_bank_iban;
    const validators: Record<(typeof NON_UK_BANK_CONTROL_NAMES)[number], ValidatorFn[]> = {
      create_casefile_applicant_organisation_non_uk_bank_name_on_account: [
        casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
      ],
      create_casefile_applicant_organisation_non_uk_bank_bic_swift_code: [
        casesCreateCasefileApplicantBicSwiftValidator,
        casesCreateCasefileApplicantInternationalIdentifierRequiredValidator(ibanControl),
      ],
      create_casefile_applicant_organisation_non_uk_bank_iban: [casesCreateCasefileApplicantIbanValidator],
      create_casefile_applicant_organisation_non_uk_bank_payment_reference: [],
      create_casefile_applicant_organisation_non_uk_bank_name: [],
      create_casefile_applicant_organisation_non_uk_bank_branch_sort_code: [
        casesCreateCasefileApplicantBranchSortCodeValidator,
      ],
      create_casefile_applicant_organisation_non_uk_bank_account_number: [optionalMaxLengthValidator(20)],
    };

    for (const controlName of NON_UK_BANK_CONTROL_NAMES) {
      const control = this.form.controls[controlName];
      control.setValidators(validators[controlName]);
      control.enable({ emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private updateBankBranch(bankType: CasesCreateCasefileApplicantBankType | null): void {
    if (bankType !== CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK) {
      this.resetAndDisableBankBranch(UK_BANK_CONTROL_NAMES);
    }
    if (bankType !== CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK) {
      this.resetAndDisableBankBranch(NON_UK_BANK_CONTROL_NAMES);
    }
    if (bankType === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK) {
      this.enableUkBankBranch();
    } else if (bankType === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK) {
      this.enableNonUkBankBranch();
    }
  }

  private setupBankBranchListeners(): void {
    this.form.controls.create_casefile_applicant_organisation_bank_type.valueChanges
      .pipe(takeUntil(this.bankBranchesDestroyed))
      .subscribe((bankType) => this.updateBankBranch(bankType));
    this.form.controls.create_casefile_applicant_organisation_non_uk_bank_iban.valueChanges
      .pipe(takeUntil(this.bankBranchesDestroyed))
      .subscribe(() =>
        this.form.controls.create_casefile_applicant_organisation_non_uk_bank_bic_swift_code.updateValueAndValidity({
          emitEvent: false,
        }),
      );
  }

  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (!this.form.valid) {
      super.handleFormSubmit(event);
      return;
    }

    this.handleErrorMessages();
    this.formSubmitted = true;
    this.unsavedChanges.emit(this.hasUnsavedChanges());
    this.formSubmit.emit({
      formData: this.form.getRawValue(),
      nestedFlow: false,
    });
  }

  public override ngOnInit(): void {
    this.setupForm();
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    this.setupBankBranchListeners();
    this.updateBankBranch(this.form.controls.create_casefile_applicant_organisation_bank_type.value);
    super.ngOnInit();
  }

  public override ngOnDestroy(): void {
    this.bankBranchesDestroyed.next();
    this.bankBranchesDestroyed.complete();
    super.ngOnDestroy();
  }
}
