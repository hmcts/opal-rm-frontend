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
import { CasesCreateCasefileRestrictedInformationComponent } from '../../components/cases-create-casefile-restricted-information/cases-create-casefile-restricted-information.component';
import { CasesCreateCasefileThirdPartyComponent } from '../../components/cases-create-casefile-third-party/cases-create-casefile-third-party.component';
import type { ICasesCreateCasefileThirdPartyFieldNames } from '../../components/cases-create-casefile-third-party/interfaces/cases-create-casefile-third-party-field-names.interface';
import type { ICasesCreateCasefilePartyAlias } from '../../interfaces/cases-create-casefile-party-alias.interface';
import { updateCasesCreateCasefileConditionalControls } from '../../utils/cases-create-casefile-conditional-controls';
import {
  createCasesCreateCasefileAddressControls,
  createCasesCreateCasefileContactControls,
} from '../../utils/cases-create-casefile-form-control-builders';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_ALIAS } from '../constants/cases-create-casefile-respondent-details-alias.constant';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_ERRORS } from '../constants/cases-create-casefile-respondent-details-field-errors.constant';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES } from '../constants/cases-create-casefile-respondent-details-field-names.constant';
import type { ICasesCreateCasefileRespondentDetailsFieldErrors } from '../interfaces/cases-create-casefile-respondent-details-field-errors.interface';
import type { ICasesCreateCasefileRespondentDetailsFormData } from '../interfaces/cases-create-casefile-respondent-details-form-data.interface';
import type { ICasesCreateCasefileRespondentDetailsForm } from '../interfaces/cases-create-casefile-respondent-details-form.interface';
import { casesCreateCasefileRespondentDetailsNationalInsuranceNumberValidator } from '../validators/cases-create-casefile-respondent-details-national-insurance-number.validator';
import { casesCreateCasefileRespondentDetailsTrimRequiredValidator } from '../validators/cases-create-casefile-respondent-details-trim-required.validator';

const THIRD_PARTY_CONTROL_NAMES = [
  'create_casefile_respondent_details_third_party_name_or_organisation',
  'create_casefile_respondent_details_third_party_relationship',
  'create_casefile_respondent_details_third_party_reference',
  'create_casefile_respondent_details_third_party_address_line_1',
  'create_casefile_respondent_details_third_party_address_line_2',
  'create_casefile_respondent_details_third_party_address_line_3',
  'create_casefile_respondent_details_third_party_address_line_4',
  'create_casefile_respondent_details_third_party_address_line_5',
  'create_casefile_respondent_details_third_party_postal_or_zip_code',
  'create_casefile_respondent_details_third_party_country_id',
] as const;

const EMPLOYER_CONTROL_NAMES = [
  'create_casefile_respondent_details_employer_name',
  'create_casefile_respondent_details_employee_reference',
  'create_casefile_respondent_details_employer_email_address',
  'create_casefile_respondent_details_employer_telephone_number',
  'create_casefile_respondent_details_employer_address_line_1',
  'create_casefile_respondent_details_employer_address_line_2',
  'create_casefile_respondent_details_employer_address_line_3',
  'create_casefile_respondent_details_employer_address_line_4',
  'create_casefile_respondent_details_employer_address_line_5',
  'create_casefile_respondent_details_employer_postal_or_zip_code',
  'create_casefile_respondent_details_employer_country_id',
] as const;

interface IRespondentAliasFormRow {
  [controlName: string]: string | null;
}

type IRespondentDetailsRawFormData = Omit<
  ICasesCreateCasefileRespondentDetailsFormData,
  'create_casefile_respondent_details_aliases' | 'create_casefile_respondent_details_third_party_country_id'
> & {
  create_casefile_respondent_details_aliases: IRespondentAliasFormRow[];
  create_casefile_respondent_details_third_party_country_id: string | number | null;
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
    GovukTextAreaComponent,
    GovukTextInputComponent,
    MojDatePickerComponent,
    CasesCreateCasefileContactDetailsComponent,
    CasesCreateCasefileAddressComponent,
    CasesCreateCasefileThirdPartyComponent,
    CasesCreateCasefileRestrictedInformationComponent,
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
      checkbox: 'create_casefile_respondent_details_send_correspondence_to_third_party',
      requiredText: [
        'create_casefile_respondent_details_third_party_name_or_organisation',
        'create_casefile_respondent_details_third_party_relationship',
        'create_casefile_respondent_details_third_party_address_line_1',
      ],
      requiredCountry: ['create_casefile_respondent_details_third_party_country_id'],
      controls: THIRD_PARTY_CONTROL_NAMES,
    },
    {
      checkbox: 'create_casefile_respondent_details_add_employer_details',
      requiredText: [
        'create_casefile_respondent_details_employer_name',
        'create_casefile_respondent_details_employer_address_line_1',
      ],
      requiredCountry: ['create_casefile_respondent_details_employer_country_id'],
      controls: EMPLOYER_CONTROL_NAMES,
    },
    {
      checkbox: 'create_casefile_respondent_details_restricted_information',
      requiredText: ['create_casefile_respondent_details_restricted_information_reason'],
      requiredCountry: [],
      controls: ['create_casefile_respondent_details_restricted_information_reason'],
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
  public readonly fieldNames = CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES;
  public readonly contactDetailsFieldNames: ICasesCreateCasefileContactFieldNames = {
    mainEmailAddress: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.mainEmailAddress,
    otherEmailAddress: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.otherEmailAddress,
    mainTelephoneNumber: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.mainTelephoneNumber,
    otherTelephoneNumber: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.otherTelephoneNumber,
  };
  public readonly addressFieldNames: ICasesCreateCasefileAddressFieldNames = {
    addressLine1: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.addressLine1,
    addressLine2: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.addressLine2,
    addressLine3: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.addressLine3,
    addressLine4: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.addressLine4,
    addressLine5: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.addressLine5,
    postalOrZipCode: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.postalOrZipCode,
    countryId: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.countryId,
  };
  public readonly thirdPartyFieldNames: ICasesCreateCasefileThirdPartyFieldNames = {
    nameOrOrganisation: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyNameOrOrganisation,
    relationship: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyRelationship,
    reference: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyReference,
    addressLine1: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyAddressLine1,
    addressLine2: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyAddressLine2,
    addressLine3: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyAddressLine3,
    addressLine4: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyAddressLine4,
    addressLine5: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyAddressLine5,
    postalOrZipCode: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyPostalOrZipCode,
    countryId: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_FIELD_NAMES.thirdPartyCountryId,
  };
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
      create_casefile_respondent_details_title: new FormControl<string | null>(null, optionalMaxLengthValidator(20)),
      create_casefile_respondent_details_first_names: new FormControl<string | null>(null, [
        casesCreateCasefileRespondentDetailsTrimRequiredValidator,
        Validators.maxLength(50),
      ]),
      create_casefile_respondent_details_last_name: new FormControl<string | null>(null, [
        casesCreateCasefileRespondentDetailsTrimRequiredValidator,
        Validators.maxLength(50),
      ]),
      create_casefile_respondent_details_add_aliases: new FormControl(false, { nonNullable: true }),
      create_casefile_respondent_details_aliases: new FormArray<FormGroup>([]),
      create_casefile_respondent_details_date_of_birth: new FormControl<string | null>(null, [
        optionalValidDateValidator(),
        dateOfBirthValidator(),
      ]),
      create_casefile_respondent_details_national_insurance_number: new FormControl<string | null>(
        null,
        casesCreateCasefileRespondentDetailsNationalInsuranceNumberValidator,
      ),
      create_casefile_respondent_details_other_personal_information: new FormControl<string | null>(
        null,
        optionalMaxLengthValidator(200),
      ),
      create_casefile_respondent_details_main_email_address: contactControls.mainEmailAddress,
      create_casefile_respondent_details_other_email_address: contactControls.otherEmailAddress,
      create_casefile_respondent_details_main_telephone_number: contactControls.mainTelephoneNumber,
      create_casefile_respondent_details_other_telephone_number: contactControls.otherTelephoneNumber,
      create_casefile_respondent_details_address_line_1: addressControls.addressLine1,
      create_casefile_respondent_details_address_line_2: addressControls.addressLine2,
      create_casefile_respondent_details_address_line_3: addressControls.addressLine3,
      create_casefile_respondent_details_address_line_4: addressControls.addressLine4,
      create_casefile_respondent_details_address_line_5: addressControls.addressLine5,
      create_casefile_respondent_details_postal_or_zip_code: addressControls.postalOrZipCode,
      create_casefile_respondent_details_country_id: addressControls.countryId,
      create_casefile_respondent_details_send_correspondence_to_third_party: new FormControl(false, {
        nonNullable: true,
      }),
      create_casefile_respondent_details_third_party_name_or_organisation: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(40),
      ),
      create_casefile_respondent_details_third_party_relationship: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(40),
      ),
      create_casefile_respondent_details_third_party_reference: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(40),
      ),
      create_casefile_respondent_details_third_party_address_line_1: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(30),
      ),
      create_casefile_respondent_details_third_party_address_line_2: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_respondent_details_third_party_address_line_3: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_respondent_details_third_party_address_line_4: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_respondent_details_third_party_address_line_5: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_respondent_details_third_party_postal_or_zip_code: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(10),
      ),
      create_casefile_respondent_details_third_party_country_id: new FormControl<number | null>(
        disabled(null),
        this.countrySelectionValidator(this.countrySelectOptions),
      ),
      create_casefile_respondent_details_add_employer_details: new FormControl(false, { nonNullable: true }),
      create_casefile_respondent_details_employer_name: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(50),
      ),
      create_casefile_respondent_details_employee_reference: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(20),
      ),
      create_casefile_respondent_details_employer_email_address: new FormControl<string | null>(
        disabled(null),
        emailValidators,
      ),
      create_casefile_respondent_details_employer_telephone_number: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(35),
      ),
      create_casefile_respondent_details_employer_address_line_1: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(30),
      ),
      create_casefile_respondent_details_employer_address_line_2: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_respondent_details_employer_address_line_3: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_respondent_details_employer_address_line_4: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_respondent_details_employer_address_line_5: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_respondent_details_employer_postal_or_zip_code: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(10),
      ),
      create_casefile_respondent_details_employer_country_id: new FormControl<number | null>(
        disabled(null),
        this.countrySelectionValidator(this.countryAutocompleteItems),
      ),
      create_casefile_respondent_details_restricted_information: new FormControl(false, { nonNullable: true }),
      create_casefile_respondent_details_restricted_information_reason: new FormControl<string | null>(
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
      [`create_casefile_respondent_details_alias_first_names_${index}`]: alias.firstNames,
      [`create_casefile_respondent_details_alias_last_name_${index}`]: alias.lastName,
    }));
  }

  private mapIndexedRowsToAliases(rows: IRespondentAliasFormRow[]): ICasesCreateCasefilePartyAlias[] {
    return rows.map((row, index) => ({
      firstNames: row[`create_casefile_respondent_details_alias_first_names_${index}`]!,
      lastName: row[`create_casefile_respondent_details_alias_last_name_${index}`]!,
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
    this.form.controls['create_casefile_respondent_details_add_aliases'].valueChanges
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
      create_casefile_respondent_details_aliases: this.mapAliasesToIndexedRows(
        state.create_casefile_respondent_details_aliases,
      ),
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
        create_casefile_respondent_details_aliases: this.mapIndexedRowsToAliases(
          rawValue.create_casefile_respondent_details_aliases,
        ),
        create_casefile_respondent_details_third_party_country_id: this.normalizeThirdPartyCountryId(
          rawValue.create_casefile_respondent_details_third_party_country_id,
        ),
      },
      nestedFlow: false,
    });
  }

  public override ngOnInit(): void {
    this.setupForm();
    this.setupAliasConfiguration();
    this.setupAliasFormControls(
      [...new Array(this.initialFormData.create_casefile_respondent_details_aliases.length).keys()],
      'create_casefile_respondent_details_aliases',
    );
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    this.setUpAliasCheckboxListener(
      'create_casefile_respondent_details_add_aliases',
      'create_casefile_respondent_details_aliases',
    );
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
