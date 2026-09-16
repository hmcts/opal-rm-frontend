import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { AlphagovAccessibleAutocompleteComponent } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { GovukSelectComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-select';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { MojDatePickerComponent } from '@hmcts/opal-frontend-common/components/moj/moj-date-picker';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_ERRORS } from '../constants/cases-create-casefile-order-details-field-errors.constant';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_NAMES } from '../constants/cases-create-casefile-order-details-field-names.constant';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES } from '../constants/cases-create-casefile-order-details-payment-frequencies.constant';
import type { ICasesCreateCasefileOrderDetailsFieldErrors } from '../interfaces/cases-create-casefile-order-details-field-errors.interface';
import type { ICasesCreateCasefileOrderDetailsFormData } from '../interfaces/cases-create-casefile-order-details-form-data.interface';
import type { ICasesCreateCasefileOrderDetailsForm } from '../interfaces/cases-create-casefile-order-details-form.interface';
import { createCasesCreateCasefileOrderDetailsApplicationValidator } from '../validators/cases-create-casefile-order-details-application.validator';
import { createCasesCreateCasefileOrderDetailsDateValidator } from '../validators/cases-create-casefile-order-details-date.validator';

@Component({
  selector: 'app-cases-create-casefile-order-details-form',
  imports: [
    ReactiveFormsModule,
    AlphagovAccessibleAutocompleteComponent,
    GovukCancelLinkComponent,
    GovukErrorSummaryComponent,
    GovukTextInputComponent,
    GovukSelectComponent,
    MojDatePickerComponent,
  ],
  templateUrl: './cases-create-casefile-order-details-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderDetailsFormComponent extends AbstractFormBaseComponent implements OnInit {
  private readonly dates = inject(DateService);
  private applicationText = '';

  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileOrderDetailsForm>();
  protected override fieldErrors: ICasesCreateCasefileOrderDetailsFieldErrors =
    CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_ERRORS;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileOrderDetailsFormData;
  @Input({ required: true }) public applicationAutocompleteItems!: IAlphagovAccessibleAutocompleteItem[];
  public readonly fieldNames = CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_NAMES;
  public readonly today = this.dates.getDateNow().toFormat('dd/MM/yyyy');
  public readonly paymentFrequencyOptions = CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES.map((value) => ({
    value,
    name: value,
  }));
  public override form = new FormGroup({
    create_casefile_order_details_application_id: new FormControl<number | string | null>(null),
    create_casefile_order_details_court: new FormControl<string | null>(null, Validators.maxLength(40)),
    create_casefile_order_details_date_order_made: new FormControl<string | null>(
      null,
      createCasesCreateCasefileOrderDetailsDateValidator(this.dates),
    ),
    create_casefile_order_details_payment_frequency: new FormControl<string | null>(null, (control) =>
      CASES_CREATE_CASEFILE_ORDER_DETAILS_PAYMENT_FREQUENCIES.some((value) => value === control.value)
        ? null
        : { required: true },
    ),
    create_casefile_order_details_date_arrears_last_updated: new FormControl<string | null>(null, [
      Validators.required,
      createCasesCreateCasefileOrderDetailsDateValidator(this.dates),
    ]),
  });

  public handleApplicationInput(event: Event): void {
    const input = event.target;

    if (!(input instanceof HTMLInputElement) || input.id !== `${this.fieldNames.applicationId}-autocomplete`) {
      return;
    }

    this.applicationText = input.value;
    const control = this.form.controls.create_casefile_order_details_application_id;
    control.markAsDirty();
    control.setValue(input.value);
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
    this.formSubmit.emit({ formData: this.form.getRawValue(), nestedFlow: false });
  }

  public override ngOnInit(): void {
    this.form.controls.create_casefile_order_details_application_id.addValidators(
      createCasesCreateCasefileOrderDetailsApplicationValidator(
        this.applicationAutocompleteItems,
        () => this.applicationText,
      ),
    );
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    super.ngOnInit();
  }
}
