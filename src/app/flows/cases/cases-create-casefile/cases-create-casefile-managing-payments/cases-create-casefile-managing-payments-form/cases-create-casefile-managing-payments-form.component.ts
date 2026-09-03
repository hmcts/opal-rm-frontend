import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import {
  GovukRadioComponent,
  GovukRadiosItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-radio';
import type { CasesCreateCasefilePaymentArrangement } from '../../types/cases-create-casefile-payment-arrangement.type';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_ERRORS } from '../constants/cases-create-casefile-managing-payments-field-errors.constant';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES } from '../constants/cases-create-casefile-managing-payments-field-names.constant';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_OPTIONS } from '../constants/cases-create-casefile-managing-payments-options.constant';
import type { ICasesCreateCasefileManagingPaymentsFieldErrors } from '../interfaces/cases-create-casefile-managing-payments-field-errors.interface';
import type { ICasesCreateCasefileManagingPaymentsFormData } from '../interfaces/cases-create-casefile-managing-payments-form-data.interface';
import type { ICasesCreateCasefileManagingPaymentsForm } from '../interfaces/cases-create-casefile-managing-payments-form.interface';

@Component({
  selector: 'app-cases-create-casefile-managing-payments-form',
  imports: [
    ReactiveFormsModule,
    GovukCancelLinkComponent,
    GovukErrorSummaryComponent,
    GovukRadioComponent,
    GovukRadiosItemComponent,
  ],
  templateUrl: './cases-create-casefile-managing-payments-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileManagingPaymentsFormComponent extends AbstractFormBaseComponent implements OnInit {
  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileManagingPaymentsForm>();
  protected override fieldErrors: ICasesCreateCasefileManagingPaymentsFieldErrors =
    CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_ERRORS;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileManagingPaymentsFormData;
  public readonly options = CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_OPTIONS;
  public readonly fieldNames = CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES;
  public override form = new FormGroup({
    [CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement]:
      new FormControl<CasesCreateCasefilePaymentArrangement | null>(null, Validators.required),
  });

  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (!this.form.valid) {
      super.handleFormSubmit(event);
      return;
    }

    const paymentArrangement =
      this.form.getRawValue()[CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement];
    if (paymentArrangement === null) {
      return;
    }

    this.handleErrorMessages();
    this.formSubmitted = true;
    this.unsavedChanges.emit(this.hasUnsavedChanges());
    this.formSubmit.emit({
      formData: {
        [CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement]: paymentArrangement,
      },
      nestedFlow: false,
    });
  }

  public override ngOnInit(): void {
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    super.ngOnInit();
  }
}
