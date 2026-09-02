import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import {
  GovukRadioComponent,
  GovukRadiosDividerComponent,
  GovukRadiosItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-radio';
import type { CasesCreateCasefileIndexationType } from '../../types/cases-create-casefile-indexation-type.type';
import { CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_ERRORS } from '../constants/cases-create-casefile-interest-indexation-field-errors.constant';
import { CASES_CREATE_CASEFILE_INTEREST_INDEXATION_OPTIONS } from '../constants/cases-create-casefile-interest-indexation-options.constant';
import type { ICasesCreateCasefileInterestIndexationFieldErrors } from '../interfaces/cases-create-casefile-interest-indexation-field-errors.interface';
import type { ICasesCreateCasefileInterestIndexationFormData } from '../interfaces/cases-create-casefile-interest-indexation-form-data.interface';
import type { ICasesCreateCasefileInterestIndexationForm } from '../interfaces/cases-create-casefile-interest-indexation-form.interface';

@Component({
  selector: 'app-cases-create-casefile-interest-indexation-form',
  imports: [
    ReactiveFormsModule,
    GovukCancelLinkComponent,
    GovukErrorSummaryComponent,
    GovukRadioComponent,
    GovukRadiosDividerComponent,
    GovukRadiosItemComponent,
  ],
  templateUrl: './cases-create-casefile-interest-indexation-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileInterestIndexationFormComponent extends AbstractFormBaseComponent implements OnInit {
  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileInterestIndexationForm>();
  protected override fieldErrors: ICasesCreateCasefileInterestIndexationFieldErrors =
    CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_ERRORS;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileInterestIndexationFormData;
  public readonly options = CASES_CREATE_CASEFILE_INTEREST_INDEXATION_OPTIONS;
  public override form = new FormGroup({
    interestApplies: new FormControl<boolean | null>(null, Validators.required),
    indexationType: new FormControl<CasesCreateCasefileIndexationType | null>(null, Validators.required),
  });

  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (!this.form.valid) {
      super.handleFormSubmit(event);
      return;
    }

    const { interestApplies, indexationType } = this.form.getRawValue();
    if (interestApplies === null || indexationType === null) {
      return;
    }

    this.handleErrorMessages();
    this.formSubmitted = true;
    this.unsavedChanges.emit(this.hasUnsavedChanges());
    this.formSubmit.emit({ formData: { interestApplies, indexationType }, nestedFlow: false });
  }

  public override ngOnInit(): void {
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    super.ngOnInit();
  }
}
