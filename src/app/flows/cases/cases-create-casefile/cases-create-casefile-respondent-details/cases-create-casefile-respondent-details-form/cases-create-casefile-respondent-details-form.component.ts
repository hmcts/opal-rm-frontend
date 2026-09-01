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
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { nationalInsuranceNumberValidator } from '@hmcts/opal-frontend-common/validators/national-insurance-number';
import { optionalMaxLengthValidator } from '@hmcts/opal-frontend-common/validators/optional-max-length';
import { optionalValidDateValidator } from '@hmcts/opal-frontend-common/validators/optional-valid-date';
import { patternValidator } from '@hmcts/opal-frontend-common/validators/pattern-validator';
import { Subject, takeUntil } from 'rxjs';
import type { ICasesCreateCasefileRespondentAlias } from '../../interfaces/cases-create-casefile-respondent-alias.interface';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_ALIAS } from '../constants/cases-create-casefile-respondent-details-alias.constant';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_ERRORS } from '../constants/cases-create-casefile-respondent-details-field-errors.constant';
import type { ICasesCreateCasefileRespondentDetailsFieldErrors } from '../interfaces/cases-create-casefile-respondent-details-field-errors.interface';
import type { ICasesCreateCasefileRespondentDetailsFormData } from '../interfaces/cases-create-casefile-respondent-details-form-data.interface';
import type { ICasesCreateCasefileRespondentDetailsForm } from '../interfaces/cases-create-casefile-respondent-details-form.interface';

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
      required: [
        'respondent_third_party_name_or_organisation',
        'respondent_third_party_relationship',
        'respondent_third_party_address_line_1',
        'respondent_third_party_country_id',
      ],
      controls: THIRD_PARTY_CONTROL_NAMES,
    },
    {
      checkbox: 'respondent_add_employer_details',
      required: ['respondent_employer_name', 'respondent_employer_address_line_1', 'respondent_employer_country_id'],
      controls: EMPLOYER_CONTROL_NAMES,
    },
    {
      checkbox: 'respondent_restricted_information',
      required: ['respondent_restricted_information_reason'],
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

  private setupForm(): void {
    const emailValidators = [optionalMaxLengthValidator(76), patternValidator(EMAIL_ADDRESS_PATTERN, 'emailPattern')];
    const disabled = <T>(value: T): { value: T; disabled: true } => ({ value, disabled: true });

    this.form = new FormGroup({
      respondent_title: new FormControl<string | null>(null, optionalMaxLengthValidator(20)),
      respondent_first_names: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(50)]),
      respondent_last_name: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(50)]),
      respondent_add_aliases: new FormControl(false, { nonNullable: true }),
      respondent_aliases: new FormArray<FormGroup>([]),
      respondent_date_of_birth: new FormControl<string | null>(null, [
        optionalValidDateValidator(),
        dateOfBirthValidator(),
      ]),
      respondent_national_insurance_number: new FormControl<string | null>(null, nationalInsuranceNumberValidator()),
      respondent_other_personal_information: new FormControl<string | null>(null, optionalMaxLengthValidator(200)),
      respondent_main_email_address: new FormControl<string | null>(null, emailValidators),
      respondent_other_email_address: new FormControl<string | null>(null, emailValidators),
      respondent_main_telephone_number: new FormControl<string | null>(null, optionalMaxLengthValidator(35)),
      respondent_other_telephone_number: new FormControl<string | null>(null, optionalMaxLengthValidator(35)),
      respondent_address_line_1: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(30)]),
      respondent_address_line_2: new FormControl<string | null>(null, optionalMaxLengthValidator(30)),
      respondent_address_line_3: new FormControl<string | null>(null, optionalMaxLengthValidator(30)),
      respondent_address_line_4: new FormControl<string | null>(null, optionalMaxLengthValidator(30)),
      respondent_address_line_5: new FormControl<string | null>(null, optionalMaxLengthValidator(30)),
      respondent_postal_or_zip_code: new FormControl<string | null>(null, optionalMaxLengthValidator(10)),
      respondent_country_id: new FormControl<number | null>(null, Validators.required),
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
      respondent_third_party_country_id: new FormControl<number | null>(disabled(null)),
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
      respondent_employer_country_id: new FormControl<number | null>(disabled(null)),
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

  private mapAliasesToIndexedRows(aliases: ICasesCreateCasefileRespondentAlias[]): IRespondentAliasFormRow[] {
    return aliases.map((alias, index) => ({
      [`respondent_alias_first_names_${index}`]: alias.firstNames,
      [`respondent_alias_last_name_${index}`]: alias.lastName,
    }));
  }

  private mapIndexedRowsToAliases(rows: IRespondentAliasFormRow[]): ICasesCreateCasefileRespondentAlias[] {
    return rows.map((row, index) => ({
      firstNames: row[`respondent_alias_first_names_${index}`]!,
      lastName: row[`respondent_alias_last_name_${index}`]!,
    }));
  }

  private clearConditionalBranchErrors(controlNames: readonly string[]): void {
    for (const controlName of controlNames) {
      this.formControlErrorMessages[controlName] = null;
    }
    this.formErrorSummaryMessage = this.formErrorSummaryMessage.filter(
      (error) => !controlNames.includes(error.fieldId),
    );
    this.formErrors = (this.formErrors ?? []).filter((error) => !controlNames.includes(error.fieldId));
  }

  private updateConditionalBranch(branch: (typeof this.conditionalBranches)[number], selected: boolean): void {
    for (const controlName of branch.controls) {
      const control = this.form.controls[controlName];
      const isRequired = (branch.required as readonly string[]).includes(controlName);
      if (selected) {
        control.enable({ emitEvent: false });
        if (isRequired) {
          control.addValidators(Validators.required);
        }
      } else {
        control.reset(null, { emitEvent: false });
        if (isRequired) {
          control.removeValidators(Validators.required);
        }
        control.setErrors(null);
        control.disable({ emitEvent: false });
      }
      control.updateValueAndValidity({ emitEvent: false });
    }

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
      super.addAlias(index, formArrayName);
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

    const rawValue = this.form.getRawValue() as Omit<
      ICasesCreateCasefileRespondentDetailsFormData,
      'respondent_aliases'
    > & { respondent_aliases: IRespondentAliasFormRow[] };
    this.formSubmit.emit({
      formData: {
        ...rawValue,
        respondent_aliases: this.mapIndexedRowsToAliases(rawValue.respondent_aliases),
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
