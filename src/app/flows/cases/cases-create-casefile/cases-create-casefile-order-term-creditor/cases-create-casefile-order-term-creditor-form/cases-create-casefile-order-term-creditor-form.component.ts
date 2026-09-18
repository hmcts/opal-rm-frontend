import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import type { SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import {
  GovukRadioComponent,
  GovukRadiosConditionalComponent,
  GovukRadiosDividerComponent,
  GovukRadiosItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-radio';
import { GovukSelectComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-select';
import type { IGovUkSelectOptions } from '@hmcts/opal-frontend-common/components/govuk/govuk-select/interfaces';
import { GENERIC_HTTP_ERROR_MESSAGE } from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { takeUntil } from 'rxjs';
import type { ICasesCreateCasefileMinorCreditor } from '../../interfaces/cases-create-casefile-minor-creditor.interface';
import { CASES_CREATE_CASEFILE_ORDER_TERM_CREDITOR_FIELD_ERRORS } from '../constants/cases-create-casefile-order-term-creditor-field-errors.constant';
import { CASES_CREATE_CASEFILE_ORDER_TERM_CREDITOR_FIELD_NAMES } from '../constants/cases-create-casefile-order-term-creditor-field-names.constant';
import type { ICasesCreateCasefileMajorCreditorsLoadState } from '../interfaces/cases-create-casefile-major-creditors-load-state.interface';
import type { ICasesCreateCasefileOrderTermCreditorFormData } from '../interfaces/cases-create-casefile-order-term-creditor-form-data.interface';
import type { ICasesCreateCasefileOrderTermCreditorForm } from '../interfaces/cases-create-casefile-order-term-creditor-form.interface';

interface CreditorFormControls {
  create_casefile_order_term_creditor_choice: FormControl<string | null>;
  create_casefile_order_term_creditor_major_creditor_id: FormControl<number | string | null>;
}

@Component({
  selector: 'app-cases-create-casefile-order-term-creditor-form',
  imports: [
    ReactiveFormsModule,
    GovukCancelLinkComponent,
    GovukErrorSummaryComponent,
    GovukRadioComponent,
    GovukRadiosConditionalComponent,
    GovukRadiosDividerComponent,
    GovukRadiosItemComponent,
    GovukSelectComponent,
  ],
  templateUrl: './cases-create-casefile-order-term-creditor-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermCreditorFormComponent
  extends AbstractFormBaseComponent
  implements OnInit, OnChanges
{
  private initialized = false;
  private entrySnapshot!: ICasesCreateCasefileOrderTermCreditorFormData;

  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileOrderTermCreditorForm>();
  protected override fieldErrors = CASES_CREATE_CASEFILE_ORDER_TERM_CREDITOR_FIELD_ERRORS;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();
  @Output() public readonly retry = new EventEmitter<void>();
  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileOrderTermCreditorFormData;
  @Input({ required: true }) public applicantLabel!: string;
  @Input({ required: true }) public minorCreditors!: ICasesCreateCasefileMinorCreditor[];
  @Input({ required: true }) public loadState!: ICasesCreateCasefileMajorCreditorsLoadState;

  public readonly fieldNames = CASES_CREATE_CASEFILE_ORDER_TERM_CREDITOR_FIELD_NAMES;
  public readonly conditionalId = 'create_casefile_order_term_creditor_major';
  public majorOptions: IGovUkSelectOptions[] = [];
  public retryVisible = false;
  public statusMessage = '';
  public override form = new FormGroup<CreditorFormControls>({
    create_casefile_order_term_creditor_choice: new FormControl<string | null>(null, [
      Validators.required,
      (control) => (!control.value || this.choiceValid(control.value) ? null : { invalidSelection: true }),
    ]),
    create_casefile_order_term_creditor_major_creditor_id: new FormControl<number | string | null>(null),
  });

  private choiceValid(value: string): boolean {
    return (
      ['applicant', 'major', 'add-new'].includes(value) ||
      this.minorCreditors?.some((creditor) => value === `minor:${creditor.sequenceNumber}`)
    );
  }

  private majorSelectionValid(): boolean {
    const control = this.form.controls[this.fieldNames.majorCreditorId];
    return (
      control.enabled &&
      this.loadState?.status === 'ready' &&
      this.loadState.records.some((record) => String(record.major_creditor_id) === String(control.value))
    );
  }

  private applyLoadState(): void {
    this.majorOptions = [
      { name: 'Select a major creditor', value: '' },
      ...this.loadState.records.map((record) => ({
        name: `${record.major_creditor_code} - ${record.name}`,
        value: record.major_creditor_id,
      })),
    ];
    this.retryVisible =
      this.loadState.status === 'empty' ||
      this.loadState.status === 'error' ||
      (this.loadState.status === 'loading' && this.retryVisible);
    this.statusMessage =
      this.loadState.status === 'loading'
        ? 'Loading major creditors…'
        : this.loadState.status === 'empty'
          ? 'No major creditors are available. Choose another creditor or try again.'
          : this.loadState.status === 'error'
            ? GENERIC_HTTP_ERROR_MESSAGE
            : 'Major creditors loaded.';
    this.revalidate();
  }

  private revalidate(): void {
    this.form.controls[this.fieldNames.choice].updateValueAndValidity({ emitEvent: false });
    this.form.controls[this.fieldNames.majorCreditorId].updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
    if (this.formErrorSummaryMessage?.length) this.handleErrorMessages();
  }

  private normalized(
    value: ICasesCreateCasefileOrderTermCreditorFormData,
  ): ICasesCreateCasefileOrderTermCreditorFormData {
    const choice = value[this.fieldNames.choice] || null;
    const majorId =
      choice === 'major' && value[this.fieldNames.majorCreditorId] !== null
        ? String(value[this.fieldNames.majorCreditorId])
        : null;
    return { [this.fieldNames.choice]: choice, [this.fieldNames.majorCreditorId]: majorId };
  }

  protected override hasUnsavedChanges(): boolean {
    if (this.formSubmitted) return false;
    const current = this.normalized(this.form.getRawValue());
    const entry = this.entrySnapshot;
    return (
      current[this.fieldNames.choice] !== entry[this.fieldNames.choice] ||
      current[this.fieldNames.majorCreditorId] !== entry[this.fieldNames.majorCreditorId]
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized) {
      if (changes['initialFormData']) {
        this.entrySnapshot = this.normalized(this.initialFormData);
        this.formSubmitted = false;
      }
      this.applyLoadState();
      this.unsavedChanges.emit(this.hasUnsavedChanges());
    }
  }

  public override ngOnInit(): void {
    const major = this.form.controls[this.fieldNames.majorCreditorId];
    major.addValidators(() =>
      this.form.controls[this.fieldNames.choice].value === 'major' && !this.majorSelectionValid()
        ? { invalidSelection: true }
        : null,
    );
    this.form.addValidators(() =>
      this.form.controls[this.fieldNames.choice].value === 'major' && !this.majorSelectionValid()
        ? { majorCreditorRequired: true }
        : null,
    );
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    this.entrySnapshot = this.normalized(this.initialFormData);
    this.form.controls[this.fieldNames.choice].valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((choice) => {
      if (choice !== 'major') {
        major.setValue(null, { emitEvent: false });
        major.setErrors(null);
      }
      this.revalidate();
    });
    this.initialized = true;
    this.applyLoadState();
    super.ngOnInit();
  }

  public handleRetry(): void {
    if (this.retryVisible) this.retry.emit();
  }

  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const major = this.form.controls[this.fieldNames.majorCreditorId];
    if (this.form.controls[this.fieldNames.choice].value === 'major' && this.loadState.status === 'ready') {
      const record = this.loadState.records.find(
        (candidate) => String(candidate.major_creditor_id) === String(major.value),
      );
      if (record) major.setValue(record.major_creditor_id, { emitEvent: false });
    }
    this.revalidate();
    super.handleFormSubmit(event);
    // Submission is only a proposal to the parent. Keep later edits observable when the parent rejects stale context
    // or accepts locally but navigation fails; an accepted initialFormData input change rebases entrySnapshot.
    this.formSubmitted = false;
  }
}
