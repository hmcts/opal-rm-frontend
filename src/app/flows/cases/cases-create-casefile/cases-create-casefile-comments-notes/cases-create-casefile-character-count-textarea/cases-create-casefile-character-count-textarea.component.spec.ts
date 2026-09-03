import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileCharacterCountTextareaComponent } from './cases-create-casefile-character-count-textarea.component';

describe('CasesCreateCasefileCharacterCountTextareaComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileCharacterCountTextareaComponent>;
  let component: CasesCreateCasefileCharacterCountTextareaComponent;
  let control: FormControl<string | null>;

  const render = (errors: string | null = null): HTMLTextAreaElement => {
    fixture = TestBed.createComponent(CasesCreateCasefileCharacterCountTextareaComponent);
    component = fixture.componentInstance;
    control = new FormControl<string | null>(null);
    component.labelText = 'Add comment';
    component.hintText = 'Helpful context';
    component.inputId = 'create_casefile_comments_notes_comment';
    component.inputName = 'create_casefile_comments_notes_comment';
    component.control = control;
    component.rows = 5;
    component.maxCharacterLimit = 250;
    component.errors = errors;
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCharacterCountTextareaComponent],
    }).compileComponents();
  });

  it('renders associated label, hint, limit description and no native maxlength', () => {
    const textarea = render();

    expect(fixture.nativeElement.querySelector('label')?.getAttribute('for')).toBe(textarea.id);
    expect(fixture.nativeElement.querySelector('label')?.textContent.trim()).toBe('Add comment');
    expect(fixture.nativeElement.querySelector(`#${textarea.id}-hint`)?.textContent.trim()).toBe('Helpful context');
    expect(fixture.nativeElement.querySelector(`#${textarea.id}-with-hint-info`)?.textContent.trim()).toBe(
      'You can enter up to 250 characters',
    );
    expect(textarea.getAttribute('aria-describedby')).toBe(`${textarea.id}-hint ${textarea.id}-with-hint-info`);
    expect(textarea.hasAttribute('maxlength')).toBe(false);
  });

  it.each([
    ['', 'You have 250 characters remaining'],
    ['a'.repeat(249), 'You have 1 character remaining'],
    ['a'.repeat(250), 'You have 0 characters remaining'],
    ['a'.repeat(251), 'You have -1 characters remaining'],
  ])('updates the visual and polite status for length %s', (value, expectedMessage) => {
    render();

    control.setValue(value);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.govuk-character-count__status')?.textContent.trim()).toBe(
      expectedMessage,
    );
    const screenReaderStatus = fixture.nativeElement.querySelector('.govuk-character-count__sr-status');
    expect(screenReaderStatus?.textContent.trim()).toBe(expectedMessage);
    expect(screenReaderStatus?.getAttribute('aria-live')).toBe('polite');
  });

  it('composes the error description and GOV.UK error classes', () => {
    const textarea = render('Comment must be 250 characters or fewer');

    expect(textarea.getAttribute('aria-describedby')).toBe(
      `${textarea.id}-hint ${textarea.id}-with-hint-info ${textarea.id}-error-message`,
    );
    expect(
      fixture.nativeElement.querySelector('.govuk-form-group')?.classList.contains('govuk-form-group--error'),
    ).toBe(true);
    expect(textarea.classList.contains('govuk-textarea--error')).toBe(true);
    expect(fixture.nativeElement.querySelector(`#${textarea.id}-error-message`)?.textContent).toContain(
      'Comment must be 250 characters or fewer',
    );
  });

  it('stops tracking the former control when a new control is assigned', () => {
    render();
    const firstControl = control;
    const secondControl = new FormControl<string | null>('b');

    component.control = secondControl;
    fixture.detectChanges();

    firstControl.setValue('a'.repeat(249));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.govuk-character-count__status')?.textContent.trim()).toBe(
      'You have 249 characters remaining',
    );

    secondControl.setValue('b'.repeat(2));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.govuk-character-count__status')?.textContent.trim()).toBe(
      'You have 248 characters remaining',
    );
  });

  it('updates the remaining count when the character limit changes after render', () => {
    render();

    control.setValue('a'.repeat(150));
    fixture.detectChanges();
    component.maxCharacterLimit = 100;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector(`#${component.inputId}-with-hint-info`)?.textContent.trim()).toBe(
      'You can enter up to 100 characters',
    );
    expect(fixture.nativeElement.querySelector('.govuk-character-count__status')?.textContent.trim()).toBe(
      'You have -50 characters remaining',
    );
  });
});
