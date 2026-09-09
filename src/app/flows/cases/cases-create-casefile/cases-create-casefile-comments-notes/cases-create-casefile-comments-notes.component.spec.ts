import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileCommentsNotesFormComponent } from './cases-create-casefile-comments-notes-form/cases-create-casefile-comments-notes-form.component';
import { CasesCreateCasefileCommentsNotesComponent } from './cases-create-casefile-comments-notes.component';
import { CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES as FIELD_NAMES } from './constants/cases-create-casefile-comments-notes-field-names.constant';

describe('CasesCreateCasefileCommentsNotesComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileCommentsNotesComponent>;
  let component: CasesCreateCasefileCommentsNotesComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = createSpyObj(Router, ['navigate']);

  const createComponent = (): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileCommentsNotesComponent);
    component = fixture.componentInstance;
  };

  const renderForm = (): CasesCreateCasefileCommentsNotesFormComponent => {
    fixture.detectChanges();
    return fixture.debugElement.query(
      (debugElement) => debugElement.componentInstance instanceof CasesCreateCasefileCommentsNotesFormComponent,
    ).componentInstance as CasesCreateCasefileCommentsNotesFormComponent;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCommentsNotesComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { parent: null } },
      ],
    }).compileComponents();

    router['navigate'].mockReset();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  it('supplies empty initial values when nothing has been saved', () => {
    createComponent();

    expect(component.initialFormData).toEqual({
      [FIELD_NAMES.comment]: null,
      [FIELD_NAMES.note]: null,
    });
  });

  it('supplies both saved values for editing', () => {
    store.setCommentsAndNotes({ comment: 'Saved comment', note: 'Saved note' });

    createComponent();

    expect(component.initialFormData).toEqual({
      [FIELD_NAMES.comment]: 'Saved comment',
      [FIELD_NAMES.note]: 'Saved note',
    });
  });

  it('renders and wires the typed form inside the two-thirds container', () => {
    store.setCommentsAndNotes({ comment: 'Saved comment', note: null });
    createComponent();

    const child = renderForm();

    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(child.initialFormData).toEqual({
      [FIELD_NAMES.comment]: 'Saved comment',
      [FIELD_NAMES.note]: null,
    });
  });

  it('saves and replaces both values, marks Provided and returns to Case details', () => {
    store.setCommentsAndNotes({ comment: 'Old comment', note: 'Old note' });
    createComponent();

    renderForm()['formSubmit'].emit({
      formData: {
        [FIELD_NAMES.comment]: 'New comment',
        [FIELD_NAMES.note]: 'New note',
      },
      nestedFlow: false,
    });

    expect(store.commentsAndNotes()).toEqual({ comment: 'New comment', note: 'New note' });
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
    expect(component.stateUnsavedChanges).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('saves blank optional values, restores Optional and returns to Case details', () => {
    store.setCommentsAndNotes({ comment: 'Old comment', note: 'Old note' });
    createComponent();

    component.handleFormSubmit({
      formData: {
        [FIELD_NAMES.comment]: '',
        [FIELD_NAMES.note]: '   ',
      },
      nestedFlow: false,
    });

    expect(store.commentsAndNotes()).toEqual({ comment: null, note: null });
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('mirrors rendered form dirty state into the store and parent guard contract', () => {
    createComponent();

    renderForm()['unsavedChanges'].emit(true);

    expect(store.unsavedChanges()).toBe(true);
    expect(component.stateUnsavedChanges).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
  });

  it('routes rendered dirty Cancel through protected navigation without changing saved values', () => {
    store.setCommentsAndNotes({ comment: 'Saved comment', note: 'Saved note' });
    createComponent();
    component.handleUnsavedChanges(true);

    renderForm().cancel.emit();

    expect(store.commentsAndNotes()).toEqual({ comment: 'Saved comment', note: 'Saved note' });
    expect(store.unsavedChanges()).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('routes clean Cancel directly to Case details', () => {
    createComponent();

    component.handleCancel();

    expect(store.commentsAndNotes()).toBeNull();
    expect(store.unsavedChanges()).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('clears only transient dirty state during destruction', () => {
    store.setCommentsAndNotes({ comment: 'Saved comment', note: 'Saved note' });
    createComponent();
    component.handleUnsavedChanges(true);

    component.ngOnDestroy();

    expect(store.commentsAndNotes()).toEqual({ comment: 'Saved comment', note: 'Saved note' });
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.stateChanges()).toBe(true);
    expect(store.unsavedChanges()).toBe(false);
  });
});
