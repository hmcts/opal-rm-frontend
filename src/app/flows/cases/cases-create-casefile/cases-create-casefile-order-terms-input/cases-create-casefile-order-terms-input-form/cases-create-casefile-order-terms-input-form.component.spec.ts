import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AlphagovAccessibleAutocompleteComponent } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete';
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
  ) {
    fixture = TestBed.createComponent(FormHostComponent);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('initialValues', initialValues);
    fixture.componentRef.setInput('initialDirty', initialDirty);
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
    expect((await autocompleteInput()).value).toBe('');
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
    const autocomplete = fixture.debugElement.query(By.directive(AlphagovAccessibleAutocompleteComponent));
    expect(autocomplete).not.toBeNull();
    expect(autocomplete.componentInstance.getControl).toBe(component.form.controls[id('autocomplete')]);
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
    });
    expect(host.onUnsavedChanges).toHaveBeenLastCalledWith(true);
    input('amount', '10');
    expect(host.onDraftChange).toHaveBeenLastCalledWith({
      values: { amount: '10', expiry_date: '', arrears: '' },
      dirty: false,
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

  it('accepts a matching label on blur using the shared control and submits its ID', async () => {
    render(autocompletePage);
    const element = await typeAutocomplete('First option');
    element.dispatchEvent(new FocusEvent('blur'));
    await fixture.whenStable();
    expect(component.form.controls[id('autocomplete')].value).toBe('A');
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: { [id('autocomplete')]: 'A' },
      nestedFlow: false,
    });
  });

  it('clears an unknown label on blur and validates the required control', async () => {
    render(autocompletePage);
    const element = await typeAutocomplete('Unknown option');
    element.dispatchEvent(new FocusEvent('blur'));
    await fixture.whenStable();
    expect(component.form.controls[id('autocomplete')].value).toBeNull();
    submit();
    expect(host.onSubmit).not.toHaveBeenCalled();
    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: id('autocomplete'), message: 'Select test autocomplete' },
    ]);
  });

  it('restores the shared control from its stored option ID', async () => {
    render(autocompletePage, { autocomplete: 'A' }, true);
    expect((await autocompleteInput()).value).toBe('First option');
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: { [id('autocomplete')]: 'A' },
      nestedFlow: false,
    });
  });

  it('stores a clicked option ID and restores its label after remount', async () => {
    render(autocompletePage);
    await typeAutocomplete('First');
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('[role="option"]')).not.toBeNull());
    fixture.nativeElement.querySelector('[role="option"]').click();
    const draft = host.onDraftChange.mock.lastCall![0];
    expect(draft).toEqual({ values: { autocomplete: 'A' }, dirty: true });
    fixture.destroy();
    render(autocompletePage, draft.values, draft.dirty);
    expect((await autocompleteInput()).value).toBe('First option');
  });

  it('permits a cleared optional autocomplete after blur', async () => {
    render(
      { ...autocompletePage, fields: autocompletePage.fields.map((field) => ({ ...field, required: false })) },
      { autocomplete: 'A' },
    );
    const element = await typeAutocomplete('');
    element.dispatchEvent(new FocusEvent('blur'));
    await fixture.whenStable();
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: { [id('autocomplete')]: null },
      nestedFlow: false,
    });
  });

  it.each(['A & B', 'A "B"', "A O'Brien"])(
    'keeps the raw label "%s" through selection, remount and blur',
    async (label) => {
      const page = {
        ...autocompletePage,
        fields: autocompletePage.fields.map((field) => ({ ...field, options: [{ value: 'A', label }] })),
      };
      render(page);
      await typeAutocomplete('A');
      await vi.waitFor(() => expect(fixture.nativeElement.querySelector('[role="option"]')).not.toBeNull());
      const option: HTMLElement = fixture.nativeElement.querySelector('[role="option"]');
      expect(option.textContent).toBe(label);
      option.click();
      expect((await autocompleteInput()).value).toBe(label);
      const draft = host.onDraftChange.mock.lastCall![0];
      fixture.destroy();
      render(page, draft.values, draft.dirty);
      expect((await autocompleteInput()).value).toBe(label);
      const element = await typeAutocomplete(label);
      element.dispatchEvent(new FocusEvent('blur'));
      await fixture.whenStable();
      submit();
      expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
        formData: { [id('autocomplete')]: 'A' },
        nestedFlow: false,
      });
    },
  );

  it('renders an event-handler label as text and preserves it through selection and blur', async () => {
    const label = '<img src=x onerror="window.alert(1)">';
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    render({
      ...autocompletePage,
      fields: autocompletePage.fields.map((field) => ({ ...field, options: [{ value: 'A', label }] })),
    });

    await typeAutocomplete('img');
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('[role="option"]')).not.toBeNull());
    const option: HTMLElement = fixture.nativeElement.querySelector('[role="option"]');
    expect(option.querySelector('img, [onerror]')).toBeNull();
    expect(option.childElementCount).toBe(0);
    expect(option.textContent).toBe(label);
    expect(alert).not.toHaveBeenCalled();

    option.click();
    expect((await autocompleteInput()).value).toBe(label);
    expect(host.onDraftChange).toHaveBeenLastCalledWith({ values: { autocomplete: 'A' }, dirty: true });

    const element = await typeAutocomplete(label);
    element.dispatchEvent(new FocusEvent('blur'));
    await fixture.whenStable();
    expect(element.value).toBe(label);
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: { [id('autocomplete')]: 'A' },
      nestedFlow: false,
    });
    expect(fixture.nativeElement.querySelector('img, [onerror]')).toBeNull();
    expect(alert).not.toHaveBeenCalled();
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
    render(allControlsPage, values);
    await autocompleteInput();
    submit();
    expect(host.onSubmit).toHaveBeenCalledExactlyOnceWith({
      formData: Object.fromEntries(Object.entries(values).map(([name, value]) => [id(name), value])),
      nestedFlow: false,
    });
  });
});
