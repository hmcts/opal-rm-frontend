import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { MojDatePickerComponent } from '@hmcts/opal-frontend-common/components/moj/moj-date-picker';
import { EMAIL_ADDRESS_PATTERN } from '@hmcts/opal-frontend-common/constants';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { dateOfBirthValidator } from '@hmcts/opal-frontend-common/validators/date-of-birth';
import { optionalMaxLengthValidator } from '@hmcts/opal-frontend-common/validators/optional-max-length';
import { optionalValidDateValidator } from '@hmcts/opal-frontend-common/validators/optional-valid-date';
import { patternValidator } from '@hmcts/opal-frontend-common/validators/pattern-validator';
import { CasesCreateCasefilePartyAliasConditionalFormComponent } from '../../components/abstract/cases-create-casefile-party-alias-conditional-form/cases-create-casefile-party-alias-conditional-form.component';
import { CasesCreateCasefileAddressComponent } from '../../components/cases-create-casefile-address/cases-create-casefile-address.component';
import type { ICasesCreateCasefileAddressFieldNames } from '../../components/cases-create-casefile-address/interfaces/cases-create-casefile-address-field-names.interface';
import { CasesCreateCasefileBankDetailsComponent } from '../../components/cases-create-casefile-bank-details/cases-create-casefile-bank-details.component';
import type { ICasesCreateCasefileBankDetailsFieldNames } from '../../components/cases-create-casefile-bank-details/interfaces/cases-create-casefile-bank-details-field-names.interface';
import { CasesCreateCasefileContactDetailsComponent } from '../../components/cases-create-casefile-contact-details/cases-create-casefile-contact-details.component';
import type { ICasesCreateCasefileContactFieldNames } from '../../components/cases-create-casefile-contact-details/interfaces/cases-create-casefile-contact-field-names.interface';
import { CasesCreateCasefileRestrictedInformationComponent } from '../../components/cases-create-casefile-restricted-information/cases-create-casefile-restricted-information.component';
import { CasesCreateCasefileThirdPartyComponent } from '../../components/cases-create-casefile-third-party/cases-create-casefile-third-party.component';
import type { ICasesCreateCasefileThirdPartyFieldNames } from '../../components/cases-create-casefile-third-party/interfaces/cases-create-casefile-third-party-field-names.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefilePartyAlias } from '../../interfaces/cases-create-casefile-party-alias.interface';
import type { CasesCreateCasefileApplicantBankType } from '../../types/cases-create-casefile-applicant-bank-type.type';
import {
  createCasesCreateCasefileApplicantBankBranchController,
  type ICasesCreateCasefileApplicantBankBranchController,
} from '../../utils/cases-create-casefile-applicant-bank-branch-controller';
import {
  createCasesCreateCasefileAddressControls,
  createCasesCreateCasefileApplicantBankControls,
  createCasesCreateCasefileContactControls,
  type ICasesCreateCasefileApplicantBankControls,
} from '../../utils/cases-create-casefile-form-control-builders';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_ALIAS } from '../constants/cases-create-casefile-applicant-individual-alias.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS } from '../../constants/cases-create-casefile-applicant-bank-options.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_ERRORS } from '../constants/cases-create-casefile-applicant-individual-field-errors.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-applicant-individual-field-names.constant';
import type { ICasesCreateCasefileApplicantIndividualFieldErrors } from '../interfaces/cases-create-casefile-applicant-individual-field-errors.interface';
import type { ICasesCreateCasefileApplicantIndividualFormData } from '../interfaces/cases-create-casefile-applicant-individual-form-data.interface';
import type { ICasesCreateCasefileApplicantIndividualForm } from '../interfaces/cases-create-casefile-applicant-individual-form.interface';
import { createCasesCreateCasefileCountrySelectionValidator } from '../../validators/cases-create-casefile-country-selection.validator';
import { casesCreateCasefileApplicantIndividualTrimRequiredValidator } from '../validators/cases-create-casefile-applicant-individual-trim-required.validator';

const THIRD_PARTY_CONTROL_NAMES = [
  'create_casefile_applicant_individual_third_party_name_or_organisation',
  'create_casefile_applicant_individual_third_party_relationship',
  'create_casefile_applicant_individual_third_party_reference',
  'create_casefile_applicant_individual_third_party_address_line_1',
  'create_casefile_applicant_individual_third_party_address_line_2',
  'create_casefile_applicant_individual_third_party_address_line_3',
  'create_casefile_applicant_individual_third_party_address_line_4',
  'create_casefile_applicant_individual_third_party_address_line_5',
  'create_casefile_applicant_individual_third_party_postal_or_zip_code',
  'create_casefile_applicant_individual_third_party_country_id',
] as const;

interface IApplicantAliasFormRow {
  [controlName: string]: string | null;
}

interface IApplicantIndividualFormControls {
  create_casefile_applicant_individual_title: FormControl<string | null>;
  create_casefile_applicant_individual_first_names: FormControl<string | null>;
  create_casefile_applicant_individual_last_name: FormControl<string | null>;
  create_casefile_applicant_individual_add_aliases: FormControl<boolean>;
  create_casefile_applicant_individual_aliases: FormArray<FormGroup>;
  create_casefile_applicant_individual_date_of_birth: FormControl<string | null>;
  create_casefile_applicant_individual_main_email_address: FormControl<string | null>;
  create_casefile_applicant_individual_other_email_address: FormControl<string | null>;
  create_casefile_applicant_individual_main_telephone_number: FormControl<string | null>;
  create_casefile_applicant_individual_other_telephone_number: FormControl<string | null>;
  create_casefile_applicant_individual_address_line_1: FormControl<string | null>;
  create_casefile_applicant_individual_address_line_2: FormControl<string | null>;
  create_casefile_applicant_individual_address_line_3: FormControl<string | null>;
  create_casefile_applicant_individual_address_line_4: FormControl<string | null>;
  create_casefile_applicant_individual_address_line_5: FormControl<string | null>;
  create_casefile_applicant_individual_postal_or_zip_code: FormControl<string | null>;
  create_casefile_applicant_individual_country_id: FormControl<number | null>;
  create_casefile_applicant_individual_send_correspondence_to_third_party: FormControl<boolean>;
  create_casefile_applicant_individual_third_party_name_or_organisation: FormControl<string | null>;
  create_casefile_applicant_individual_third_party_relationship: FormControl<string | null>;
  create_casefile_applicant_individual_third_party_reference: FormControl<string | null>;
  create_casefile_applicant_individual_third_party_address_line_1: FormControl<string | null>;
  create_casefile_applicant_individual_third_party_address_line_2: FormControl<string | null>;
  create_casefile_applicant_individual_third_party_address_line_3: FormControl<string | null>;
  create_casefile_applicant_individual_third_party_address_line_4: FormControl<string | null>;
  create_casefile_applicant_individual_third_party_address_line_5: FormControl<string | null>;
  create_casefile_applicant_individual_third_party_postal_or_zip_code: FormControl<string | null>;
  create_casefile_applicant_individual_third_party_country_id: FormControl<number | null>;
  create_casefile_applicant_individual_bank_type: FormControl<CasesCreateCasefileApplicantBankType | null>;
  create_casefile_applicant_individual_uk_bank_name_on_account: FormControl<string | null>;
  create_casefile_applicant_individual_uk_bank_sort_code: FormControl<string | null>;
  create_casefile_applicant_individual_uk_bank_account_number: FormControl<string | null>;
  create_casefile_applicant_individual_uk_bank_payment_reference: FormControl<string | null>;
  create_casefile_applicant_individual_non_uk_bank_name_on_account: FormControl<string | null>;
  create_casefile_applicant_individual_non_uk_bank_account_number: FormControl<string | null>;
  create_casefile_applicant_individual_non_uk_bank_payment_reference: FormControl<string | null>;
  create_casefile_applicant_individual_non_uk_bank_bic_swift_code: FormControl<string | null>;
  create_casefile_applicant_individual_non_uk_bank_iban: FormControl<string | null>;
  create_casefile_applicant_individual_non_uk_bank_name: FormControl<string | null>;
  create_casefile_applicant_individual_non_uk_bank_branch_sort_code: FormControl<string | null>;
  create_casefile_applicant_individual_restricted_information: FormControl<boolean>;
  create_casefile_applicant_individual_restricted_information_reason: FormControl<string | null>;
}

type ApplicantIndividualRawFormData = Omit<
  ICasesCreateCasefileApplicantIndividualFormData,
  'create_casefile_applicant_individual_aliases' | 'create_casefile_applicant_individual_third_party_country_id'
> & {
  create_casefile_applicant_individual_aliases: IApplicantAliasFormRow[];
  create_casefile_applicant_individual_third_party_country_id: string | number | null;
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
    GovukTextInputComponent,
    MojDatePickerComponent,
    CasesCreateCasefileContactDetailsComponent,
    CasesCreateCasefileAddressComponent,
    CasesCreateCasefileBankDetailsComponent,
    CasesCreateCasefileThirdPartyComponent,
    CasesCreateCasefileRestrictedInformationComponent,
  ],
  templateUrl: './cases-create-casefile-applicant-individual-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileApplicantIndividualFormComponent
  extends CasesCreateCasefilePartyAliasConditionalFormComponent<
    keyof IApplicantIndividualFormControls,
    IApplicantAliasFormRow
  >
  implements OnInit
{
  private bankBranchController!: ICasesCreateCasefileApplicantBankBranchController;
  private bankControls!: ICasesCreateCasefileApplicantBankControls;
  protected override readonly conditionalBranches = [
    {
      checkbox: 'create_casefile_applicant_individual_send_correspondence_to_third_party',
      requiredText: [
        'create_casefile_applicant_individual_third_party_name_or_organisation',
        'create_casefile_applicant_individual_third_party_relationship',
        'create_casefile_applicant_individual_third_party_address_line_1',
      ],
      requiredCountry: ['create_casefile_applicant_individual_third_party_country_id'],
      controls: THIRD_PARTY_CONTROL_NAMES,
    },
    {
      checkbox: 'create_casefile_applicant_individual_restricted_information',
      requiredText: ['create_casefile_applicant_individual_restricted_information_reason'],
      requiredCountry: [],
      controls: ['create_casefile_applicant_individual_restricted_information_reason'],
    },
  ] as const;
  protected override readonly requiredTextValidator = casesCreateCasefileApplicantIndividualTrimRequiredValidator;

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
  public readonly thirdPartyFieldNames: ICasesCreateCasefileThirdPartyFieldNames = {
    nameOrOrganisation: FIELD_NAMES.thirdPartyNameOrOrganisation,
    relationship: FIELD_NAMES.thirdPartyRelationship,
    reference: FIELD_NAMES.thirdPartyReference,
    addressLine1: FIELD_NAMES.thirdPartyAddressLine1,
    addressLine2: FIELD_NAMES.thirdPartyAddressLine2,
    addressLine3: FIELD_NAMES.thirdPartyAddressLine3,
    addressLine4: FIELD_NAMES.thirdPartyAddressLine4,
    addressLine5: FIELD_NAMES.thirdPartyAddressLine5,
    postalOrZipCode: FIELD_NAMES.thirdPartyPostalOrZipCode,
    countryId: FIELD_NAMES.thirdPartyCountryId,
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
    headingMode: 'heading',
    nonUkFieldOrder: [
      'nonUkNameOnAccount',
      'nonUkAccountNumber',
      'nonUkPaymentReference',
      'nonUkBicSwiftCode',
      'nonUkIban',
      'nonUkBankName',
      'nonUkBranchSortCode',
    ],
  } as const;
  public yesterday!: string;

  private setupForm(): void {
    const emailValidators = [optionalMaxLengthValidator(76), patternValidator(EMAIL_ADDRESS_PATTERN, 'emailPattern')];
    const contactControls = createCasesCreateCasefileContactControls({
      emailValidators,
      telephoneValidators: [optionalMaxLengthValidator(35)],
    });
    const addressControls = createCasesCreateCasefileAddressControls({
      requiredTextValidator: casesCreateCasefileApplicantIndividualTrimRequiredValidator,
      countryValidators: [
        Validators.required,
        createCasesCreateCasefileCountrySelectionValidator(this.countryAutocompleteItems),
      ],
    });
    this.bankControls = createCasesCreateCasefileApplicantBankControls({
      bankTypeValidators: [Validators.required],
      nonUkAccountNumberValidators: [optionalMaxLengthValidator(20)],
    });
    const disabled = <T>(value: T): { value: T; disabled: true } => ({ value, disabled: true });

    this.form = new FormGroup<IApplicantIndividualFormControls>({
      create_casefile_applicant_individual_title: new FormControl<string | null>(null, optionalMaxLengthValidator(20)),
      create_casefile_applicant_individual_first_names: new FormControl<string | null>(null, [
        casesCreateCasefileApplicantIndividualTrimRequiredValidator,
        Validators.maxLength(50),
      ]),
      create_casefile_applicant_individual_last_name: new FormControl<string | null>(null, [
        casesCreateCasefileApplicantIndividualTrimRequiredValidator,
        Validators.maxLength(50),
      ]),
      create_casefile_applicant_individual_add_aliases: new FormControl(false, { nonNullable: true }),
      create_casefile_applicant_individual_aliases: new FormArray<FormGroup>([]),
      create_casefile_applicant_individual_date_of_birth: new FormControl<string | null>(null, [
        optionalValidDateValidator(),
        dateOfBirthValidator(),
      ]),
      create_casefile_applicant_individual_main_email_address: contactControls.mainEmailAddress,
      create_casefile_applicant_individual_other_email_address: contactControls.otherEmailAddress,
      create_casefile_applicant_individual_main_telephone_number: contactControls.mainTelephoneNumber,
      create_casefile_applicant_individual_other_telephone_number: contactControls.otherTelephoneNumber,
      create_casefile_applicant_individual_address_line_1: addressControls.addressLine1,
      create_casefile_applicant_individual_address_line_2: addressControls.addressLine2,
      create_casefile_applicant_individual_address_line_3: addressControls.addressLine3,
      create_casefile_applicant_individual_address_line_4: addressControls.addressLine4,
      create_casefile_applicant_individual_address_line_5: addressControls.addressLine5,
      create_casefile_applicant_individual_postal_or_zip_code: addressControls.postalOrZipCode,
      create_casefile_applicant_individual_country_id: addressControls.countryId,
      create_casefile_applicant_individual_send_correspondence_to_third_party: new FormControl(false, {
        nonNullable: true,
      }),
      create_casefile_applicant_individual_third_party_name_or_organisation: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(40),
      ),
      create_casefile_applicant_individual_third_party_relationship: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(40),
      ),
      create_casefile_applicant_individual_third_party_reference: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(40),
      ),
      create_casefile_applicant_individual_third_party_address_line_1: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(30),
      ),
      create_casefile_applicant_individual_third_party_address_line_2: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_applicant_individual_third_party_address_line_3: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_applicant_individual_third_party_address_line_4: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_applicant_individual_third_party_address_line_5: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(30),
      ),
      create_casefile_applicant_individual_third_party_postal_or_zip_code: new FormControl<string | null>(
        disabled(null),
        optionalMaxLengthValidator(10),
      ),
      create_casefile_applicant_individual_third_party_country_id: new FormControl<number | null>(
        disabled(null),
        createCasesCreateCasefileCountrySelectionValidator(this.countrySelectOptions),
      ),
      create_casefile_applicant_individual_bank_type: this.bankControls.bankType,
      create_casefile_applicant_individual_uk_bank_name_on_account: this.bankControls.ukBankNameOnAccount,
      create_casefile_applicant_individual_uk_bank_sort_code: this.bankControls.ukBankSortCode,
      create_casefile_applicant_individual_uk_bank_account_number: this.bankControls.ukBankAccountNumber,
      create_casefile_applicant_individual_uk_bank_payment_reference: this.bankControls.ukBankPaymentReference,
      create_casefile_applicant_individual_non_uk_bank_name_on_account: this.bankControls.nonUkBankNameOnAccount,
      create_casefile_applicant_individual_non_uk_bank_account_number: this.bankControls.nonUkBankAccountNumber,
      create_casefile_applicant_individual_non_uk_bank_payment_reference: this.bankControls.nonUkBankPaymentReference,
      create_casefile_applicant_individual_non_uk_bank_bic_swift_code: this.bankControls.nonUkBankBicSwiftCode,
      create_casefile_applicant_individual_non_uk_bank_iban: this.bankControls.nonUkBankIban,
      create_casefile_applicant_individual_non_uk_bank_name: this.bankControls.nonUkBankName,
      create_casefile_applicant_individual_non_uk_bank_branch_sort_code: this.bankControls.nonUkBankBranchSortCode,
      create_casefile_applicant_individual_restricted_information: new FormControl(false, { nonNullable: true }),
      create_casefile_applicant_individual_restricted_information_reason: new FormControl<string | null>(
        disabled(null),
        Validators.maxLength(250),
      ),
    });

    this.bankBranchController = createCasesCreateCasefileApplicantBankBranchController({
      controls: this.bankControls,
      fieldNames: this.bankFieldNames,
      requiredTextValidator: casesCreateCasefileApplicantIndividualTrimRequiredValidator,
      clearErrors: (fieldNames) => this.clearConditionalBranchErrors(fieldNames),
      destroy$: this.partyAliasConditionalDestroyed$,
    });
  }

  private setupAliasConfiguration(): void {
    this.aliasFields = CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_ALIAS.map((control) => control.controlName);
    this.aliasControlsValidation = CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_ALIAS;
  }

  private mapAliasesToIndexedRows(aliases: ICasesCreateCasefilePartyAlias[]): IApplicantAliasFormRow[] {
    return aliases.map((alias, index) => ({
      [`create_casefile_applicant_individual_alias_first_names_${index}`]: alias.firstNames,
      [`create_casefile_applicant_individual_alias_last_name_${index}`]: alias.lastName,
    }));
  }

  protected override rePopulateForm(state: ICasesCreateCasefileApplicantIndividualFormData): void {
    super.rePopulateForm({
      ...state,
      create_casefile_applicant_individual_aliases: this.mapAliasesToIndexedRows(
        state.create_casefile_applicant_individual_aliases,
      ),
    });
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
        create_casefile_applicant_individual_aliases: this.mapAliases(
          rawValue.create_casefile_applicant_individual_aliases,
        ),
        create_casefile_applicant_individual_third_party_country_id: this.normaliseCountryId(
          rawValue.create_casefile_applicant_individual_third_party_country_id,
        ),
      },
      nestedFlow: false,
    });
  }

  public override ngOnInit(): void {
    this.setupForm();
    this.setupAliasConfiguration();
    this.setupAliasFormControls(
      [...new Array(this.initialFormData.create_casefile_applicant_individual_aliases.length).keys()],
      'create_casefile_applicant_individual_aliases',
    );
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    this.setUpAliasCheckboxListener(
      'create_casefile_applicant_individual_add_aliases',
      'create_casefile_applicant_individual_aliases',
    );
    this.initialisePartyAliasConditionalBehaviour();
    this.applyInitialConditionalBranches();
    this.bankBranchController.connect();
    this.bankBranchController.applySelection(this.bankControls.bankType.value);
    this.yesterday = this.dateService.getPreviousDate({ days: 1 });
    super.ngOnInit();
  }
}
