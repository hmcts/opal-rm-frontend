import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { EMAIL_ADDRESS_PATTERN } from '@hmcts/opal-frontend-common/constants';
import { optionalMaxLengthValidator } from '@hmcts/opal-frontend-common/validators/optional-max-length';
import { patternValidator } from '@hmcts/opal-frontend-common/validators/pattern-validator';
import { Subject } from 'rxjs';
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
  createCasesCreateCasefileApplicantBankBranchController,
  type ICasesCreateCasefileApplicantBankBranchController,
} from '../../utils/cases-create-casefile-applicant-bank-branch-controller';
import {
  createCasesCreateCasefileAddressControls,
  createCasesCreateCasefileApplicantBankControls,
  createCasesCreateCasefileContactControls,
  type ICasesCreateCasefileApplicantBankControls,
} from '../../utils/cases-create-casefile-form-control-builders';
import { createCasesCreateCasefileCountrySelectionValidator } from '../../validators/cases-create-casefile-country-selection.validator';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_ERRORS } from '../constants/cases-create-casefile-applicant-organisation-field-errors.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-applicant-organisation-field-names.constant';
import type { ICasesCreateCasefileApplicantOrganisationFieldErrors } from '../interfaces/cases-create-casefile-applicant-organisation-field-errors.interface';
import type { ICasesCreateCasefileApplicantOrganisationFormData } from '../interfaces/cases-create-casefile-applicant-organisation-form-data.interface';
import type { ICasesCreateCasefileApplicantOrganisationForm } from '../interfaces/cases-create-casefile-applicant-organisation-form.interface';
import { casesCreateCasefileApplicantOrganisationTrimRequiredValidator } from '../validators/cases-create-casefile-applicant-organisation-trim-required.validator';

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
  private bankBranchController!: ICasesCreateCasefileApplicantBankBranchController;
  private bankControls!: ICasesCreateCasefileApplicantBankControls;
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

  private setupForm(): void {
    const emailValidators = [optionalMaxLengthValidator(76), patternValidator(EMAIL_ADDRESS_PATTERN, 'emailPattern')];
    const contactControls = createCasesCreateCasefileContactControls({
      emailValidators,
      telephoneValidators: [optionalMaxLengthValidator(35)],
    });
    const addressControls = createCasesCreateCasefileAddressControls({
      requiredTextValidator: casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
      countryValidators: [
        Validators.required,
        createCasesCreateCasefileCountrySelectionValidator(this.countryAutocompleteItems),
      ],
    });
    this.bankControls = createCasesCreateCasefileApplicantBankControls({
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
      create_casefile_applicant_organisation_bank_type: this.bankControls.bankType,
      create_casefile_applicant_organisation_uk_bank_name_on_account: this.bankControls.ukBankNameOnAccount,
      create_casefile_applicant_organisation_uk_bank_sort_code: this.bankControls.ukBankSortCode,
      create_casefile_applicant_organisation_uk_bank_account_number: this.bankControls.ukBankAccountNumber,
      create_casefile_applicant_organisation_uk_bank_payment_reference: this.bankControls.ukBankPaymentReference,
      create_casefile_applicant_organisation_non_uk_bank_name_on_account: this.bankControls.nonUkBankNameOnAccount,
      create_casefile_applicant_organisation_non_uk_bank_bic_swift_code: this.bankControls.nonUkBankBicSwiftCode,
      create_casefile_applicant_organisation_non_uk_bank_iban: this.bankControls.nonUkBankIban,
      create_casefile_applicant_organisation_non_uk_bank_payment_reference: this.bankControls.nonUkBankPaymentReference,
      create_casefile_applicant_organisation_non_uk_bank_name: this.bankControls.nonUkBankName,
      create_casefile_applicant_organisation_non_uk_bank_branch_sort_code: this.bankControls.nonUkBankBranchSortCode,
      create_casefile_applicant_organisation_non_uk_bank_account_number: this.bankControls.nonUkBankAccountNumber,
    });

    this.bankBranchController = createCasesCreateCasefileApplicantBankBranchController({
      controls: this.bankControls,
      fieldNames: this.bankFieldNames,
      nonUkFieldOrder: this.bankLayout.nonUkFieldOrder,
      requiredTextValidator: casesCreateCasefileApplicantOrganisationTrimRequiredValidator,
      clearErrors: (fieldNames) => this.clearBankBranchErrors(fieldNames),
      destroy$: this.bankBranchesDestroyed,
    });
  }

  private clearBankBranchErrors(controlNames: readonly string[]): void {
    for (const controlName of controlNames) {
      this.formControlErrorMessages[controlName] = null;
    }
    this.formErrorSummaryMessage = this.formErrorSummaryMessage.filter(
      (error) => !controlNames.includes(error.fieldId),
    );
    this.formErrors = (this.formErrors ?? []).filter((error) => !controlNames.includes(error.fieldId));
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
    this.bankBranchController.connect();
    this.bankBranchController.applySelection(this.bankControls.bankType.value);
    super.ngOnInit();
  }

  public override ngOnDestroy(): void {
    this.bankBranchesDestroyed.next();
    this.bankBranchesDestroyed.complete();
    super.ngOnDestroy();
  }
}
