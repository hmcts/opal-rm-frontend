import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { AlphagovAccessibleAutocompleteComponent } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_ERRORS } from '../constants/cases-create-casefile-central-authority-field-errors.constant';
import { CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES } from '../constants/cases-create-casefile-central-authority-field-names.constant';
import type { ICasesCreateCasefileCentralAuthorityFieldErrors } from '../interfaces/cases-create-casefile-central-authority-field-errors.interface';
import type { ICasesCreateCasefileCentralAuthorityFormData } from '../interfaces/cases-create-casefile-central-authority-form-data.interface';
import type { ICasesCreateCasefileCentralAuthorityForm } from '../interfaces/cases-create-casefile-central-authority-form.interface';

interface ICasesCreateCasefileCentralAuthorityFormControls {
  create_casefile_central_authority_remo_reference: FormControl<string | null>;
  create_casefile_central_authority_reference: FormControl<string | null>;
  create_casefile_central_authority_major_creditor_id: FormControl<number | null>;
}

@Component({
  selector: 'app-cases-create-casefile-central-authority-form',
  imports: [
    ReactiveFormsModule,
    AlphagovAccessibleAutocompleteComponent,
    GovukCancelLinkComponent,
    GovukErrorSummaryComponent,
    GovukTextInputComponent,
  ],
  templateUrl: './cases-create-casefile-central-authority-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCentralAuthorityFormComponent extends AbstractFormBaseComponent implements OnInit {
  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileCentralAuthorityForm>();
  protected override fieldErrors: ICasesCreateCasefileCentralAuthorityFieldErrors =
    CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_ERRORS;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileCentralAuthorityFormData;
  @Input({ required: true }) public centralAuthorityAutocompleteItems!: IAlphagovAccessibleAutocompleteItem[];
  public readonly fieldNames = CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES;
  public override form = new FormGroup<ICasesCreateCasefileCentralAuthorityFormControls>({
    create_casefile_central_authority_remo_reference: new FormControl<string | null>(null, Validators.maxLength(20)),
    create_casefile_central_authority_reference: new FormControl<string | null>(null, Validators.maxLength(50)),
    create_casefile_central_authority_major_creditor_id: new FormControl<number | null>(null),
  });

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
    this.setInitialErrorMessages();
    this.rePopulateForm(this.initialFormData);
    super.ngOnInit();
  }
}
