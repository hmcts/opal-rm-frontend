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
import { AlphagovAccessibleAutocompleteComponent } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete';
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
import type { ICasesCreateCasefilePartyAlias } from '../../interfaces/cases-create-casefile-party-alias.interface';
import { updateCasesCreateCasefileConditionalControls } from '../../utils/cases-create-casefile-conditional-controls';
import {
  createCasesCreateCasefileAddressControls,
  createCasesCreateCasefileContactControls,
} from '../../utils/cases-create-casefile-form-control-builders';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_ALIAS } from '../constants/cases-create-casefile-respondent-details-alias.constant';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_ERRORS } from '../constants/cases-create-casefile-respondent-details-field-errors.constant';
import type { ICasesCreateCasefileRespondentDetailsFieldErrors } from '../interfaces/cases-create-casefile-respondent-details-field-errors.interface';
import type { ICasesCreateCasefileRespondentDetailsFormData } from '../interfaces/cases-create-casefile-respondent-details-form-data.interface';
import type { ICasesCreateCasefileRespondentDetailsForm } from '../interfaces/cases-create-casefile-respondent-details-form.interface';
import { casesCreateCasefileRespondentDetailsNationalInsuranceNumberValidator } from '../validators/cases-create-casefile-respondent-details-national-insurance-number.validator';
import { casesCreateCasefileRespondentDetailsTrimRequiredValidator } from '../validators/cases-create-casefile-respondent-details-trim-required.validator';

const THIRD_PARTY_CONTROL_NAMES = [
  'respondent_third_party_name_or_organisation',
  'respondent_third_party_relationship',
  'respondent_third_party_reference',
  'respondent_third_party_address_line_1',
  'respondent_third_party_address_line_2',
  'respondent_third_party_address_line_3',
  'respondent_third_party_address_line_4',
  'respondent_third_party_address_line_5',
  'respondent_third_party_postal_or_zip_code',
  'respondent_third_party_country_id',
] as const;

const EMPLOYER_CONTROL_NAMES = [
  'respondent_employer_name',
  'respondent_employee_reference',
  'respondent_employer_email_address',
  'respondent_employer_telephone_number',
  'respondent_employer_address_line_1',
  'respondent_employer_address_line_2',
  'respondent_employer_address_line_3',
  'respondent_employer_address_line_4',
  'respondent_employer_address_line_5',
  'respondent_employer_postal_or_zip_code',
  'respondent_employer_country_id',
] as const;

interface IRespondentAliasFormRow {
  [controlName: string]: string | null;
}

type IRespondentDetailsRawFormData = Omit<
  ICasesCreateCasefileRespondentDetailsFormData,
  'respondent_aliases' | 'respondent_third_party_country_id'
> & {
  respondent_aliases: IRespondentAliasFormRow[];
  respondent_third_party_country_id: string | number | null;
};

@Component({
  selector: 'app-cases-create-casefile-respondent-details-form',
  imports: [
    ReactiveFormsModule,
    AlphagovAccessibleAutocompleteComponent,
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
  ],
  templateUrl: './cases-create-casefile-respondent-details-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileRespondentDetailsFormComponent
  extends AbstractFormAliasBaseComponent
  implements OnInit, OnDestroy
{
  private readonly conditionalBranchesDestroyed = new Subject<void>();
  private readonly conditionalBranches = [
    {
      checkbox: 'respondent_send_correspondence_to_third_party',
      requiredText: [
        'respondent_third_party_name_or_organisation',
        'respondent_third_party_relationship',
        'respondent_third_party_address_line_1',
      ],
      requiredCountry: ['respondent_third_party_country_id'],
      controls: THIRD_PARTY_CONTROL_NAMES,
    },
    {
      checkbox: 'respondent_add_employer_details',
      requiredText: ['respondent_employer_name', 'respondent_employer_address_line_1'],
      requiredCountry: ['respondent_employer_country_id'],
      controls: EMPLOYER_CONTROL_NAMES,
    },
    {
      checkbox: 'respondent_restricted_information',
      requiredText: ['respondent_restricted_information_reason'],
      requiredCountry: [],
      controls: ['respondent_restricted_information_reason'],
    },
  ] as const;

  protected override fieldErrors: ICasesCreateCasefileRespondentDetailsFieldErrors =
    CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_ERRORS;
  protected readonly dateService = inject(DateService);
  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileRespondentDetailsForm>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileRespondentDetailsFormData;
  @Input({ required: true }) public countryAutocompleteItems!: IAlphagovAccessibleAutocompleteItem[];
  @Input({ required: true }) public countrySelectOptions!: IGovUkSelectOptions[];
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
      requiredTextValidator: casesCreateCasefileRespondentDetailsTrimRequiredValidator,
      countryValidators: [Validators.required, this.countrySelectionValidator(this.countryAutocompleteItems)],
    });
    const disabled = <T>(value: T): { value: T; disabled: true } => ({ value, disabled: true });

    this.form = new FormGroup({
      respondent_title: new FormControl<string | null>(null, optionalMaxLengthValidator(20)),
      respondent_first_names: new FormControl<string | null>(null, [
        casesCreateCasefileRespondentDetailsTrimRequiredValidator,
        Validators.maxLength(50),
      ]),
      respondent_last_name: new FormControl<string | null>(null, [
        casesCreateCasefileRespondentDetailsTrimRequiredValidator,
        Validators.maxLength(50),
      ]),
      respondent_add_aliases: new FormControl(false, { nonNullable: true }),
      respondent_aliases: new FormArray<FormGroup>([]),
      respondent_date_of_birth: new FormControl<string | null>(null, [
        optionalValidDateValidator(),
        dateOfBirthValidator(),
      ]),
      respondent_national_insurance_number: new FormControl<string | null>(
        null,
        casesCreateCasefileRespondentDetailsNationalInsuranceNumberValidator,
      ),
      respondent_other_personal_information: new FormControl<string | null>(null, optionalMaxLengthValidator(200)),
      respondent_main_email_address: contactControls.mainEmailAddress,
      respondent_other_email_address: contactControls.otherEmailAddress,
      respondent_main_telephone_number: contactControls.mainTelephoneNumber,
      respondent_other_telephone_number: contactControls.otherTelephoneNumber,
      respondent_address_line_1: addressControls.addressLine1,
      respondent_address_line_2: addressControls.addressLine2,
      respondent_address_line_3: addressControls.addressLine3,
      respondent_address_line_4: addressControls.addressLine4,
      respondent_address_line_5: addressControls.addressLine5,
      respondent_postal_or_zip_code: addressControls.postalOrZipCode,
      respondent_country_id: addressControls.countryId,
      respondent_send_correspondence_to_third_party: new FormControl(false, { nonNullable: true }),
      respondent_third_party_name_or_organisation: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(40),
      ),
      respondent_third_party_relationship: new FormControl<string | null>(disabled(null), Validators.maxLength(40)),
      respondent_third_party_reference: new FormControl<string | null>(disabled(null), optionalMaxLengthValidator(40)),
      respondent_third_party_address_line_1: new FormControl<string | null>(disabled(null), Validators.maxLength(30)),
      respondent_third_party_address_line_2: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      respondent_third_party_address_line_3: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      respondent_third_party_address_line_4: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      respondent_third_party_address_line_5: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      respondent_third_party_postal_or_zip_code: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(10),
      ),
      respondent_third_party_country_id: new FormControl<number | null>(
        disabled(null),
        this.countrySelectionValidator(this.countrySelectOptions),
      ),
      respondent_add_employer_details: new FormControl(false, { nonNullable: true }),
      respondent_employer_name: new FormControl<string | null>(disabled(null), Validators.maxLength(50)),
      respondent_employee_reference: new FormControl<string | null>(disabled(null), optionalMaxLengthValidator(20)),
      respondent_employer_email_address: new FormControl<string | null>(disabled(null), emailValidators),
      respondent_employer_telephone_number: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(35),
      ),
      respondent_employer_address_line_1: new FormControl<string | null>(disabled(null), Validators.maxLength(30)),
      respondent_employer_address_line_2: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      respondent_employer_address_line_3: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      respondent_employer_address_line_4: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      respondent_employer_address_line_5: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      respondent_employer_postal_or_zip_code: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(10),
      ),
      respondent_employer_country_id: new FormControl<number | null>(
        disabled(null),
        this.countrySelectionValidator(this.countryAutocompleteItems),
      ),
      respondent_restricted_information: new FormControl(false, { nonNullable: true }),
      respondent_restricted_information_reason: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(250),
      ),
    });
  }

  private setupAliasConfiguration(): void {
    this.aliasFields = CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_ALIAS.map((control) => control.controlName);
    this.aliasControlsValidation = CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_ALIAS;
  }

  private mapAliasesToIndexedRows(aliases: ICasesCreateCasefilePartyAlias[]): IRespondentAliasFormRow[] {
    return aliases.map((alias, index) => ({
      [`respondent_alias_first_names_${index}`]: alias.firstNames,
      [`respondent_alias_last_name_${index}`]: alias.lastName,
    }));
  }

  private mapIndexedRowsToAliases(rows: IRespondentAliasFormRow[]): ICasesCreateCasefilePartyAlias[] {
    return rows.map((row, index) => ({
      firstNames: row[`respondent_alias_first_names_${index}`]!,
      lastName: row[`respondent_alias_last_name_${index}`]!,
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
    this.form.controls['respondent_add_aliases'].valueChanges
      .pipe(takeUntil(this.conditionalBranchesDestroyed))
      .subscribe((selected) => {
        if (selected !== true) {
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
        requiredTextValidator: casesCreateCasefileRespondentDetailsTrimRequiredValidator,
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

  private applyInitialConditionalBranchState(): void {
    for (const branch of this.conditionalBranches) {
      this.updateConditionalBranch(branch, this.form.controls[branch.checkbox].value === true);
    }
  }

  protected override rePopulateForm(state: ICasesCreateCasefileRespondentDetailsFormData): void {
    super.rePopulateForm({
      ...state,
      respondent_aliases: this.mapAliasesToIndexedRows(state.respondent_aliases),
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

    const rawValue = this.form.getRawValue() as IRespondentDetailsRawFormData;
    this.formSubmit.emit({
      formData: {
        ...rawValue,
        respondent_aliases: this.mapIndexedRowsToAliases(rawValue.respondent_aliases),
        respondent_third_party_country_id: this.normalizeThirdPartyCountryId(
          rawValue.respondent_third_party_country_id,
        ),
      },
      nestedFlow: false,
    });
  }

  public override ngOnInit(): void {
    this.setupForm();
    this.setupAliasConfiguration();
    this.setupAliasFormControls(
      [...new Array(this.initialFormData.respondent_aliases.length).keys()],
      'respondent_aliases',
    );
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    this.setUpAliasCheckboxListener('respondent_add_aliases', 'respondent_aliases');
    this.setupAliasErrorCleanupListener();
    this.setupConditionalBranchListeners();
    this.applyInitialConditionalBranchState();
    this.yesterday = this.dateService.getPreviousDate({ days: 1 });
    super.ngOnInit();
  }

  public override ngOnDestroy(): void {
    this.conditionalBranchesDestroyed.next();
    this.conditionalBranchesDestroyed.complete();
    super.ngOnDestroy();
  }
}
