import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { takeUntil } from 'rxjs';
import {
  CASES_CREATE_CASEFILE_APPLICANT_TYPES,
  CasesCreateCasefileApplicantType,
} from '../../constants/cases-create-casefile-applicant-types.constant';
import {
  CASES_CREATE_CASEFILE_CASE_TYPES,
  CasesCreateCasefileCaseType,
} from '../../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_ERRORS } from '../constants/cases-create-casefile-case-type-field-errors.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPE_OPTIONS } from '../constants/cases-create-casefile-case-type-options.constant';
import { ICasesCreateCasefileCaseTypeFieldErrors } from '../interfaces/cases-create-casefile-case-type-field-errors.interface';
import { ICasesCreateCasefileCaseTypeFormData } from '../interfaces/cases-create-casefile-case-type-form-data.interface';
import { ICasesCreateCasefileCaseTypeForm } from '../interfaces/cases-create-casefile-case-type-form.interface';

@Component({
  selector: 'app-cases-create-casefile-case-type-form',
  imports: [ReactiveFormsModule, GovukCancelLinkComponent, GovukErrorSummaryComponent],
  templateUrl: './cases-create-casefile-case-type-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCaseTypeFormComponent extends AbstractFormBaseComponent implements OnInit {
  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileCaseTypeForm>();
  protected override fieldErrors: ICasesCreateCasefileCaseTypeFieldErrors =
    CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_ERRORS;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileCaseTypeFormData;
  public readonly caseTypeOptions = CASES_CREATE_CASEFILE_CASE_TYPE_OPTIONS;
  public readonly applicantTypes = Object.values(CASES_CREATE_CASEFILE_APPLICANT_TYPES);
  public readonly caseTypes = CASES_CREATE_CASEFILE_CASE_TYPES;
  public readonly applicantTypeConditionalId = 'applicantTypeConditional';

  public get caseTypeControl(): FormControl<CasesCreateCasefileCaseType | null> {
    return this.form.controls['caseType'] as FormControl<CasesCreateCasefileCaseType | null>;
  }

  public get applicantTypeControl(): FormControl<CasesCreateCasefileApplicantType | null> {
    return this.form.controls['applicantType'] as FormControl<CasesCreateCasefileApplicantType | null>;
  }

  private setupForm(): void {
    this.form = new FormGroup({
      caseType: new FormControl<CasesCreateCasefileCaseType | null>(null, Validators.required),
      applicantType: new FormControl<CasesCreateCasefileApplicantType | null>({ value: null, disabled: true }),
    });
  }

  private updateApplicantTypeRequirement(caseType: CasesCreateCasefileCaseType | null): void {
    if (caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN) {
      this.applicantTypeControl.setValidators(Validators.required);
      this.applicantTypeControl.enable({ emitEvent: false });
    } else {
      this.applicantTypeControl.reset(null, { emitEvent: false });
      this.applicantTypeControl.clearValidators();
      this.applicantTypeControl.disable({ emitEvent: false });
      this.clearApplicantTypeErrors();
    }

    this.applicantTypeControl.updateValueAndValidity({ emitEvent: false });
  }

  private clearApplicantTypeErrors(): void {
    this.formControlErrorMessages['applicantType'] = null;
    this.formErrorSummaryMessage = this.formErrorSummaryMessage.filter((error) => error.fieldId !== 'applicantType');
    this.formErrors = (this.formErrors ?? []).filter((error) => error.fieldId !== 'applicantType');
  }

  private setupCaseTypeListener(): void {
    this.caseTypeControl.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((caseType) => this.updateApplicantTypeRequirement(caseType));
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
    this.setupForm();
    this.setInitialErrorMessages();
    this.setupCaseTypeListener();
    this.rePopulateForm(this.initialFormData);
    this.updateApplicantTypeRequirement(this.caseTypeControl.value);
    if (this.caseTypeControl.value === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN) {
      this.applicantTypeControl.setValue(this.initialFormData.applicantType, { emitEvent: false });
    }
    super.ngOnInit();
  }
}
