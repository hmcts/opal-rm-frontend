import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  inject,
} from '@angular/core';
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
  private applicationSelectionConfirmed = true;

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

  public constructor() {
    super();
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    const renderer = inject(Renderer2);
    const destroyRef = inject(DestroyRef);
    // Capture the active ARIA option before the autocomplete closes its menu.
    for (const eventName of ['keydown', 'click']) {
      destroyRef.onDestroy(
        renderer.listen(
          host,
          eventName,
          (event: MouseEvent | KeyboardEvent) => this.handleApplicationSelection(event),
          { capture: true },
        ),
      );
    }
  }

  public handleApplicationInput(event: Event): void {
    const input = event.target;

    if (!(input instanceof HTMLInputElement) || input.id !== `${this.fieldNames.applicationId}-autocomplete`) {
      return;
    }

    this.applicationText = input.value;
    this.applicationSelectionConfirmed = false;
    const control = this.form.controls.create_casefile_order_details_application_id;
    control.markAsDirty();
    control.setValue(input.value);
  }

  public handleApplicationSelection(event: MouseEvent | KeyboardEvent): void {
    const target = event.target;
    const activeOptionId =
      event instanceof KeyboardEvent && event.key === 'Enter' && target instanceof Element
        ? target.getAttribute('aria-activedescendant')
        : null;
    const option =
      target instanceof Element
        ? (target.closest('[role="option"]') ??
          (activeOptionId ? target.ownerDocument.getElementById(activeOptionId) : null))
        : null;
    const activated = event.type === 'click' || (event instanceof KeyboardEvent && ['Enter', ' '].includes(event.key));

    if (
      !option?.id.startsWith(`${this.fieldNames.applicationId}-autocomplete__option--`) ||
      option.getAttribute('aria-disabled') === 'true' ||
      !activated
    ) {
      return;
    }

    this.applicationSelectionConfirmed = true;
    this.form.controls.create_casefile_order_details_application_id.updateValueAndValidity();
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
    // The shared autocomplete also resolves exact text to an ID on blur. This
    // journey requires an explicit option activation after the user types.
    this.form.controls.create_casefile_order_details_application_id.addValidators(() =>
      this.applicationText.trim() && !this.applicationSelectionConfirmed ? { invalidSelection: true } : null,
    );
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    super.ngOnInit();
  }
}
