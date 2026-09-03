import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { AlphagovAccessibleAutocompleteComponent } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileAddressComponent } from './cases-create-casefile-address.component';

describe('CasesCreateCasefileAddressComponent', () => {
  const fieldNames = {
    addressLine1: 'party_address_line_1',
    addressLine2: 'party_address_line_2',
    addressLine3: 'party_address_line_3',
    addressLine4: 'party_address_line_4',
    addressLine5: 'party_address_line_5',
    postalOrZipCode: 'party_postal_or_zip_code',
    countryId: 'party_country_id',
  } as const;
  const errors = Object.fromEntries(Object.values(fieldNames).map((fieldName) => [fieldName, `${fieldName} error`]));
  const countryAutocompleteItems: IAlphagovAccessibleAutocompleteItem[] = [
    { name: 'United Kingdom', value: 826 },
    { name: 'France', value: 250 },
  ];

  let fixture: ComponentFixture<CasesCreateCasefileAddressComponent>;
  let component: CasesCreateCasefileAddressComponent;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileAddressComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    form = new FormGroup(
      Object.fromEntries(Object.values(fieldNames).map((fieldName) => [fieldName, new FormControl(null)])),
    );
    fixture = TestBed.createComponent(CasesCreateCasefileAddressComponent);
    component = fixture.componentInstance;
    component.form = form;
    component.formControlErrorMessages = errors;
    component.fieldNames = fieldNames;
    component.countryAutocompleteItems = countryAutocompleteItems;
  });

  it('renders the visible Address fieldset legend and exact controls in order', () => {
    fixture.detectChanges();

    const legend = fixture.nativeElement.querySelector('fieldset > legend') as HTMLLegendElement;
    expect(legend.textContent?.trim()).toBe('Address');

    const textInputs = fixture.debugElement
      .queryAll(By.directive(GovukTextInputComponent))
      .map((debugElement) => debugElement.componentInstance as GovukTextInputComponent);
    expect(
      textInputs.map(({ labelText, inputId, inputName, inputClasses }) => ({
        labelText,
        inputId,
        inputName,
        inputClasses,
      })),
    ).toEqual([
      {
        labelText: 'Address line 1',
        inputId: fieldNames.addressLine1,
        inputName: fieldNames.addressLine1,
        inputClasses: undefined,
      },
      {
        labelText: 'Address line 2',
        inputId: fieldNames.addressLine2,
        inputName: fieldNames.addressLine2,
        inputClasses: undefined,
      },
      {
        labelText: 'Address line 3',
        inputId: fieldNames.addressLine3,
        inputName: fieldNames.addressLine3,
        inputClasses: undefined,
      },
      {
        labelText: 'Address line 4',
        inputId: fieldNames.addressLine4,
        inputName: fieldNames.addressLine4,
        inputClasses: undefined,
      },
      {
        labelText: 'Address line 5',
        inputId: fieldNames.addressLine5,
        inputName: fieldNames.addressLine5,
        inputClasses: undefined,
      },
      {
        labelText: 'Postal or zip code',
        inputId: fieldNames.postalOrZipCode,
        inputName: fieldNames.postalOrZipCode,
        inputClasses: 'govuk-input--width-10',
      },
    ]);

    const autocomplete = fixture.debugElement.query(By.directive(AlphagovAccessibleAutocompleteComponent))
      .componentInstance as AlphagovAccessibleAutocompleteComponent;
    expect({
      labelText: autocomplete.labelText,
      labelClasses: autocomplete.labelClasses,
      inputId: autocomplete.inputId,
      inputName: autocomplete.inputName,
      showAllValues: autocomplete.showAllValues,
    }).toEqual({
      labelText: 'Country',
      labelClasses: 'govuk-label--s',
      inputId: fieldNames.countryId,
      inputName: fieldNames.countryId,
      showAllValues: true,
    });
  });

  it('binds every field to its original parent control, matching error and country items', () => {
    fixture.detectChanges();

    const textInputs = fixture.debugElement
      .queryAll(By.directive(GovukTextInputComponent))
      .map((debugElement) => debugElement.componentInstance as GovukTextInputComponent);
    for (const input of textInputs) {
      expect(input.getControl).toBe(form.get(input.inputId));
      expect(input.errors).toBe(errors[input.inputId]);
    }

    const autocomplete = fixture.debugElement.query(By.directive(AlphagovAccessibleAutocompleteComponent))
      .componentInstance as AlphagovAccessibleAutocompleteComponent;
    expect(autocomplete.getControl).toBe(form.get(fieldNames.countryId));
    expect(autocomplete.errors).toBe(errors[fieldNames.countryId]);
    expect(autocomplete.autoCompleteItems).toBe(countryAutocompleteItems);
  });
});
