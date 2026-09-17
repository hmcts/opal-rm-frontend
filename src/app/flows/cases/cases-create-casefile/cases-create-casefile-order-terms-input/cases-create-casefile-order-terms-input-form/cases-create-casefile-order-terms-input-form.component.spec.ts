import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from '../../../services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';
import type { ICasesCreateCasefileOrderTermDraftChange } from '../interfaces/cases-create-casefile-order-term-draft-change.interface';
import type { CasesCreateCasefileOrderTermRawValue } from '../types/cases-create-casefile-order-term-raw-value.type';
import { mapOrderTermParameters } from '../utils/cases-create-casefile-order-term-metadata';
import { CasesCreateCasefileOrderTermsInputFormComponent } from './cases-create-casefile-order-terms-input-form.component';

const id = (name: string) => `create_casefile_order_terms_input_${name}`;
const matPage: ICasesCreateCasefileOrderTermPage = {
  resultId: 'MAT',
  title: 'Maintenance',
  fields: mapOrderTermParameters(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MAT'].result_parameters),
};
// Synthetic metadata stays local to this spec; production Results contain only delivered order terms.
const allControlsPage: ICasesCreateCasefileOrderTermPage = {
  resultId: 'TEST',
  title: 'All controls',
  fields: mapOrderTermParameters(
    JSON.stringify(
      ['money', 'integer', 'text', 'long_text', 'date', 'select', 'radio', 'autocomplete', 'checkbox'].map((kind) => ({
        name: kind,
        prompt: `Test ${kind}`,
        type: kind,
        mandatory: true,
        language_dependent: false,
        hint: '<b>Plain hint</b>',
        ...(['select', 'radio', 'autocomplete'].includes(kind)
          ? {
              options: [
                { value: 'A', label: 'First option' },
                { value: 'B', label: 'Second option' },
              ],
            }
          : {}),
      })),
    ),
  ),
};
const autocompletePage: ICasesCreateCasefileOrderTermPage = {
  ...allControlsPage,
  fields: allControlsPage.fields.filter((field) => field.kind === 'autocomplete'),
};

@Component({
  imports: [CasesCreateCasefileOrderTermsInputFormComponent],
  template: `<app-cases-create-casefile-order-terms-input-form
    [page]="page"
    [initialValues]="initialValues"
    [initialDirty]="initialDirty"
    [initialConfirmedAutocomplete]="initialConfirmedAutocomplete"
    [frequency]="frequency"
    (formSubmit)="onSubmit($event)"
    (draftChange)="onDraftChange($event)"
    (unsavedChanges)="onUnsavedChanges($event)"
    (cancel)="onCancel()"
  />`,
})
class FormHostComponent {
  @Input() public page = matPage;
  @Input() public initialValues: Record<string, CasesCreateCasefileOrderTermRawValue> = {};
  @Input() public initialDirty = false;
  @Input() public initialConfirmedAutocomplete: Record<string, boolean> = {};
  @Input() public frequency = 'Weekly';
  public onSubmit =
    vi.fn<(value: { formData: Record<string, CasesCreateCasefileOrderTermRawValue>; nestedFlow: boolean }) => void>();
  public onDraftChange = vi.fn<(value: ICasesCreateCasefileOrderTermDraftChange) => void>();
  public onUnsavedChanges = vi.fn<(dirty: boolean) => void>();
  public onCancel = vi.fn();
}

describe('Order terms input form', () => {
  let fixture: ComponentFixture<FormHostComponent>;
  let host: FormHostComponent;
  let component: CasesCreateCasefileOrderTermsInputFormComponent;

  afterEach(() => vi.restoreAllMocks());

  beforeEach(async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [FormHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function render(
    page = matPage,
    initialValues: Record<string, CasesCreateCasefileOrderTermRawValue> = {},
    initialDirty = false,
    initialConfirmedAutocomplete: Record<string, boolean> = {},
  ) {
    fixture = TestBed.createComponent(FormHostComponent);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('initialValues', initialValues);
    fixture.componentRef.setInput('initialDirty', initialDirty);
    fixture.componentRef.setInput('initialConfirmedAutocomplete', initialConfirmedAutocomplete);
    fixture.componentRef.setInput('frequency', 'Weekly');
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.query(
      By.directive(CasesCreateCasefileOrderTermsInputFormComponent),
    ).componentInstance;
  }

  function submit() {
    const event = new Event('submit', { bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('form').dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
  }

  function input(name: string, value: string) {
    const element: HTMLInputElement = fixture.nativeElement.querySelector(`#${id(name)}`);
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function autocompleteInput() {
    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelector(`#${id('autocomplete')}-autocomplete`)).not.toBeNull(),
    );
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      `#${id('autocomplete')}-autocomplete`,
    )!;
  }

  async function typeAutocomplete(value: string) {
    const element = await autocompleteInput();
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    return element;
  }

  it('initialises valid parameter names that overlap Object.prototype as empty controls', () => {
    const page = {
      ...allControlsPage,
      fields: allControlsPage.fields
        .filter((field) => field.kind === 'text')
        .map((field) => ({ ...field, name: 'constructor', id: id('constructor'), label: 'Reference' })),
    };
    render(page);
    expect(component.form.controls[id('constructor')].value).toBe('');
    submit();
    expect(component.formErrorSummaryMessage).toEqual([{ fieldId: id('constructor'), message: 'Enter reference' }]);
  });

  it('accepts restored whitespace in an optional autocomplete as blank', async () => {
    const page = {
      ...autocompletePage,
      fields: autocompletePage.fields.map((field) => ({ ...field, required: false })),
    };
    render(page, { autocomplete: '   ' });
    expect((await autocompleteInput()).value).toBe('   ');
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: { [id('autocomplete')]: '   ' },
      nestedFlow: false,
    });
  });

  it('renders only metadata fields in order with read-only frequency', () => {
    render();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Maintenance');
    expect(Object.keys(component.form.controls)).toEqual([id('amount'), id('expiry_date'), id('arrears')]);
    expect(fixture.nativeElement.querySelector(`#${id('frequency')} dd`).textContent).toBe('Weekly');
    expect(component.form.contains(id('frequency'))).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(3);
    expect(host.onDraftChange).not.toHaveBeenCalled();
    expect(host.onUnsavedChanges).not.toHaveBeenCalled();
  });

  it('retains invalid raw values and orders summary errors by metadata', () => {
    render(matPage, { amount: 'abc', expiry_date: '31/02/2027', arrears: '12.30' });
    submit();
    expect(host.onSubmit).not.toHaveBeenCalled();
    expect(component.form.getRawValue()).toEqual({
      [id('amount')]: 'abc',
      [id('expiry_date')]: '31/02/2027',
      [id('arrears')]: '12.30',
    });
    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: id('amount'), message: 'Enter numbers only' },
      { fieldId: id('expiry_date'), message: 'Enter a valid expiry date' },
    ]);
    expect(fixture.nativeElement.querySelector(`#${id('amount')}`).getAttribute('aria-describedby')).toContain(
      `${id('amount')}-error-message`,
    );
  });

  it('emits canonical keys and permits optional blanks without validating frequency', () => {
    render(matPage, { amount: '12.30' });
    fixture.componentRef.setInput('frequency', '');
    fixture.detectChanges();
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: { [id('amount')]: '12.30', [id('expiry_date')]: '', [id('arrears')]: '' },
      nestedFlow: false,
    });
    expect(host.onUnsavedChanges).toHaveBeenLastCalledWith(false);
  });

  it('updates read-only frequency from the latest input', () => {
    render();
    fixture.componentRef.setInput('frequency', 'Monthly');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(`#${id('frequency')} dd`).textContent).toBe('Monthly');
    expect(host.onDraftChange).not.toHaveBeenCalled();
  });

  it('renders all shared control kinds with safe hints and distinct group identifiers', async () => {
    render(allControlsPage);
    await autocompleteInput();
    expect(fixture.nativeElement.querySelector(`#${id('long_text')}`).tagName).toBe('TEXTAREA');
    expect(fixture.nativeElement.querySelector(`#${id('select')}`).tagName).toBe('SELECT');
    expect(fixture.nativeElement.querySelector(`#${id('checkbox')}`).type).toBe('checkbox');
    expect(fixture.nativeElement.querySelector(`#${id('radio')}`).tagName).toBe('FIELDSET');
    expect(fixture.nativeElement.querySelector(`#${id('radio')}-option-0`).type).toBe('radio');
    expect(fixture.nativeElement.querySelector(`#${id('checkbox')}-fieldset`).tagName).toBe('FIELDSET');
    expect(
      [...fixture.nativeElement.querySelectorAll('.govuk-hint')].filter((element) =>
        element.textContent.includes('<b>Plain hint</b>'),
      ),
    ).toHaveLength(9);
    expect(fixture.nativeElement.querySelector('.govuk-hint b')).toBeNull();
    expect(fixture.nativeElement.querySelector('.govuk-form-group .govuk-form-group')).toBeNull();
    const ids = [...fixture.nativeElement.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    submit();
    expect(component.formErrorSummaryMessage.map((error) => error.fieldId)).toEqual(
      allControlsPage.fields.map((field) => field.id),
    );
    for (const name of ['money', 'integer', 'text', 'long_text', 'date', 'select']) {
      expect(fixture.nativeElement.querySelector(`#${id(name)}`).getAttribute('aria-describedby')).toBe(
        `${id(name)}-hint ${id(name)}-error-message`,
      );
    }
    for (const group of [id('radio'), `${id('checkbox')}-fieldset`]) {
      expect(fixture.nativeElement.querySelector(`#${group}`).getAttribute('aria-describedby')).toBe(
        `${group}-hint ${group}-error-message`,
      );
    }
    expect((await autocompleteInput()).getAttribute('aria-describedby')).toContain(
      `${id('autocomplete')}-autocomplete-error-message`,
    );
  });

  it('emits parameter names and returns to clean when a new edit is reverted', () => {
    render(matPage, { amount: '10' });
    input('amount', '20');
    expect(host.onDraftChange).toHaveBeenLastCalledWith({
      values: { amount: '20', expiry_date: '', arrears: '' },
      dirty: true,
      confirmedAutocomplete: {},
    });
    expect(host.onUnsavedChanges).toHaveBeenLastCalledWith(true);
    input('amount', '10');
    expect(host.onDraftChange).toHaveBeenLastCalledWith({
      values: { amount: '10', expiry_date: '', arrears: '' },
      dirty: false,
      confirmedAutocomplete: {},
    });
    expect(host.onUnsavedChanges).toHaveBeenLastCalledWith(false);
  });

  it('preserves restored dirty state after reverting a further edit', () => {
    render(matPage, { amount: '10' }, true);
    expect(host.onUnsavedChanges).not.toHaveBeenCalled();
    input('amount', '20');
    input('amount', '10');
    expect(host.onDraftChange.mock.lastCall?.[0].dirty).toBe(true);
    expect(host.onUnsavedChanges).toHaveBeenLastCalledWith(true);
  });

  it('protects further edits after a valid submission leaves the form mounted', () => {
    render(matPage, { amount: '10' });
    submit();
    input('amount', '20');
    expect(host.onDraftChange.mock.lastCall?.[0].dirty).toBe(true);
    expect(host.onUnsavedChanges).toHaveBeenLastCalledWith(true);
  });

  it('emits cancel through the shared cancel link', () => {
    render();
    fixture.nativeElement.querySelector('#create_casefile_order_terms_input_cancel a').click();
    expect(host.onCancel).toHaveBeenCalledExactlyOnceWith();
  });

  it('stops draft and unsaved emissions when destroyed', () => {
    render();
    const control = component.form.controls[id('amount')];
    fixture.destroy();
    control.setValue('20');
    expect(host.onDraftChange).not.toHaveBeenCalled();
    expect(host.onUnsavedChanges).not.toHaveBeenCalled();
  });

  it('retains unknown autocomplete text across blur, invalid submit and remount', async () => {
    render(autocompletePage);
    const beforeBlur = await typeAutocomplete('Not an option');
    beforeBlur.dispatchEvent(new FocusEvent('blur'));
    await fixture.whenStable();
    expect((await autocompleteInput()).value).toBe('Not an option');
    expect(component.form.controls[id('autocomplete')].value).toBe('Not an option');
    submit();
    expect(host.onSubmit).not.toHaveBeenCalled();
    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: id('autocomplete'), message: 'Select a valid test autocomplete' },
    ]);
    const draft = host.onDraftChange.mock.lastCall![0];
    expect(draft).toEqual({
      values: { autocomplete: 'Not an option' },
      dirty: true,
      confirmedAutocomplete: { autocomplete: false },
    });
    fixture.destroy();
    render(autocompletePage, draft.values, draft.dirty, draft.confirmedAutocomplete);
    expect((await autocompleteInput()).value).toBe('Not an option');
    submit();
    expect(host.onSubmit).not.toHaveBeenCalled();
  });

  it('does not accept a typed option ID as a confirmed selection after remount', async () => {
    render(autocompletePage);
    await typeAutocomplete('A');
    const draft = host.onDraftChange.mock.lastCall![0];
    submit();
    expect(host.onSubmit).not.toHaveBeenCalled();
    fixture.destroy();
    render(autocompletePage, draft.values, draft.dirty, draft.confirmedAutocomplete);
    expect((await autocompleteInput()).value).toBe('A');
    submit();
    expect(host.onSubmit).not.toHaveBeenCalled();
  });

  it('restores an explicitly confirmed option as its label and submits its ID', async () => {
    render(autocompletePage, { autocomplete: 'A' }, true, { autocomplete: true });
    expect((await autocompleteInput()).value).toBe('First option');
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: { [id('autocomplete')]: 'A' },
      nestedFlow: false,
    });
  });

  it('renders autocomplete suggestion labels literally without interpreting metadata as HTML', async () => {
    const label = '<b data-untrusted>First</b> & second';
    const page = {
      ...autocompletePage,
      fields: autocompletePage.fields.map((field) => ({ ...field, options: [{ value: 'A', label }] })),
    };
    render(page);
    await typeAutocomplete('First');
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('[role="option"]')).not.toBeNull());
    const option = fixture.nativeElement.querySelector('[role="option"]');
    expect(option.querySelector('[data-untrusted]')).toBeNull();
    expect(option.textContent).toBe(label);
    option.click();
    expect((await autocompleteInput()).value).toBe(label);
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: { [id('autocomplete')]: 'A' },
      nestedFlow: false,
    });
  });

  it('submits every supported editable kind with raw primitive values', async () => {
    const values = {
      money: '12.30',
      integer: '3',
      text: 'Name',
      long_text: 'Long text',
      date: '01/01/2027',
      select: 'A',
      radio: 'B',
      autocomplete: 'A',
      checkbox: true,
    };
    render(allControlsPage, values, false, { autocomplete: true });
    await autocompleteInput();
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: Object.fromEntries(Object.entries(values).map(([name, value]) => [id(name), value])),
      nestedFlow: false,
    });
  });

  it('records a clicked suggestion as confirmed and preserves it after remount', async () => {
    render(autocompletePage);
    await typeAutocomplete('First');
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('[role="option"]')).not.toBeNull());
    fixture.nativeElement.querySelector('[role="option"]').click();
    expect(component.form.controls[id('autocomplete')].value).toBe('A');
    const draft = host.onDraftChange.mock.lastCall![0];
    expect(draft.confirmedAutocomplete).toEqual({ autocomplete: true });
    fixture.destroy();
    render(autocompletePage, draft.values, draft.dirty, draft.confirmedAutocomplete);
    expect((await autocompleteInput()).value).toBe('First option');
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: { [id('autocomplete')]: 'A' },
      nestedFlow: false,
    });
  });

  it('rejects a typed option label after blur without converting its draft text to an ID', async () => {
    render(autocompletePage);
    const element = await typeAutocomplete('First option');
    element.blur();
    await fixture.whenStable();
    expect(component.form.controls[id('autocomplete')].value).toBe('First option');
    expect(host.onDraftChange.mock.lastCall?.[0].confirmedAutocomplete).toEqual({ autocomplete: false });
    submit();
    expect(host.onSubmit).not.toHaveBeenCalled();
  });

  it('permits a cleared optional autocomplete after blur', async () => {
    const optionalPage = {
      ...autocompletePage,
      fields: autocompletePage.fields.map((field) => ({ ...field, required: false })),
    };
    render(optionalPage, { autocomplete: 'A' }, false, { autocomplete: true });
    const element = await typeAutocomplete('');
    element.blur();
    await fixture.whenStable();
    submit();
    expect(host.onSubmit).toHaveBeenCalledTimes(1);
    expect(component.form.controls[id('autocomplete')].value).toBe('');
  });

  it('emits a dirty draft when confirmation changes but the raw ID stays identical', async () => {
    render(autocompletePage, { autocomplete: 'A' });
    const element = await autocompleteInput();
    element.focus();
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('[role="option"]')).not.toBeNull());
    // Restore the typed ID in the form without selecting a suggestion.
    component.form.controls[id('autocomplete')].setValue('A');
    host.onDraftChange.mockClear();
    fixture.nativeElement.querySelector('[role="option"]').click();
    expect(host.onDraftChange).toHaveBeenLastCalledWith({
      values: { autocomplete: 'A' },
      dirty: true,
      confirmedAutocomplete: { autocomplete: true },
    });
    expect(host.onUnsavedChanges).toHaveBeenLastCalledWith(true);
  });

  it('returns to clean when raw text and confirmation revert to the initial selection', async () => {
    render(autocompletePage, { autocomplete: 'A' }, false, { autocomplete: true });
    await typeAutocomplete('First');
    expect(host.onDraftChange.mock.lastCall?.[0].dirty).toBe(true);
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('[role="option"]')).not.toBeNull());
    fixture.nativeElement.querySelector('[role="option"]').click();
    expect(host.onDraftChange).toHaveBeenLastCalledWith({
      values: { autocomplete: 'A' },
      dirty: false,
      confirmedAutocomplete: { autocomplete: true },
    });
    expect(host.onUnsavedChanges).toHaveBeenLastCalledWith(false);
  });

  it('clears autocomplete confirmation when the user edits a restored selection', async () => {
    render(autocompletePage, { autocomplete: 'A' }, true, { autocomplete: true });
    await typeAutocomplete('First option');
    submit();
    expect(host.onSubmit).not.toHaveBeenCalled();
    expect(host.onDraftChange.mock.lastCall?.[0].confirmedAutocomplete).toEqual({ autocomplete: false });
  });
});
