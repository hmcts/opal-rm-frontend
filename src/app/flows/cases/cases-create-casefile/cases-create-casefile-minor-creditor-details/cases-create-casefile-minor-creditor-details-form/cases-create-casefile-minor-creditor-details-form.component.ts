import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { GovukRadiosItemComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-radio';
import type { IGovUkSelectOptions } from '@hmcts/opal-frontend-common/components/govuk/govuk-select/interfaces';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { CasesCreateCasefileAddressComponent } from '../../components/cases-create-casefile-address/cases-create-casefile-address.component';
import type { ICasesCreateCasefileAddressFieldNames } from '../../components/cases-create-casefile-address/interfaces/cases-create-casefile-address-field-names.interface';
import { CasesCreateCasefileBankDetailsComponent } from '../../components/cases-create-casefile-bank-details/cases-create-casefile-bank-details.component';
import type { ICasesCreateCasefileBankDetailsFieldNames } from '../../components/cases-create-casefile-bank-details/interfaces/cases-create-casefile-bank-details-field-names.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS } from '../../constants/cases-create-casefile-applicant-bank-options.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_ERRORS } from '../constants/cases-create-casefile-minor-creditor-field-errors.constant';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from '../constants/cases-create-casefile-minor-creditor-field-names.constant';
import type { ICasesCreateCasefileMinorCreditorFormData } from '../interfaces/cases-create-casefile-minor-creditor-form-data.interface';
import type { ICasesCreateCasefileMinorCreditorForm } from '../interfaces/cases-create-casefile-minor-creditor-form.interface';
import {
  applyMinorCreditorBranches,
  createMinorCreditorForm,
  type CasesCreateCasefileMinorCreditorFormGroup,
} from '../utils/cases-create-casefile-minor-creditor-form';
import { toMinorCreditorDetails, toMinorCreditorFormData } from '../utils/cases-create-casefile-minor-creditor-mapper';

@Component({
  selector: 'app-cases-create-casefile-minor-creditor-details-form',
  imports: [
    ReactiveFormsModule,
    GovukCancelLinkComponent,
    GovukErrorSummaryComponent,
    GovukRadiosItemComponent,
    GovukTextInputComponent,
    CasesCreateCasefileAddressComponent,
    CasesCreateCasefileBankDetailsComponent,
  ],
  templateUrl: './cases-create-casefile-minor-creditor-details-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileMinorCreditorDetailsFormComponent extends AbstractFormBaseComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private entrySnapshot!: ICasesCreateCasefileMinorCreditorFormData;

  protected override fieldErrors = CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_ERRORS;
  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileMinorCreditorForm>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileMinorCreditorFormData;
  @Input({ required: true }) public countryAutocompleteItems!: IAlphagovAccessibleAutocompleteItem[];
  @Input({ required: true }) public countrySelectOptions!: IGovUkSelectOptions[];

  public override form!: CasesCreateCasefileMinorCreditorFormGroup;
  public readonly fieldNames = F;
  public readonly identityOptions = [
    {
      value: 'individual',
      label: 'Individual',
      conditionalId: 'create_casefile_minor_creditor_individual',
      fields: [
        { name: F.title, label: 'Title' },
        { name: F.firstNames, label: 'First names' },
        { name: F.lastName, label: 'Last name' },
      ],
    },
    {
      value: 'organisation',
      label: 'Organisation',
      conditionalId: 'create_casefile_minor_creditor_organisation',
      fields: [{ name: F.organisationName, label: 'Organisation name' }],
    },
  ] as const;
  public readonly addressFieldNames: ICasesCreateCasefileAddressFieldNames = {
    addressLine1: F.addressLine1,
    addressLine2: F.addressLine2,
    addressLine3: F.addressLine3,
    addressLine4: F.addressLine4,
    addressLine5: F.addressLine5,
    postalOrZipCode: F.postalOrZipCode,
    countryId: F.countryId,
  };
  public readonly bankFieldNames: ICasesCreateCasefileBankDetailsFieldNames = {
    bankType: F.bankType,
    ukNameOnAccount: F.ukNameOnAccount,
    ukSortCode: F.ukSortCode,
    ukAccountNumber: F.ukAccountNumber,
    ukPaymentReference: F.ukPaymentReference,
    nonUkNameOnAccount: F.nonUkNameOnAccount,
    nonUkAccountNumber: F.nonUkAccountNumber,
    nonUkPaymentReference: F.nonUkPaymentReference,
    nonUkBicSwiftCode: F.nonUkBicSwiftCode,
    nonUkIban: F.nonUkIban,
    nonUkBankName: F.nonUkBankName,
    nonUkBranchSortCode: F.nonUkBranchSortCode,
  };
  public readonly bankOptions = CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS;
  public readonly bankTypes = CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES;
  public readonly ukBankConditionalId = 'create_casefile_minor_creditor_uk_bank';
  public readonly nonUkBankConditionalId = 'create_casefile_minor_creditor_non_uk_bank';
  public readonly bankLayout = {
    headingMode: 'fieldset',
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

  private normalizeCurrentData(): ICasesCreateCasefileMinorCreditorFormData {
    const data = this.form.getRawValue();
    return this.form.valid ? toMinorCreditorFormData(toMinorCreditorDetails(data)) : data;
  }

  private clearBranchErrors(names: readonly string[]): void {
    const summaryWasShown = this.formErrorSummaryMessage.length > 0;
    if (summaryWasShown) this.handleErrorMessages();
    names.forEach((name) => (this.formControlErrorMessages[name] = null));
    Object.entries(this.form.controls)
      .filter(([, control]) => control.disabled)
      .forEach(([name]) => (this.formControlErrorMessages[name] = null));
  }

  protected override hasUnsavedChanges(): boolean {
    const current = this.normalizeCurrentData();
    return Object.values(F).some((fieldName) => current[fieldName] !== this.entrySnapshot[fieldName]);
  }

  public acceptSavedData(data: ICasesCreateCasefileMinorCreditorFormData): void {
    this.form.patchValue(data, { emitEvent: false });
    applyMinorCreditorBranches(this.form, (names) => this.clearBranchErrors(names));
    this.entrySnapshot = this.normalizeCurrentData();
    this.form.markAsPristine();
    this.formSubmitted = false;
    this.unsavedChanges.emit(false);
  }

  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.handleErrorMessages();
    if (!this.form.valid) {
      super.handleFormSubmit(event);
      this.formSubmitted = false;
      return;
    }

    this.formSubmitted = true;
    this.unsavedChanges.emit(this.hasUnsavedChanges());
    this.formSubmit.emit({ formData: this.form.getRawValue(), nestedFlow: false });
    this.formSubmitted = false;
  }

  public override ngOnInit(): void {
    this.form = createMinorCreditorForm(this.countryAutocompleteItems);
    this.setInitialErrorMessages();
    this.form.patchValue(this.initialFormData, { emitEvent: false });
    applyMinorCreditorBranches(this.form, (names) => this.clearBranchErrors(names));
    this.entrySnapshot = this.normalizeCurrentData();
    this.form.markAsPristine();

    this.form.controls[F.creditorType].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => applyMinorCreditorBranches(this.form, (names) => this.clearBranchErrors(names)));
    this.form.controls[F.bankType].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => applyMinorCreditorBranches(this.form, (names) => this.clearBranchErrors(names)));

    super.ngOnInit();
  }
}
