import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { GovukSelectComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-select';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileMinorCreditor } from '../../interfaces/cases-create-casefile-minor-creditor.interface';
import type { ICasesCreateCasefileMajorCreditorsLoadState } from '../interfaces/cases-create-casefile-major-creditors-load-state.interface';
import type { ICasesCreateCasefileOrderTermCreditorFormData } from '../interfaces/cases-create-casefile-order-term-creditor-form-data.interface';
import { CasesCreateCasefileOrderTermCreditorFormComponent } from './cases-create-casefile-order-term-creditor-form.component';

const FIELD = {
  choice: 'create_casefile_order_term_creditor_choice',
  majorCreditorId: 'create_casefile_order_term_creditor_major_creditor_id',
} as const;
const major = {
  major_creditor_id: 901,
  business_unit_id: 77,
  major_creditor_code: 'MC901',
  name: 'Synthetic major creditor',
  address_line_1: '1 Test Street',
  address_line_2: null,
  address_line_3: null,
  address_line_4: null,
  address_line_5: null,
  postcode: null,
  country_id: null,
  country_name: null,
  contact_name: null,
  contact_email: null,
  active: true,
  central_authority: false,
};
const states = {
  loading: { status: 'loading', records: [], correlationReference: null },
  empty: { status: 'empty', records: [], correlationReference: null },
  error: { status: 'error', records: [], correlationReference: 'SYNTHETIC-REF' },
  ready: { status: 'ready', records: [major], correlationReference: null },
} satisfies Record<string, ICasesCreateCasefileMajorCreditorsLoadState>;
const minors: ICasesCreateCasefileMinorCreditor[] = [
  { sequenceNumber: 1, displayName: 'Duplicate name' },
  { sequenceNumber: 2, displayName: 'Duplicate name' },
];

describe('CasesCreateCasefileOrderTermCreditorFormComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileOrderTermCreditorFormComponent>;
  let component: CasesCreateCasefileOrderTermCreditorFormComponent;

  const create = (
    initial: ICasesCreateCasefileOrderTermCreditorFormData = {
      [FIELD.choice]: null,
      [FIELD.majorCreditorId]: null,
    },
    loadState: ICasesCreateCasefileMajorCreditorsLoadState = states.ready,
  ): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileOrderTermCreditorFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = initial;
    component.applicantLabel = 'Synthetic applicant (Applicant)';
    component.minorCreditors = minors;
    component.loadState = loadState;
  };

  const submit = (): void => {
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileOrderTermCreditorFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('renders exact radio labels, stable values, actions and the installed conditional relationship', () => {
    create();
    fixture.detectChanges();
    const radios = Array.from(
      fixture.nativeElement.querySelectorAll(`input[name="${FIELD.choice}"]`),
    ) as HTMLInputElement[];

    expect(radios.map(({ id, value }) => ({ id, value }))).toEqual([
      { id: `${FIELD.choice}-applicant`, value: 'applicant' },
      { id: `${FIELD.choice}-minor-1`, value: 'minor:1' },
      { id: `${FIELD.choice}-minor-2`, value: 'minor:2' },
      { id: `${FIELD.choice}-major`, value: 'major' },
      { id: `${FIELD.choice}-add-new`, value: 'add-new' },
    ]);
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>).map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual([
      'Synthetic applicant (Applicant)',
      'Duplicate name (Minor creditor)',
      'Duplicate name (Minor creditor)',
      'Major creditor',
      'Add a new minor creditor',
    ]);
    const majorRadio = fixture.nativeElement.querySelector(`#${FIELD.choice}-major`) as HTMLInputElement;
    expect(majorRadio.getAttribute('aria-controls')).toBe('create_casefile_order_term_creditor_major');
    expect(fixture.nativeElement.querySelector('#create_casefile_order_term_creditor_major')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#create_casefile_order_term_creditor_continue').disabled).toBe(false);
    expect(
      fixture.nativeElement.querySelector('#create_casefile_order_term_creditor_cancel a').textContent.trim(),
    ).toBe('Cancel');
  });

  it('shows and focuses the canonical choice error when blank', () => {
    create();
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    submit();

    expect(emitted).not.toHaveBeenCalled();
    expect(component.formErrorSummaryMessage).toEqual([{ fieldId: FIELD.choice, message: 'Select a creditor' }]);
    fixture.nativeElement.querySelector('.govuk-error-summary__list a').click();
    expect(document.activeElement?.id).toBe(`${FIELD.choice}-applicant`);
  });

  it('rejects a choice that is not one of the rendered radio values', () => {
    create({ [FIELD.choice]: 'minor:99', [FIELD.majorCreditorId]: null });
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    submit();

    expect(emitted).not.toHaveBeenCalled();
    expect(component.formControlErrorMessages[FIELD.choice]).toBe('Select a creditor');
  });

  it.each(['loading', 'empty', 'error'] as const)(
    'blocks Major during %s and links its error to the focusable status wrapper',
    (status) => {
      create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: null }, states[status]);
      const emitted = vi.spyOn(component['formSubmit'], 'emit');
      fixture.detectChanges();
      submit();

      expect(emitted).not.toHaveBeenCalled();
      expect(component.formErrorSummaryMessage).toContainEqual({
        fieldId: FIELD.majorCreditorId,
        message: 'Select a major creditor',
      });
      const wrapper = fixture.nativeElement.querySelector(`#${FIELD.majorCreditorId}`) as HTMLElement;
      expect(wrapper.tabIndex).toBe(-1);
      const summaryLink = Array.from(
        fixture.nativeElement.querySelectorAll('.govuk-error-summary__list a') as NodeListOf<HTMLAnchorElement>,
      ).find((link) => link.textContent?.trim() === 'Select a major creditor');
      summaryLink?.click();
      expect(document.activeElement).toBe(wrapper);
    },
  );

  it.each([
    [{ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: null }, states.ready],
    [{ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: 999 }, states.ready],
  ] as const)('blocks a missing or stale Major selection', (initial, state) => {
    create(initial, state);
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    submit();
    expect(emitted).not.toHaveBeenCalled();
    expect(component.formControlErrorMessages[FIELD.majorCreditorId]).toBe('Select a major creditor');
  });

  it('rejects arbitrary selector values and a disabled Major control', () => {
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: 901 });
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    component.form.controls[FIELD.majorCreditorId].setValue('902');
    submit();
    expect(emitted).not.toHaveBeenCalled();
    component.form.controls[FIELD.majorCreditorId].setValue(901);
    component.form.controls[FIELD.majorCreditorId].disable();
    submit();
    expect(emitted).not.toHaveBeenCalled();
  });

  it.each([
    ['applicant', states.loading],
    ['add-new', states.error],
    ['minor:2', states.empty],
  ] as const)('submits valid %s selection independently of Major load state', (choice, loadState) => {
    create({ [FIELD.choice]: choice, [FIELD.majorCreditorId]: null }, loadState);
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    submit();
    expect(emitted).toHaveBeenCalledWith({
      formData: { [FIELD.choice]: choice, [FIELD.majorCreditorId]: null },
      nestedFlow: false,
    });
  });

  it('renders ready options in response order and normalizes a selected DOM value to the returned numeric ID', () => {
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: null });
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    const select = fixture.debugElement.query(By.directive(GovukSelectComponent))
      .componentInstance as GovukSelectComponent;
    expect(select.options).toEqual([
      { name: 'Select a major creditor', value: '' },
      { name: 'MC901 - Synthetic major creditor', value: 901 },
    ]);
    const native = fixture.nativeElement.querySelector(`#${FIELD.majorCreditorId}`) as HTMLSelectElement;
    native.value = '901';
    native.dispatchEvent(new Event('change', { bubbles: true }));
    submit();
    expect(component.form.controls[FIELD.majorCreditorId].value).toBe(901);
    expect(emitted).toHaveBeenCalledWith({
      formData: { [FIELD.choice]: 'major', [FIELD.majorCreditorId]: 901 },
      nestedFlow: false,
    });
  });

  it('clears Major data on branch change, preserves the branch on load change and exposes status/retry content', () => {
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: 901 });
    fixture.detectChanges();
    component.form.controls[FIELD.choice].setValue('applicant');
    expect(component.form.controls[FIELD.majorCreditorId].value).toBeNull();

    component.form.controls[FIELD.choice].setValue('major');
    fixture.componentRef.setInput('loadState', states.error);
    fixture.detectChanges();
    expect(component.form.controls[FIELD.choice].value).toBe('major');
    expect(fixture.nativeElement.textContent).toContain('SYNTHETIC-REF');
    expect(fixture.nativeElement.querySelector('#create_casefile_order_term_creditor_retry')).not.toBeNull();
  });

  it('reports normalized changes relative to the entry snapshot', () => {
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: 901 });
    const dirty = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();
    component.form.controls[FIELD.majorCreditorId].setValue('901');
    expect(dirty).toHaveBeenLastCalledWith(false);
    component.form.controls[FIELD.majorCreditorId].setValue('999');
    expect(dirty).toHaveBeenLastCalledWith(true);
  });

  it('rebases the normalized entry snapshot after an accepted parent update and detects later edits', () => {
    create({ [FIELD.choice]: 'applicant', [FIELD.majorCreditorId]: null });
    const dirty = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();
    submit();

    fixture.componentRef.setInput('initialFormData', {
      [FIELD.choice]: 'applicant',
      [FIELD.majorCreditorId]: null,
    });
    fixture.detectChanges();
    expect(dirty).toHaveBeenLastCalledWith(false);

    component.form.controls[FIELD.choice].setValue('add-new');
    expect(dirty).toHaveBeenLastCalledWith(true);
  });

  it('keeps later edits observable when a parent rejects a valid submission without rebasing', () => {
    create({ [FIELD.choice]: 'applicant', [FIELD.majorCreditorId]: null });
    const dirty = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();
    submit();

    component.form.controls[FIELD.choice].setValue('add-new');
    expect(dirty).toHaveBeenLastCalledWith(true);
  });

  it('emits retry for empty/error and keeps retry available while the follow-up load is pending', () => {
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: null }, states.error);
    const retry = vi.spyOn(component.retry, 'emit');
    fixture.detectChanges();
    component.handleRetry();
    fixture.componentRef.setInput('loadState', states.loading);
    fixture.detectChanges();

    expect(retry).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('#create_casefile_order_term_creditor_retry').disabled).toBe(false);

    fixture.componentRef.setInput('loadState', states.ready);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#create_casefile_order_term_creditor_retry')).toBeNull();
  });
});
