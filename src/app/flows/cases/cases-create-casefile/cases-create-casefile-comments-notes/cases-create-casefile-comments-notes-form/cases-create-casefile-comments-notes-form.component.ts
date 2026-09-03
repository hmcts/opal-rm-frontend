import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukCancelLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-cancel-link';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import { GovukInsetTextComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-inset-text';
import { CasesCreateCasefileCharacterCountTextareaComponent } from '../cases-create-casefile-character-count-textarea/cases-create-casefile-character-count-textarea.component';
import { CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_ERRORS } from '../constants/cases-create-casefile-comments-notes-field-errors.constant';
import { CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES } from '../constants/cases-create-casefile-comments-notes-field-names.constant';
import type { ICasesCreateCasefileCommentsNotesFieldErrors } from '../interfaces/cases-create-casefile-comments-notes-field-errors.interface';
import type { ICasesCreateCasefileCommentsNotesFormData } from '../interfaces/cases-create-casefile-comments-notes-form-data.interface';
import type { ICasesCreateCasefileCommentsNotesForm } from '../interfaces/cases-create-casefile-comments-notes-form.interface';

@Component({
  selector: 'app-cases-create-casefile-comments-notes-form',
  imports: [
    ReactiveFormsModule,
    GovukCancelLinkComponent,
    GovukErrorSummaryComponent,
    GovukInsetTextComponent,
    CasesCreateCasefileCharacterCountTextareaComponent,
  ],
  templateUrl: './cases-create-casefile-comments-notes-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCommentsNotesFormComponent extends AbstractFormBaseComponent implements OnInit {
  @Output() protected override formSubmit = new EventEmitter<ICasesCreateCasefileCommentsNotesForm>();
  protected override fieldErrors: ICasesCreateCasefileCommentsNotesFieldErrors =
    CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_ERRORS;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() public readonly cancel = new EventEmitter<void>();

  @Input({ required: true }) public initialFormData!: ICasesCreateCasefileCommentsNotesFormData;
  public readonly fieldNames = CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES;
  public override form = new FormGroup({
    [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.comment]: new FormControl<string | null>(null, [
      Validators.maxLength(250),
    ]),
    [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.note]: new FormControl<string | null>(null, [
      Validators.maxLength(1000),
    ]),
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
