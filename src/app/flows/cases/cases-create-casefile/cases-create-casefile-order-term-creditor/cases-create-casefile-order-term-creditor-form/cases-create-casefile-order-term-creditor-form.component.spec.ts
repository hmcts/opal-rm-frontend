import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { GovukSelectComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-select';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileMinorCreditor } from '../../interfaces/cases-create-casefile-minor-creditor.interface';
import type { ICasesCreateCasefileOrderTermCreditorFormData } from '../interfaces/cases-create-casefile-order-term-creditor-form-data.interface';
import { CasesCreateCasefileOrderTermCreditorFormComponent } from './cases-create-casefile-order-term-creditor-form.component';

const FIELD = {
  choice: 'create_casefile_order_term_creditor_choice',
  majorCreditorId: 'create_casefile_order_term_creditor_major_creditor_id',
} as const;
const major = {
  major_creditor_id: 901,
  business_unit_id: 44,
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
    majorCreditors = [major],
  ): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileOrderTermCreditorFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = initial;
    component.applicantLabel = 'Synthetic applicant (Applicant)';
    component.minorCreditors = minors;
    component.majorCreditors = majorCreditors;
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

  it('renders stable native radios in an application-owned GOV.UK fieldset', () => {
    create();
    fixture.detectChanges();
    const radios = Array.from(
      fixture.nativeElement.querySelectorAll(`input[name="${FIELD.choice}"]`),
    ) as HTMLInputElement[];

    expect(radios.map(({ id, value, type }) => ({ id, value, type }))).toEqual([
      { id: `${FIELD.choice}-applicant`, value: 'applicant', type: 'radio' },
      { id: `${FIELD.choice}-minor-1`, value: 'minor:1', type: 'radio' },
      { id: `${FIELD.choice}-minor-2`, value: 'minor:2', type: 'radio' },
      { id: `${FIELD.choice}-major`, value: 'major', type: 'radio' },
      { id: `${FIELD.choice}-add-new`, value: 'add-new', type: 'radio' },
    ]);
    expect(fixture.nativeElement.querySelector(`#${FIELD.choice}`).tagName).toBe('FIELDSET');
    expect(fixture.nativeElement.querySelector(`#${FIELD.choice}`).closest('[data-module="govuk-radios"]')).toBeNull();
  });

  it('keeps aria-controls without the invalid aria-expanded mutation and toggles the conditional class', () => {
    create();
    fixture.detectChanges();
    const radio = fixture.nativeElement.querySelector(`#${FIELD.choice}-major`) as HTMLInputElement;
    const conditional = fixture.nativeElement.querySelector(
      '#create_casefile_order_term_creditor_major',
    ) as HTMLElement;

    expect(radio.getAttribute('aria-controls')).toBe(conditional.id);
    expect(radio.hasAttribute('aria-expanded')).toBe(false);
    expect(conditional.classList).toContain('govuk-radios__conditional--hidden');

    component.form.controls[FIELD.choice].setValue('major');
    fixture.detectChanges();
    expect(conditional.classList).not.toContain('govuk-radios__conditional--hidden');
    expect(radio.hasAttribute('aria-expanded')).toBe(false);
  });

  it('shows and focuses the canonical choice error when blank', () => {
    create();
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    submit();

    expect(emitted).not.toHaveBeenCalled();
    expect(component.formErrorSummaryMessage).toEqual([{ fieldId: FIELD.choice, message: 'Select a creditor' }]);
    expect(fixture.nativeElement.querySelector(`#${FIELD.choice}`).getAttribute('aria-describedby')).toBe(
      `${FIELD.choice}-error-message`,
    );
    fixture.nativeElement.querySelector('.govuk-error-summary__list a').click();
    expect(document.activeElement?.id).toBe(`${FIELD.choice}-applicant`);
  });

  it.each([null, 999])('blocks a missing or stale Major selection', (majorCreditorId) => {
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: majorCreditorId });
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    submit();
    expect(emitted).not.toHaveBeenCalled();
    expect(component.formControlErrorMessages[FIELD.majorCreditorId]).toBe('Select a major creditor');
  });

  it('blocks Major when the resolved response is empty while other branches remain valid', () => {
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: 901 }, []);
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    submit();
    expect(emitted).not.toHaveBeenCalled();

    component.form.controls[FIELD.choice].setValue('applicant');
    submit();
    expect(emitted).toHaveBeenCalledWith({
      formData: { [FIELD.choice]: 'applicant', [FIELD.majorCreditorId]: null },
      nestedFlow: false,
    });
  });

  it.each(['applicant', 'add-new', 'minor:2'])('submits valid %s selection', (choice) => {
    create({ [FIELD.choice]: choice, [FIELD.majorCreditorId]: null });
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    submit();
    expect(emitted).toHaveBeenCalledWith({
      formData: { [FIELD.choice]: choice, [FIELD.majorCreditorId]: null },
      nestedFlow: false,
    });
  });

  it('renders resolved options in response order and normalizes a DOM value to the numeric ID', () => {
    const second = { ...major, major_creditor_id: 902, major_creditor_code: 'MC902', name: 'Second' };
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: null }, [second, major]);
    const emitted = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    const select = fixture.debugElement.query(By.directive(GovukSelectComponent))
      .componentInstance as GovukSelectComponent;
    expect(select.options).toEqual([
      { name: 'Select a major creditor', value: '' },
      { name: 'MC902 - Second', value: 902 },
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

  it('clears stale Major data on branch change', () => {
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: 901 });
    fixture.detectChanges();
    component.form.controls[FIELD.choice].setValue('applicant');
    expect(component.form.controls[FIELD.majorCreditorId].value).toBeNull();
  });

  it('normalizes numeric and string IDs when tracking unsaved changes', () => {
    create({ [FIELD.choice]: 'major', [FIELD.majorCreditorId]: 901 });
    const dirty = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();
    component.form.controls[FIELD.majorCreditorId].setValue('901');
    expect(dirty).toHaveBeenLastCalledWith(false);
    component.form.controls[FIELD.majorCreditorId].setValue('999');
    expect(dirty).toHaveBeenLastCalledWith(true);
  });

  it('rebases the normalized entry snapshot after an accepted parent update', () => {
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
});
