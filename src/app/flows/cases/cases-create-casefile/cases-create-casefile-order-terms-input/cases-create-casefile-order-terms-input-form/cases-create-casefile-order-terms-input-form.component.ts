import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { takeUntil } from 'rxjs';
import { FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { AlphagovAccessibleAutocompleteComponent } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import {
  GovukCheckboxesComponent,
  GovukCheckboxesItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-checkboxes';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import {
  GovukRadioComponent,
  GovukRadiosItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-radio';
import { GovukSelectComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-select';
import { GovukTextAreaComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-area';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { MojDatePickerComponent } from '@hmcts/opal-frontend-common/components/moj/moj-date-picker';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { ICasesCreateCasefileOrderTermDraftChange } from '../interfaces/cases-create-casefile-order-term-draft-change.interface';
import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';
import type { CasesCreateCasefileOrderTermRawValue } from '../types/cases-create-casefile-order-term-raw-value.type';
import { orderTermErrorMessages } from '../utils/cases-create-casefile-order-term-errors';
import { createOrderTermValidator } from '../validators/cases-create-casefile-order-term.validator';

@Component({
  selector: 'app-cases-create-casefile-order-terms-input-form',
  imports: [
    ReactiveFormsModule,
    GovukTextInputComponent,
    GovukTextAreaComponent,
    GovukSelectComponent,
    GovukRadioComponent,
    GovukRadiosItemComponent,
    GovukCheckboxesComponent,
    GovukCheckboxesItemComponent,
    GovukErrorSummaryComponent,
    GovukCancelLinkComponent,
    MojDatePickerComponent,
    AlphagovAccessibleAutocompleteComponent,
  ],
  templateUrl: './cases-create-casefile-order-terms-input-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsInputFormComponent extends AbstractFormBaseComponent implements OnInit {
  private readonly dates = inject(DateService);
  private initialRaw: Record<string, CasesCreateCasefileOrderTermRawValue> = {};

  @Output() protected override formSubmit = new EventEmitter<{
    formData: Record<string, CasesCreateCasefileOrderTermRawValue>;
    nestedFlow: boolean;
  }>();

  @Input({ required: true }) public page!: ICasesCreateCasefileOrderTermPage;
  @Input({ required: true }) public initialValues!: Record<string, CasesCreateCasefileOrderTermRawValue>;
  @Input({ required: true }) public frequency!: string;
  @Input() public initialDirty = false;
  @Output() public readonly draftChange = new EventEmitter<ICasesCreateCasefileOrderTermDraftChange>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();
  public override form = new FormRecord<FormControl<CasesCreateCasefileOrderTermRawValue>>({});
  public views: {
    field: ICasesCreateCasefileOrderTermField;
    control: FormControl<CasesCreateCasefileOrderTermRawValue> | null;
    options: { value: string; name: string }[];
  }[] = [];

  protected override hasUnsavedChanges(): boolean {
    return (
      !this.formSubmitted &&
      (this.initialDirty ||
        Object.entries(this.form.getRawValue()).some(([id, value]) => value !== this.initialRaw[id]))
    );
  }

  public override ngOnInit(): void {
    this.views = this.page.fields.map((field) => {
      // The published widget treats suggestion names as HTML. Encode metadata at that boundary.
      const options = field.options.map((option) => ({
        value: option.value,
        name:
          field.kind === 'autocomplete'
            ? option.label
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;')
            : option.label,
      }));
      const initialValue = Object.hasOwn(this.initialValues, field.name) ? this.initialValues[field.name] : null;
      const control =
        field.kind === 'readonly'
          ? null
          : new FormControl<CasesCreateCasefileOrderTermRawValue>(
              initialValue ?? (field.kind === 'checkbox' ? false : ''),
              { validators: createOrderTermValidator(field, this.dates) },
            );
      const view = {
        field,
        control,
        options,
      };
      if (control) {
        this.form.addControl(field.id, control);
      }
      return view;
    });
    this.fieldErrors = Object.fromEntries(
      this.views.filter((view) => view.control).map((view) => [view.field.id, orderTermErrorMessages(view.field)]),
    );
    this.initialRaw = this.form.getRawValue();
    this.setInitialErrorMessages();
    this.form.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.formSubmitted = false;
      this.draftChange.emit({
        values: Object.fromEntries(
          this.views.filter((view) => view.control).map((view) => [view.field.name, view.control!.value]),
        ),
        dirty: this.hasUnsavedChanges(),
      });
    });
    super.ngOnInit();
  }

  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    for (const view of this.views) view.control?.updateValueAndValidity({ emitEvent: false });
    super.handleFormSubmit(event);
  }
}
