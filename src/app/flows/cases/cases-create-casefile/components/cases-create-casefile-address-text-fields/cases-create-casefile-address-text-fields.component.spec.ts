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
});
