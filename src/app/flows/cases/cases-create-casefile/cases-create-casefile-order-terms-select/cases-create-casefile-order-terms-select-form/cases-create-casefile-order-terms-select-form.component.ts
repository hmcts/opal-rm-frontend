import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import type { IGovUkSelectOptions } from '@hmcts/opal-frontend-common/components/govuk/govuk-select/interfaces';
import { GENERIC_HTTP_ERROR_MESSAGE } from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { CASES_CREATE_CASEFILE_ORDER_TERMS_SELECT_FIELD_ERRORS } from '../constants/cases-create-casefile-order-terms-select-field-errors.constant';
import { CASES_CREATE_CASEFILE_ORDER_TERMS_SELECT_FIELD_NAMES } from '../constants/cases-create-casefile-order-terms-select-field-names.constant';
import type { ICasesCreateCasefileOrderTermsLoadState } from '../interfaces/cases-create-casefile-order-terms-load-state.interface';
import type { ICasesCreateCasefileOrderTermsSelectFormData } from '../interfaces/cases-create-casefile-order-terms-select-form-data.interface';
import type { ICasesCreateCasefileOrderTermsSelectForm } from '../interfaces/cases-create-casefile-order-terms-select-form.interface';

@Component({
  selector: 'app-cases-create-casefile-order-terms-select-form',
  imports: [ReactiveFormsModule, GovukCancelLinkComponent, GovukErrorSummaryComponent],
  templateUrl: './cases-create-casefile-order-terms-select-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsSelectFormComponent
  extends AbstractFormBaseComponent
  implements OnInit, OnChanges
{
  private initialized = false;

  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileOrderTermsSelectForm>();
  protected override fieldErrors = CASES_CREATE_CASEFILE_ORDER_TERMS_SELECT_FIELD_ERRORS;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();
  @Output() public readonly retry = new EventEmitter<void>();
  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileOrderTermsSelectFormData;
  @Input({ required: true }) public loadState!: ICasesCreateCasefileOrderTermsLoadState;
  public readonly field = 'create_casefile_order_terms_select_result_id';
  public readonly fieldNames = CASES_CREATE_CASEFILE_ORDER_TERMS_SELECT_FIELD_NAMES;
  public readonly safeErrorMessage = GENERIC_HTTP_ERROR_MESSAGE;
  public options: IGovUkSelectOptions[] = [];
  public retryVisible = false;
  public override form = new FormGroup({
    create_casefile_order_terms_select_result_id: new FormControl<string | null>(null, [
      Validators.required,
      (control) =>
        !control.value || this.loadState?.records.some((record) => record.result_id === control.value)
          ? null
          : { invalidSelection: true },
    ]),
  });

  private applyLoadState(): void {
    this.retryVisible ||= this.loadState.status === 'error';
    const control = this.form.controls[this.field];
    this.options = [
      { name: 'Select an order', value: '' },
      ...this.loadState.records.map(({ result_id, result_title }) => ({
        name: `${result_id} - ${result_title}`,
        value: result_id,
      })),
    ];
    const successful = this.loadState.status === 'ready' || this.loadState.status === 'empty';
    if (successful && control.value && !this.loadState.records.some((record) => record.result_id === control.value)) {
      control.setValue('', { emitEvent: false });
    }
    if (control.value === null) control.setValue('', { emitEvent: false });
    if (this.loadState.status === 'ready') control.enable({ emitEvent: false });
    else control.disable({ emitEvent: false });
    control.updateValueAndValidity({ emitEvent: false });
    if (this.formErrorSummaryMessage?.length) this.handleErrorMessages();
  }

  protected override hasUnsavedChanges(): boolean {
    return (
      !this.formSubmitted &&
      (this.form.controls[this.field].value || null) !==
        this.initialFormData.create_casefile_order_terms_select_result_id
    );
  }

  public ngOnChanges(): void {
    if (this.initialized) {
      this.applyLoadState();
      this.unsavedChanges.emit(this.hasUnsavedChanges());
    }
  }

  public override ngOnInit(): void {
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    this.initialized = true;
    this.applyLoadState();
    super.ngOnInit();
  }

  public handleRetry(): void {
    if (this.loadState.status === 'error') this.retry.emit();
  }

  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (this.loadState.status !== 'ready') return;
    this.form.controls[this.field].updateValueAndValidity({ emitEvent: false });
    super.handleFormSubmit(event);
  }
}
