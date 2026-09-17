import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CasesCreateCasefileOrderTermRawValue } from '../types/cases-create-casefile-order-term-raw-value.type';
import { CasesCreateCasefileOrderTermAutocompleteComponent } from './cases-create-casefile-order-term-autocomplete.component';

const fieldId = 'create_casefile_order_terms_input_choice';

@Component({
  imports: [CasesCreateCasefileOrderTermAutocompleteComponent],
  template: `@if (show) {
    <app-cases-create-casefile-order-term-autocomplete
      [inputId]="fieldId"
      [inputName]="fieldId"
      labelText="Choice"
      [control]="control"
      [options]="options"
      [hintText]="hint"
      [errors]="error"
      [selectionConfirmed]="confirmed"
      (optionSelected)="onSelected($event)"
    />
  }`,
})
class AutocompleteHostComponent {
  public readonly fieldId = fieldId;
  public readonly control = new FormControl<CasesCreateCasefileOrderTermRawValue>('Unmatched');
  @Input() public show = true;
  @Input() public hint = 'Choose an option';
  @Input() public error: string | null = null;
  @Input() public confirmed = false;
  public options = [
    { value: 'A', name: 'Same label' },
    { value: 'B', name: 'Same label' },
  ];
  public onSelected = vi.fn<(value: string) => void>();
}

describe('Order term autocomplete integration', () => {
  let fixture: ComponentFixture<AutocompleteHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AutocompleteHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(AutocompleteHostComponent);
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function input(): Promise<HTMLInputElement> {
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('input[role="combobox"]')).not.toBeNull());
    return fixture.nativeElement.querySelector('input[role="combobox"]');
  }

  it('restores raw text when its control is recreated', async () => {
    fixture.detectChanges();
    const original = await input();
    expect(original.value).toBe('Unmatched');
    fixture.componentRef.setInput('show', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('show', true);
    fixture.detectChanges();
    expect(await input()).not.toBe(original);
    expect((await input()).value).toBe('Unmatched');
    expect(fixture.componentInstance.onSelected).not.toHaveBeenCalled();
  });

  it('selects the correct ID when two options share a label', async () => {
    fixture.detectChanges();
    const element = await input();
    element.focus();
    element.value = 'Same';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.waitFor(() => expect(fixture.nativeElement.querySelectorAll('[role="option"]')).toHaveLength(2));
    fixture.nativeElement.querySelectorAll('[role="option"]')[1].click();
    expect(fixture.componentInstance.onSelected).toHaveBeenCalledExactlyOnceWith('B');
  });

  it('updates hint and error associations while preserving library assistance', async () => {
    fixture.detectChanges();
    const element = await input();
    const assistance = element.getAttribute('aria-describedby')!;
    expect(assistance).toContain(`${fieldId}-hint`);
    fixture.componentRef.setInput('error', 'Select a valid choice');
    fixture.detectChanges();
    expect(element.getAttribute('aria-describedby')).toContain(`${fieldId}-autocomplete-error-message`);
    fixture.componentRef.setInput('hint', '');
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    expect(element.getAttribute('aria-describedby')).not.toContain(`${fieldId}-hint`);
    expect(element.getAttribute('aria-describedby')).not.toContain(`${fieldId}-autocomplete-error-message`);
    expect(element.getAttribute('aria-describedby')).toContain(`${fieldId}-autocomplete__assistiveHint`);
  });

  it('reapplies error associations when the library rewrites aria-describedby', async () => {
    fixture.componentRef.setInput('error', 'Select a valid choice');
    fixture.detectChanges();
    const element = await input();
    element.setAttribute('aria-describedby', 'library-assistance');
    await vi.waitFor(() =>
      expect(element.getAttribute('aria-describedby')).toBe(
        `library-assistance ${fieldId}-hint ${fieldId}-autocomplete-error-message`,
      ),
    );
  });

  it('cancels the library input poll and disconnects its observer on destruction', async () => {
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    fixture.detectChanges();
    await input();
    const poll = schedule.mock.calls
      .map(([, delay], index) => (delay === 100 ? index : -1))
      .filter((index) => index >= 0)
      .at(-1)!;
    expect(poll).toBeGreaterThanOrEqual(0);
    const pollHandle = schedule.mock.results[poll].value;
    const container: HTMLElement = fixture.nativeElement.querySelector(`#${fieldId}-autocomplete-container`);
    const observerIndex = observe.mock.calls.findIndex(([element]) => element === container);
    expect(observerIndex).toBeGreaterThanOrEqual(0);
    const observer = observe.mock.contexts[observerIndex];
    fixture.destroy();
    expect(clear).toHaveBeenCalledWith(pollHandle);
    expect(disconnect.mock.contexts).toContain(observer);
    expect(container.childNodes.length).toBe(0);
  });

  it('does not initialise a widget after destruction while its import is pending', async () => {
    fixture.detectChanges();
    const container: HTMLElement = fixture.nativeElement.querySelector(`#${fieldId}-autocomplete-container`);
    fixture.destroy();
    await fixture.whenStable();
    expect(container.childNodes.length).toBe(0);
  });

  it('renders the server shell without invoking browser-only widget APIs', async () => {
    fixture.destroy();
    vi.stubGlobal('ngServerMode', true);
    vi.stubGlobal('MutationObserver', undefined);
    fixture = TestBed.createComponent(AutocompleteHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('label').textContent).toBe('Choice');
    expect(fixture.nativeElement.querySelector(`#${fieldId}`).type).toBe('hidden');
    expect(fixture.nativeElement.querySelector('input[role="combobox"]')).toBeNull();
  });
});
