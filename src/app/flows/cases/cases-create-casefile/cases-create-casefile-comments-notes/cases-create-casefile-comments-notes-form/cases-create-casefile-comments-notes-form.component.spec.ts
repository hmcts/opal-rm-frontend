import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-comments-notes-field-names.constant';
import type { ICasesCreateCasefileCommentsNotesFormData } from '../interfaces/cases-create-casefile-comments-notes-form-data.interface';
import { CasesCreateCasefileCommentsNotesFormComponent } from './cases-create-casefile-comments-notes-form.component';

describe('CasesCreateCasefileCommentsNotesFormComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileCommentsNotesFormComponent>;
  let component: CasesCreateCasefileCommentsNotesFormComponent;

  const emptyFormData: ICasesCreateCasefileCommentsNotesFormData = {
    [FIELD_NAMES.comment]: null,
    [FIELD_NAMES.note]: null,
  };

  const createComponent = (initialFormData: ICasesCreateCasefileCommentsNotesFormData = emptyFormData): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileCommentsNotesFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = initialFormData;
  };

  const submit = (): void => {
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();
  };

  const submitFromRenderedForm = (): void => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCommentsNotesFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    createComponent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('creates two optional typed controls with the exact limits', () => {
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual(emptyFormData);
    expect(component.form.valid).toBe(true);
    component.form.controls[FIELD_NAMES.comment].setValue('a'.repeat(251));
    component.form.controls[FIELD_NAMES.note].setValue('b'.repeat(1001));
    expect(component.form.controls[FIELD_NAMES.comment].hasError('maxlength')).toBe(true);
    expect(component.form.controls[FIELD_NAMES.note].hasError('maxlength')).toBe(true);
  });

  it('renders the approved content, hierarchy, actions and no Back link', () => {
    fixture.detectChanges();

    const textareas = fixture.nativeElement.querySelectorAll('textarea') as NodeListOf<HTMLTextAreaElement>;
    expect(fixture.nativeElement.querySelector('h1')?.textContent.trim()).toBe('Comments and notes');
    expect(fixture.nativeElement.querySelector('#commentsAndNotesInset')?.textContent.trim()).toBe(
      'These will be added to the respondent account only.',
    );
    expect(fixture.nativeElement.querySelector(`label[for="${FIELD_NAMES.comment}"]`)?.textContent.trim()).toBe(
      'Add comment',
    );
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.comment}-hint`)?.textContent.trim()).toBe(
      'For example, terms that affect the case, which will appear on the respondent account’s ‘At a glance’ view',
    );
    expect(fixture.nativeElement.querySelector(`label[for="${FIELD_NAMES.note}"]`)?.textContent.trim()).toBe(
      'Add account notes',
    );
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.note}-hint`)?.textContent.trim()).toBe(
      'You can view notes in the respondent account’s history after the case is published',
    );
    expect(textareas).toHaveLength(2);
    expect(textareas[0].getAttribute('maxlength')).toBe('250');
    expect(textareas[1].getAttribute('maxlength')).toBe('1000');
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.comment}-with-hint-info`)?.textContent.trim()).toBe(
      'You can enter up to 250 characters',
    );
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.note}-with-hint-info`)?.textContent.trim()).toBe(
      'You can enter up to 1000 characters',
    );
    expect(fixture.nativeElement.querySelector('.govuk-section-break--visible')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#returnToCaseDetails')?.textContent.trim()).toBe(
      'Return to case details',
    );
    expect(fixture.nativeElement.querySelector('#cancelCommentsAndNotes a')?.textContent.trim()).toBe('Cancel');
    expect(fixture.nativeElement.querySelector('.govuk-back-link')).toBeNull();
  });

  it('restores saved values without making the form dirty', () => {
    fixture.destroy();
    createComponent({
      [FIELD_NAMES.comment]: 'Saved comment',
      [FIELD_NAMES.note]: 'Saved account note',
    });

    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      [FIELD_NAMES.comment]: 'Saved comment',
      [FIELD_NAMES.note]: 'Saved account note',
    });
    expect(component.form.pristine).toBe(true);
  });

  it('submits both blank optional values', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    submit();

    expect(formSubmitSpy).toHaveBeenCalledWith({ formData: emptyFormData, nestedFlow: false });
  });

  it('accepts and emits values exactly at 250 and 1,000 characters', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    component.form.controls[FIELD_NAMES.comment].setValue('a'.repeat(250));
    component.form.controls[FIELD_NAMES.note].setValue('b'.repeat(1000));

    submit();

    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: {
        [FIELD_NAMES.comment]: 'a'.repeat(250),
        [FIELD_NAMES.note]: 'b'.repeat(1000),
      },
      nestedFlow: false,
    });
  });

  it('shows exact inline and summary errors, focuses the summary and retains over-limit values', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    component.form.controls[FIELD_NAMES.comment].setValue('a'.repeat(251));
    component.form.controls[FIELD_NAMES.note].setValue('b'.repeat(1001));

    submit();

    expect(component.formControlErrorMessages).toEqual({
      [FIELD_NAMES.comment]: 'Comment must be 250 characters or fewer',
      [FIELD_NAMES.note]: 'Account note must be 1,000 characters or fewer',
    });
    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: FIELD_NAMES.comment, message: 'Comment must be 250 characters or fewer' },
      { fieldId: FIELD_NAMES.note, message: 'Account note must be 1,000 characters or fewer' },
    ]);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.govuk-error-summary'));
    expect(component.form.getRawValue()).toEqual({
      [FIELD_NAMES.comment]: 'a'.repeat(251),
      [FIELD_NAMES.note]: 'b'.repeat(1001),
    });
    expect(formSubmitSpy).not.toHaveBeenCalled();
  });

  it('clears validation errors and submits valid values after an over-limit submission', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    component.form.controls[FIELD_NAMES.comment].setValue('a'.repeat(251));
    component.form.controls[FIELD_NAMES.note].setValue('b'.repeat(1001));

    submitFromRenderedForm();

    component.form.controls[FIELD_NAMES.comment].setValue('Valid comment');
    component.form.controls[FIELD_NAMES.note].setValue('Valid account note');
    submitFromRenderedForm();

    expect(component.formControlErrorMessages).toEqual({});
    expect(component.formErrorSummaryMessage).toEqual([]);
    expect(fixture.nativeElement.querySelectorAll('.govuk-error-message')).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.govuk-error-summary')).toBeNull();
    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: {
        [FIELD_NAMES.comment]: 'Valid comment',
        [FIELD_NAMES.note]: 'Valid account note',
      },
      nestedFlow: false,
    });
  });

  it.each([
    [FIELD_NAMES.comment, 'Comment must be 250 characters or fewer'],
    [FIELD_NAMES.note, 'Account note must be 1,000 characters or fewer'],
  ] as const)('moves focus from the %s summary link to its textarea', (fieldName, errorMessage) => {
    fixture.detectChanges();
    component.form.controls[fieldName].setValue(fieldName === FIELD_NAMES.comment ? 'a'.repeat(251) : 'b'.repeat(1001));
    submit();

    const errorLink = Array.from(
      fixture.nativeElement.querySelectorAll('.govuk-error-summary__list a') as NodeListOf<HTMLAnchorElement>,
    ).find((link) => link.textContent?.includes(errorMessage));
    errorLink?.click();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector(`#${fieldName}`));
  });

  it('emits dirty state from native textarea editing and emits Cancel from the rendered link', () => {
    const unsavedChangesSpy = vi.spyOn(component['unsavedChanges'], 'emit');
    const cancelSpy = vi.spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    const commentTextarea = fixture.nativeElement.querySelector(`#${FIELD_NAMES.comment}`) as HTMLTextAreaElement;
    commentTextarea.value = 'Edited comment';
    commentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(component.form.controls[FIELD_NAMES.comment].value).toBe('Edited comment');
    expect(unsavedChangesSpy).toHaveBeenCalledWith(true);
    (fixture.nativeElement.querySelector('#cancelCommentsAndNotes a') as HTMLAnchorElement).click();

    expect(cancelSpy).toHaveBeenCalledOnce();
  });
});
