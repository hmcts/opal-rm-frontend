import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileCommentsNotesFormComponent } from './cases-create-casefile-comments-notes-form/cases-create-casefile-comments-notes-form.component';
import { CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES } from './constants/cases-create-casefile-comments-notes-field-names.constant';
import type { ICasesCreateCasefileCommentsNotesFormData } from './interfaces/cases-create-casefile-comments-notes-form-data.interface';
import type { ICasesCreateCasefileCommentsNotesForm } from './interfaces/cases-create-casefile-comments-notes-form.interface';

@Component({
  selector: 'app-cases-create-casefile-comments-notes',
  imports: [CasesCreateCasefileCommentsNotesFormComponent],
  templateUrl: './cases-create-casefile-comments-notes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCommentsNotesComponent extends AbstractFormParentBaseComponent implements OnDestroy {
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly taskListPath =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
  private readonly savedCommentsAndNotes = this.store.commentsAndNotes();

  public readonly initialFormData: ICasesCreateCasefileCommentsNotesFormData = {
    [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.comment]: this.savedCommentsAndNotes?.comment ?? null,
    [CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.note]: this.savedCommentsAndNotes?.note ?? null,
  };

  public handleFormSubmit(form: ICasesCreateCasefileCommentsNotesForm): void {
    this.store.setCommentsAndNotes({
      comment: form.formData[CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.comment],
      note: form.formData[CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.note],
    });
    this.stateUnsavedChanges = false;
    this.routerNavigate(this.taskListPath, true);
  }

  public handleUnsavedChanges(unsavedChanges: boolean): void {
    this.store.setUnsavedChanges(unsavedChanges);
    this.stateUnsavedChanges = unsavedChanges;
  }

  public handleCancel(): void {
    this.routerNavigate(this.taskListPath, true);
  }

  public ngOnDestroy(): void {
    this.store.setUnsavedChanges(false);
  }
}
