import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileAddressTextFieldsComponent } from './cases-create-casefile-address-text-fields.component';

describe('CasesCreateCasefileAddressTextFieldsComponent', () => {
  const fieldNames = {
    addressLine1: 'party_address_line_1',
    addressLine2: 'party_address_line_2',
    addressLine3: 'party_address_line_3',
    addressLine4: 'party_address_line_4',
    addressLine5: 'party_address_line_5',
    postalOrZipCode: 'party_postal_or_zip_code',
  } as const;
  const errors = Object.fromEntries(Object.values(fieldNames).map((fieldName) => [fieldName, `${fieldName} error`]));

  let fixture: ComponentFixture<CasesCreateCasefileAddressTextFieldsComponent>;
  let component: CasesCreateCasefileAddressTextFieldsComponent;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileAddressTextFieldsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    form = new FormGroup(
      Object.fromEntries(Object.values(fieldNames).map((fieldName) => [fieldName, new FormControl(null)])),
    );
    fixture = TestBed.createComponent(CasesCreateCasefileAddressTextFieldsComponent);
    component = fixture.componentInstance;
    component.form = form;
    component.formControlErrorMessages = errors;
    component.fieldNames = fieldNames;
  });

  it('renders the six address text fields in the supplied order with their original identifiers', () => {
    fixture.detectChanges();

    const textInputs = fixture.debugElement
      .queryAll(By.directive(GovukTextInputComponent))
      .map((debugElement) => debugElement.componentInstance as GovukTextInputComponent);
    const renderedLabels = textInputs.map(({ labelText }) => labelText);
    const renderedIds = textInputs.map(({ inputId }) => inputId);

    expect(renderedLabels).toEqual([
      'Address line 1',
      'Address line 2',
      'Address line 3',
      'Address line 4',
      'Address line 5',
      'Postal or zip code',
    ]);
    expect(renderedIds).toEqual(Object.values(fieldNames));
    expect(textInputs.map(({ inputName }) => inputName)).toEqual(Object.values(fieldNames));
    expect(textInputs.at(-1)?.inputClasses).toBe('govuk-input--width-10');
  });

  it('binds every field to the supplied parent control and matching error', () => {
    fixture.detectChanges();

    const textInputs = fixture.debugElement
      .queryAll(By.directive(GovukTextInputComponent))
      .map((debugElement) => debugElement.componentInstance as GovukTextInputComponent);

    for (const input of textInputs) {
      expect(input.getControl).toBe(form.get(input.inputId));
      expect(input.errors).toBe(errors[input.inputId]);
    }
  });

  it('uppercases an opted-in postal code while keeping address lines in their entered case', () => {
    component.capitalisePostalOrZipCode = true;
    fixture.detectChanges();
    const postal = fixture.nativeElement.querySelector(`#${fieldNames.postalOrZipCode}`) as HTMLInputElement;
    const address = fixture.nativeElement.querySelector(`#${fieldNames.addressLine1}`) as HTMLInputElement;
    postal.value = 'ab1 2cd';
    postal.dispatchEvent(new Event('input'));
    address.value = 'Mixed Case Street';
    address.dispatchEvent(new Event('input'));
    expect(postal.value).toBe('AB1 2CD');
    expect(form.get(fieldNames.postalOrZipCode)?.value).toBe('AB1 2CD');
    expect(form.get(fieldNames.addressLine1)?.value).toBe('Mixed Case Street');
    postal.value = '';
    postal.dispatchEvent(new Event('input'));
    expect(form.get(fieldNames.postalOrZipCode)?.value).toBe('');
  });

  it.each([
    { start: 2, end: 2, characters: 'xy', expected: 'ABXYCD', caret: 4 },
    { start: 1, end: 3, characters: 'xy', expected: 'AXYD', caret: 3 },
    { start: 2, end: 2, characters: 'ßy', expected: 'ABSSYCD', caret: 5 },
  ])('preserves the editing position when uppercasing $characters at $start–$end', (example) => {
    component.capitalisePostalOrZipCode = true;
    fixture.detectChanges();
    const postal = fixture.nativeElement.querySelector(`#${fieldNames.postalOrZipCode}`) as HTMLInputElement;
    postal.focus();
    postal.value = 'ABCD';
    postal.dispatchEvent(new Event('input', { bubbles: true }));
    postal.setSelectionRange(example.start, example.end);

    for (const character of example.characters) {
      postal.setRangeText(character, postal.selectionStart!, postal.selectionEnd!, 'end');
      postal.dispatchEvent(new Event('input', { bubbles: true }));
    }

    expect(postal.value).toBe(example.expected);
    expect(form.get(fieldNames.postalOrZipCode)?.value).toBe(example.expected);
    expect(postal.selectionStart).toBe(example.caret);
    expect(postal.selectionEnd).toBe(example.caret);
  });

  it('preserves postal-code casing by default for Order Terms address consumers', () => {
    fixture.detectChanges();
    const postal = fixture.nativeElement.querySelector(`#${fieldNames.postalOrZipCode}`) as HTMLInputElement;
    postal.value = 'ab1 2cd';
    postal.dispatchEvent(new Event('input'));
    expect(postal.value).toBe('ab1 2cd');
    expect(form.get(fieldNames.postalOrZipCode)?.value).toBe('ab1 2cd');
  });

  it('preserves an existing postal code on initial render even when typing is opted in', () => {
    component.capitalisePostalOrZipCode = true;
    form.get(fieldNames.postalOrZipCode)?.setValue('ab1 2cd');
    fixture.detectChanges();
    expect(form.get(fieldNames.postalOrZipCode)?.value).toBe('ab1 2cd');
  });
});
