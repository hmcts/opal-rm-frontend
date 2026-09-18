import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileOrderTermsLoadState } from '../interfaces/cases-create-casefile-order-terms-load-state.interface';
import { CasesCreateCasefileOrderTermsSelectFormComponent } from './cases-create-casefile-order-terms-select-form.component';

const field = 'create_casefile_order_terms_select_result_id';
const ready: ICasesCreateCasefileOrderTermsLoadState = {
  status: 'ready',
  correlationReference: null,
  records: [{ result_id: 'MOCK01', result_title: 'Example maintenance term' }],
};

describe('Order term selection form', () => {
  let fixture: ComponentFixture<CasesCreateCasefileOrderTermsSelectFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileOrderTermsSelectFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function render(state = ready, saved: string | null = null) {
    fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsSelectFormComponent);
    fixture.componentRef.setInput('initialFormData', { [field]: saved });
    fixture.componentRef.setInput('loadState', state);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('offers an empty choice and ordered code/title labels', () => {
    render();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('');
    expect(Array.from(select.options).map((option) => [option.value, option.text])).toEqual([
      ['', 'Select an order'],
      ['MOCK01', 'MOCK01 - Example maintenance term'],
    ]);
    expect(fixture.nativeElement.querySelector('button[type=submit]').disabled).toBe(false);
  });

  it.each(['loading', 'empty', 'error'] as const)('disables selection and Continue during %s', (status) => {
    render({ ...ready, status });
    expect(fixture.nativeElement.querySelector('select').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('button[type=submit]').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('#create_casefile_order_terms_cancel a')).not.toBeNull();
  });

  it('shows exact required errors and remains on the form', () => {
    const component = render();
    component.handleFormSubmit(new Event('submit', { cancelable: true }) as SubmitEvent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.govuk-error-summary').textContent).toContain('There is a problem');
    expect(fixture.nativeElement.querySelector('.govuk-error-summary a').textContent.trim()).toBe('Select an order');
    expect(fixture.nativeElement.querySelector(`#${field}-error-message`).textContent).toContain('Select an order');
  });

  it('retains the choice and labels on failure, then clears a removed choice on success', () => {
    const component = render(ready, 'MOCK01');
    fixture.componentRef.setInput('loadState', { ...ready, status: 'error' });
    fixture.detectChanges();
    expect(component.form.controls[field].value).toBe('MOCK01');
    expect(fixture.nativeElement.querySelector('select').textContent).toContain('MOCK01 - Example maintenance term');
    fixture.componentRef.setInput('loadState', { status: 'empty', records: [], correlationReference: null });
    fixture.detectChanges();
    expect(component.form.controls[field].value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('There are currently no order terms.');
  });

  it('rejects a value absent from the loaded list', () => {
    const component = render();
    component.form.controls[field].setValue('OTHER');
    component.handleFormSubmit(new Event('submit', { cancelable: true }) as SubmitEvent);
    fixture.detectChanges();
    expect(component.form.invalid).toBe(true);
    expect(fixture.nativeElement.querySelector('.govuk-error-summary').textContent).toContain('Select an order');
  });

  it('emits Retry only while the failed load can be retried', () => {
    const component = render({ ...ready, status: 'error' });
    const retry = vi.fn();
    component.retry.subscribe(retry);
    component.handleRetry();
    expect(retry).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('loadState', { ...ready, status: 'loading' });
    fixture.detectChanges();
    component.handleRetry();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('ignores form submission while reference data is unavailable', () => {
    const component = render({ ...ready, status: 'loading' });
    const submit = vi.fn();
    (component as unknown as { formSubmit: { subscribe: (listener: () => void) => unknown } }).formSubmit.subscribe(
      submit,
    );
    component.handleFormSubmit(new Event('submit', { cancelable: true }) as SubmitEvent);
    expect(submit).not.toHaveBeenCalled();
  });

  it('refreshes a displayed validation error after a load-state change', () => {
    const component = render();
    component.handleFormSubmit(new Event('submit', { cancelable: true }) as SubmitEvent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.govuk-error-summary')).not.toBeNull();

    fixture.componentRef.setInput('loadState', { ...ready, status: 'error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.govuk-error-summary')).toBeNull();
  });
});
