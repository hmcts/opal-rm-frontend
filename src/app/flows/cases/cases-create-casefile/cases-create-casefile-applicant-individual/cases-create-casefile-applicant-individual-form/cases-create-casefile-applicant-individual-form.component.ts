import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AbstractFormAliasBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-alias-base';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import { GovukButtonComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-button';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import {
  GovukCheckboxesComponent,
  GovukCheckboxesConditionalComponent,
  GovukCheckboxesItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-checkboxes';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { GovukSelectComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-select';
import type { IGovUkSelectOptions } from '@hmcts/opal-frontend-common/components/govuk/govuk-select/interfaces';
import { GovukTextAreaComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-area';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { MojDatePickerComponent } from '@hmcts/opal-frontend-common/components/moj/moj-date-picker';
import { EMAIL_ADDRESS_PATTERN } from '@hmcts/opal-frontend-common/constants';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { dateOfBirthValidator } from '@hmcts/opal-frontend-common/validators/date-of-birth';
import { optionalMaxLengthValidator } from '@hmcts/opal-frontend-common/validators/optional-max-length';
import { optionalValidDateValidator } from '@hmcts/opal-frontend-common/validators/optional-valid-date';
import { patternValidator } from '@hmcts/opal-frontend-common/validators/pattern-validator';
import { Subject, takeUntil } from 'rxjs';
import { CasesCreateCasefileAddressComponent } from '../../components/cases-create-casefile-address/cases-create-casefile-address.component';
import type { ICasesCreateCasefileAddressFieldNames } from '../../components/cases-create-casefile-address/interfaces/cases-create-casefile-address-field-names.interface';
import { CasesCreateCasefileContactDetailsComponent } from '../../components/cases-create-casefile-contact-details/cases-create-casefile-contact-details.component';
import type { ICasesCreateCasefileContactFieldNames } from '../../components/cases-create-casefile-contact-details/interfaces/cases-create-casefile-contact-field-names.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefilePartyAlias } from '../../interfaces/cases-create-casefile-party-alias.interface';
import type { CasesCreateCasefileApplicantBankType } from '../../types/cases-create-casefile-applicant-bank-type.type';
import { updateCasesCreateCasefileConditionalControls } from '../../utils/cases-create-casefile-conditional-controls';
import {
  createCasesCreateCasefileAddressControls,
  createCasesCreateCasefileApplicantBankControls,
  createCasesCreateCasefileContactControls,
} from '../../utils/cases-create-casefile-form-control-builders';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_ALIAS } from '../constants/cases-create-casefile-applicant-individual-alias.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS } from '../../constants/cases-create-casefile-applicant-bank-options.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS } from '../constants/cases-create-casefile-applicant-individual-field-errors.constant';
import type { ICasesCreateCasefileApplicantIndividualFieldErrors } from '../interfaces/cases-create-casefile-applicant-individual-field-errors.interface';
import type { ICasesCreateCasefileApplicantIndividualFormData } from '../interfaces/cases-create-casefile-applicant-individual-form-data.interface';
import type { ICasesCreateCasefileApplicantIndividualForm } from '../interfaces/cases-create-casefile-applicant-individual-form.interface';
import {
  casesCreateCasefileApplicantBicSwiftValidator,
  casesCreateCasefileApplicantBranchSortCodeValidator,
  casesCreateCasefileApplicantIbanValidator,
  casesCreateCasefileApplicantInternationalIdentifierRequiredValidator,
  casesCreateCasefileApplicantUkAccountNumberValidator,
  casesCreateCasefileApplicantUkSortCodeValidator,
} from '../../validators/cases-create-casefile-applicant-bank.validator';
import { casesCreateCasefileApplicantIndividualTrimRequiredValidator } from '../validators/cases-create-casefile-applicant-individual-trim-required.validator';

const THIRD_PARTY_CONTROL_NAMES = [
  'applicant_third_party_name_or_organisation',
  'applicant_third_party_relationship',
  'applicant_third_party_reference',
  'applicant_third_party_address_line_1',
  'applicant_third_party_address_line_2',
  'applicant_third_party_address_line_3',
  'applicant_third_party_address_line_4',
  'applicant_third_party_address_line_5',
  'applicant_third_party_postal_or_zip_code',
  'applicant_third_party_country_id',
] as const;

const UK_BANK_CONTROL_NAMES = [
  'applicant_uk_bank_name_on_account',
  'applicant_uk_bank_sort_code',
  'applicant_uk_bank_account_number',
  'applicant_uk_bank_payment_reference',
] as const;

const NON_UK_BANK_CONTROL_NAMES = [
  'applicant_non_uk_bank_name_on_account',
  'applicant_non_uk_bank_account_number',
  'applicant_non_uk_bank_payment_reference',
  'applicant_non_uk_bank_bic_swift_code',
  'applicant_non_uk_bank_iban',
  'applicant_non_uk_bank_name',
  'applicant_non_uk_bank_branch_sort_code',
] as const;

type BankControlName = (typeof UK_BANK_CONTROL_NAMES)[number] | (typeof NON_UK_BANK_CONTROL_NAMES)[number];

interface IApplicantAliasFormRow {
  [controlName: string]: string | null;
}

interface IApplicantIndividualFormControls {
  applicant_title: FormControl<string | null>;
  applicant_first_names: FormControl<string | null>;
  applicant_last_name: FormControl<string | null>;
  applicant_add_aliases: FormControl<boolean>;
  applicant_aliases: FormArray<FormGroup>;
  applicant_date_of_birth: FormControl<string | null>;
  applicant_main_email_address: FormControl<string | null>;
  applicant_other_email_address: FormControl<string | null>;
  applicant_main_telephone_number: FormControl<string | null>;
  applicant_other_telephone_number: FormControl<string | null>;
  applicant_address_line_1: FormControl<string | null>;
  applicant_address_line_2: FormControl<string | null>;
  applicant_address_line_3: FormControl<string | null>;
  applicant_address_line_4: FormControl<string | null>;
  applicant_address_line_5: FormControl<string | null>;
  applicant_postal_or_zip_code: FormControl<string | null>;
  applicant_country_id: FormControl<number | null>;
  applicant_send_correspondence_to_third_party: FormControl<boolean>;
  applicant_third_party_name_or_organisation: FormControl<string | null>;
  applicant_third_party_relationship: FormControl<string | null>;
  applicant_third_party_reference: FormControl<string | null>;
  applicant_third_party_address_line_1: FormControl<string | null>;
  applicant_third_party_address_line_2: FormControl<string | null>;
  applicant_third_party_address_line_3: FormControl<string | null>;
  applicant_third_party_address_line_4: FormControl<string | null>;
  applicant_third_party_address_line_5: FormControl<string | null>;
  applicant_third_party_postal_or_zip_code: FormControl<string | null>;
  applicant_third_party_country_id: FormControl<number | null>;
  applicant_bank_type: FormControl<CasesCreateCasefileApplicantBankType | null>;
  applicant_uk_bank_name_on_account: FormControl<string | null>;
  applicant_uk_bank_sort_code: FormControl<string | null>;
  applicant_uk_bank_account_number: FormControl<string | null>;
  applicant_uk_bank_payment_reference: FormControl<string | null>;
  applicant_non_uk_bank_name_on_account: FormControl<string | null>;
  applicant_non_uk_bank_account_number: FormControl<string | null>;
  applicant_non_uk_bank_payment_reference: FormControl<string | null>;
  applicant_non_uk_bank_bic_swift_code: FormControl<string | null>;
  applicant_non_uk_bank_iban: FormControl<string | null>;
  applicant_non_uk_bank_name: FormControl<string | null>;
  applicant_non_uk_bank_branch_sort_code: FormControl<string | null>;
  applicant_restricted_information: FormControl<boolean>;
  applicant_restricted_information_reason: FormControl<string | null>;
}

type ApplicantIndividualRawFormData = Omit<
  ICasesCreateCasefileApplicantIndividualFormData,
  'applicant_aliases' | 'applicant_third_party_country_id'
> & {
  applicant_aliases: IApplicantAliasFormRow[];
  applicant_third_party_country_id: string | number | null;
};

@Component({
  selector: 'app-cases-create-casefile-applicant-individual-form',
  imports: [
    ReactiveFormsModule,
    GovukButtonComponent,
    GovukCancelLinkComponent,
    GovukCheckboxesComponent,
    GovukCheckboxesConditionalComponent,
    GovukCheckboxesItemComponent,
    GovukErrorSummaryComponent,
    GovukSelectComponent,
    GovukTextAreaComponent,
    GovukTextInputComponent,
    MojDatePickerComponent,
    CasesCreateCasefileContactDetailsComponent,
    CasesCreateCasefileAddressComponent,
  ],
  templateUrl: './cases-create-casefile-applicant-individual-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileApplicantIndividualFormComponent
  extends AbstractFormAliasBaseComponent
  implements OnInit, OnDestroy
{
  private readonly conditionalBranchesDestroyed = new Subject<void>();
  private readonly conditionalBranches = [
    {
      checkbox: 'applicant_send_correspondence_to_third_party',
      requiredText: [
        'applicant_third_party_name_or_organisation',
        'applicant_third_party_relationship',
        'applicant_third_party_address_line_1',
      ],
      requiredCountry: ['applicant_third_party_country_id'],
      controls: THIRD_PARTY_CONTROL_NAMES,
    },
    {
      checkbox: 'applicant_restricted_information',
      requiredText: ['applicant_restricted_information_reason'],
      requiredCountry: [],
      controls: ['applicant_restricted_information_reason'],
    },
  ] as const;

  protected override fieldErrors: ICasesCreateCasefileApplicantIndividualFieldErrors =
    CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS;
  protected readonly dateService = inject(DateService);
  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileApplicantIndividualForm>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileApplicantIndividualFormData;
  @Input({ required: true }) public countryAutocompleteItems!: IAlphagovAccessibleAutocompleteItem[];
  @Input({ required: true }) public countrySelectOptions!: IGovUkSelectOptions[];
  public override form!: FormGroup<IApplicantIndividualFormControls>;
  public readonly contactDetailsFieldNames: ICasesCreateCasefileContactFieldNames = {
    mainEmailAddress: 'applicant_main_email_address',
    otherEmailAddress: 'applicant_other_email_address',
    mainTelephoneNumber: 'applicant_main_telephone_number',
    otherTelephoneNumber: 'applicant_other_telephone_number',
  };
  public readonly addressFieldNames: ICasesCreateCasefileAddressFieldNames = {
    addressLine1: 'applicant_address_line_1',
    addressLine2: 'applicant_address_line_2',
    addressLine3: 'applicant_address_line_3',
    addressLine4: 'applicant_address_line_4',
    addressLine5: 'applicant_address_line_5',
    postalOrZipCode: 'applicant_postal_or_zip_code',
    countryId: 'applicant_country_id',
  };
  public readonly bankOptions = CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS;
  public readonly bankTypes = CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES;
  public readonly ukBankConditionalId = 'applicantUkBankConditional';
  public readonly nonUkBankConditionalId = 'applicantNonUkBankConditional';
  public yesterday!: string;

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
      requiredTextValidator: casesCreateCasefileApplicantIndividualTrimRequiredValidator,
      countryValidators: [Validators.required, this.countrySelectionValidator(this.countryAutocompleteItems)],
    });
    const bankControls = createCasesCreateCasefileApplicantBankControls({
      bankTypeValidators: [Validators.required],
      nonUkAccountNumberValidators: [optionalMaxLengthValidator(20)],
    });
    const disabled = <T>(value: T): { value: T; disabled: true } => ({ value, disabled: true });

    this.form = new FormGroup<IApplicantIndividualFormControls>({
      applicant_title: new FormControl<string | null>(null, optionalMaxLengthValidator(20)),
      applicant_first_names: new FormControl<string | null>(null, [
        casesCreateCasefileApplicantIndividualTrimRequiredValidator,
        Validators.maxLength(50),
      ]),
      applicant_last_name: new FormControl<string | null>(null, [
        casesCreateCasefileApplicantIndividualTrimRequiredValidator,
        Validators.maxLength(50),
      ]),
      applicant_add_aliases: new FormControl(false, { nonNullable: true }),
      applicant_aliases: new FormArray<FormGroup>([]),
      applicant_date_of_birth: new FormControl<string | null>(null, [
        optionalValidDateValidator(),
        dateOfBirthValidator(),
      ]),
      applicant_main_email_address: contactControls.mainEmailAddress,
      applicant_other_email_address: contactControls.otherEmailAddress,
      applicant_main_telephone_number: contactControls.mainTelephoneNumber,
      applicant_other_telephone_number: contactControls.otherTelephoneNumber,
      applicant_address_line_1: addressControls.addressLine1,
      applicant_address_line_2: addressControls.addressLine2,
      applicant_address_line_3: addressControls.addressLine3,
      applicant_address_line_4: addressControls.addressLine4,
      applicant_address_line_5: addressControls.addressLine5,
      applicant_postal_or_zip_code: addressControls.postalOrZipCode,
      applicant_country_id: addressControls.countryId,
      applicant_send_correspondence_to_third_party: new FormControl(false, { nonNullable: true }),
      applicant_third_party_name_or_organisation: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(40),
      ),
      applicant_third_party_relationship: new FormControl<string | null>(disabled(null), Validators.maxLength(40)),
      applicant_third_party_reference: new FormControl<string | null>(disabled(null), optionalMaxLengthValidator(40)),
      applicant_third_party_address_line_1: new FormControl<string | null>(disabled(null), Validators.maxLength(30)),
      applicant_third_party_address_line_2: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      applicant_third_party_address_line_3: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      applicant_third_party_address_line_4: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      applicant_third_party_address_line_5: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      applicant_third_party_postal_or_zip_code: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(10),
      ),
      applicant_third_party_country_id: new FormControl<number | null>(
        disabled(null),
        this.countrySelectionValidator(this.countrySelectOptions),
      ),
      applicant_bank_type: bankControls.bankType,
      applicant_uk_bank_name_on_account: bankControls.ukBankNameOnAccount,
      applicant_uk_bank_sort_code: bankControls.ukBankSortCode,
      applicant_uk_bank_account_number: bankControls.ukBankAccountNumber,
      applicant_uk_bank_payment_reference: bankControls.ukBankPaymentReference,
      applicant_non_uk_bank_name_on_account: bankControls.nonUkBankNameOnAccount,
      applicant_non_uk_bank_account_number: bankControls.nonUkBankAccountNumber,
      applicant_non_uk_bank_payment_reference: bankControls.nonUkBankPaymentReference,
      applicant_non_uk_bank_bic_swift_code: bankControls.nonUkBankBicSwiftCode,
      applicant_non_uk_bank_iban: bankControls.nonUkBankIban,
      applicant_non_uk_bank_name: bankControls.nonUkBankName,
      applicant_non_uk_bank_branch_sort_code: bankControls.nonUkBankBranchSortCode,
      applicant_restricted_information: new FormControl(false, { nonNullable: true }),
      applicant_restricted_information_reason: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(250),
      ),
    });
  }

  private setupAliasConfiguration(): void {
    this.aliasFields = CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_ALIAS.map((control) => control.controlName);
    this.aliasControlsValidation = CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_ALIAS;
  }

  private mapAliasesToIndexedRows(aliases: ICasesCreateCasefilePartyAlias[]): IApplicantAliasFormRow[] {
    return aliases.map((alias, index) => ({
      [`applicant_alias_first_names_${index}`]: alias.firstNames,
      [`applicant_alias_last_name_${index}`]: alias.lastName,
    }));
  }

  private mapIndexedRowsToAliases(rows: IApplicantAliasFormRow[]): ICasesCreateCasefilePartyAlias[] {
    return rows.map((row, index) => ({
      firstNames: row[`applicant_alias_first_names_${index}`]!,
      lastName: row[`applicant_alias_last_name_${index}`]!,
    }));
  }

  private normalizeThirdPartyCountryId(value: string | number | null): number | null {
    if (value === null || value === '') {
      return null;
    }
    return Number(value);
  }

  private clearConditionalBranchErrors(controlNames: readonly string[]): void {
    for (const controlName of controlNames) {
      this.formControlErrorMessages[controlName] = null;
    }
    this.clearErrorEntries((fieldId) => controlNames.includes(fieldId));
  }

  private clearErrorEntries(matches: (fieldId: string) => boolean): void {
    this.formErrorSummaryMessage = this.formErrorSummaryMessage.filter((error) => !matches(error.fieldId));
    this.formErrors = (this.formErrors ?? []).filter((error) => !matches(error.fieldId));
  }

  private clearAliasErrors(controlNames?: readonly string[]): void {
    const matches = controlNames
      ? (fieldId: string) => controlNames.includes(fieldId)
      : (fieldId: string) => this.aliasFields.some((field) => fieldId.startsWith(`${field}_`));

    this.clearErrorEntries(matches);
  }

  private setupAliasErrorCleanupListener(): void {
    this.form.controls.applicant_add_aliases.valueChanges
      .pipe(takeUntil(this.conditionalBranchesDestroyed))
      .subscribe((selected) => {
        if (!selected) {
          this.clearAliasErrors();
        }
      });
  }

  private updateConditionalBranch(branch: (typeof this.conditionalBranches)[number], selected: boolean): void {
    updateCasesCreateCasefileConditionalControls(
      {
        controls: branch.controls.map((controlName) => this.form.controls[controlName]),
        requiredTextControls: new Set(branch.requiredText.map((controlName) => this.form.controls[controlName])),
        requiredCountryControls: new Set(branch.requiredCountry.map((controlName) => this.form.controls[controlName])),
        requiredTextValidator: casesCreateCasefileApplicantIndividualTrimRequiredValidator,
      },
      selected,
    );

    if (!selected) {
      this.clearConditionalBranchErrors(branch.controls);
    }
  }

  private setupConditionalBranchListeners(): void {
    for (const branch of this.conditionalBranches) {
      this.form.controls[branch.checkbox].valueChanges
        .pipe(takeUntil(this.conditionalBranchesDestroyed))
        .subscribe((selected) => this.updateConditionalBranch(branch, selected === true));
    }
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
    this.clearConditionalBranchErrors(controlNames);
  }

  private enableUkBankBranch(): void {
    const validators: Record<(typeof UK_BANK_CONTROL_NAMES)[number], ValidatorFn[]> = {
      applicant_uk_bank_name_on_account: [casesCreateCasefileApplicantIndividualTrimRequiredValidator],
      applicant_uk_bank_sort_code: [
        casesCreateCasefileApplicantIndividualTrimRequiredValidator,
        casesCreateCasefileApplicantUkSortCodeValidator,
      ],
      applicant_uk_bank_account_number: [
        casesCreateCasefileApplicantIndividualTrimRequiredValidator,
        casesCreateCasefileApplicantUkAccountNumberValidator,
      ],
      applicant_uk_bank_payment_reference: [casesCreateCasefileApplicantIndividualTrimRequiredValidator],
    };

    for (const controlName of UK_BANK_CONTROL_NAMES) {
      const control = this.form.controls[controlName];
      control.setValidators(validators[controlName]);
      control.enable({ emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private enableNonUkBankBranch(): void {
    const ibanControl = this.form.controls.applicant_non_uk_bank_iban;
    const validators: Record<(typeof NON_UK_BANK_CONTROL_NAMES)[number], ValidatorFn[]> = {
      applicant_non_uk_bank_name_on_account: [casesCreateCasefileApplicantIndividualTrimRequiredValidator],
      applicant_non_uk_bank_account_number: [optionalMaxLengthValidator(20)],
      applicant_non_uk_bank_payment_reference: [],
      applicant_non_uk_bank_bic_swift_code: [
        casesCreateCasefileApplicantBicSwiftValidator,
        casesCreateCasefileApplicantInternationalIdentifierRequiredValidator(ibanControl),
      ],
      applicant_non_uk_bank_iban: [casesCreateCasefileApplicantIbanValidator],
      applicant_non_uk_bank_name: [],
      applicant_non_uk_bank_branch_sort_code: [casesCreateCasefileApplicantBranchSortCodeValidator],
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
    this.form.controls.applicant_bank_type.valueChanges
      .pipe(takeUntil(this.conditionalBranchesDestroyed))
      .subscribe((bankType) => this.updateBankBranch(bankType));
    this.form.controls.applicant_non_uk_bank_iban.valueChanges
      .pipe(takeUntil(this.conditionalBranchesDestroyed))
      .subscribe(() =>
        this.form.controls.applicant_non_uk_bank_bic_swift_code.updateValueAndValidity({ emitEvent: false }),
      );
  }

  private applyInitialConditionalBranchState(): void {
    for (const branch of this.conditionalBranches) {
      this.updateConditionalBranch(branch, this.form.controls[branch.checkbox].value === true);
    }
  }

  protected override rePopulateForm(state: ICasesCreateCasefileApplicantIndividualFormData): void {
    super.rePopulateForm({
      ...state,
      applicant_aliases: this.mapAliasesToIndexedRows(state.applicant_aliases),
    });
  }

  public override addAlias(index: number, formArrayName: string): void {
    if (this.aliasControls.length < 5) {
      this.form.markAsDirty();
      super.addAlias(index, formArrayName);
    }
  }

  public override removeAlias(index: number, formArrayName: string, event?: Event): void {
    const shouldFocusRemainingAlias = this.aliasControls.length === 2;
    const removedControlNames = this.aliasFields
      .map((field) => this.aliasControls[index]?.[field]?.controlName)
      .filter((controlName): controlName is string => controlName !== undefined);
    this.form.markAsDirty();
    super.removeAlias(index, formArrayName, event);
    this.clearAliasErrors(removedControlNames);
    if (shouldFocusRemainingAlias) {
      this.focusFirstAliasField();
    }
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

    const rawValue = this.form.getRawValue() as ApplicantIndividualRawFormData;
    this.formSubmit.emit({
      formData: {
        ...rawValue,
        applicant_aliases: this.mapIndexedRowsToAliases(rawValue.applicant_aliases),
        applicant_third_party_country_id: this.normalizeThirdPartyCountryId(rawValue.applicant_third_party_country_id),
      },
      nestedFlow: false,
    });
  }

  public override ngOnInit(): void {
    this.setupForm();
    this.setupAliasConfiguration();
    this.setupAliasFormControls(
      [...new Array(this.initialFormData.applicant_aliases.length).keys()],
      'applicant_aliases',
    );
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    this.setUpAliasCheckboxListener('applicant_add_aliases', 'applicant_aliases');
    this.setupAliasErrorCleanupListener();
    this.setupConditionalBranchListeners();
    this.applyInitialConditionalBranchState();
    this.setupBankBranchListeners();
    this.updateBankBranch(this.form.controls.applicant_bank_type.value);
    this.yesterday = this.dateService.getPreviousDate({ days: 1 });
    super.ngOnInit();
  }

  public override ngOnDestroy(): void {
    this.conditionalBranchesDestroyed.next();
    this.conditionalBranchesDestroyed.complete();
    super.ngOnDestroy();
  }
}
