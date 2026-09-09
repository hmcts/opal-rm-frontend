import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import {
  GovukCheckboxesComponent,
  GovukCheckboxesConditionalComponent,
  GovukCheckboxesItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-checkboxes';
import { GovukSelectComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-select';
import type { IGovUkSelectOptions } from '@hmcts/opal-frontend-common/components/govuk/govuk-select/interfaces';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileThirdPartyComponent } from './cases-create-casefile-third-party.component';

describe('CasesCreateCasefileThirdPartyComponent', () => {
  const checkboxFieldName = 'party_send_correspondence_to_third_party';
  const checkboxFieldsetId = 'party_send_correspondence_to_third_party_fieldset';
  const conditionalId = 'partyThirdPartyConditional';
  const fieldNames = {
    nameOrOrganisation: 'party_third_party_name_or_organisation',
    relationship: 'party_third_party_relationship',
    reference: 'party_third_party_reference',
    addressLine1: 'party_third_party_address_line_1',
    addressLine2: 'party_third_party_address_line_2',
    addressLine3: 'party_third_party_address_line_3',
    addressLine4: 'party_third_party_address_line_4',
    addressLine5: 'party_third_party_address_line_5',
    postalOrZipCode: 'party_third_party_postal_or_zip_code',
    countryId: 'party_third_party_country_id',
  } as const;
  const errors = Object.fromEntries(Object.values(fieldNames).map((fieldName) => [fieldName, `${fieldName} error`]));
  const countrySelectOptions: IGovUkSelectOptions[] = [
    { name: 'United Kingdom', value: 826 },
    { name: 'France', value: 250 },
  ];

  let fixture: ComponentFixture<CasesCreateCasefileThirdPartyComponent>;
  let component: CasesCreateCasefileThirdPartyComponent;
  let form: FormGroup;

  const configureComponent = (roleLabel: 'applicant' | 'respondent'): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileThirdPartyComponent);
    component = fixture.componentInstance;
    component.form = form;
    component.formControlErrorMessages = errors;
    component.fieldNames = fieldNames;
    component.checkboxFieldName = checkboxFieldName;
    component.checkboxFieldsetId = checkboxFieldsetId;
    component.conditionalId = conditionalId;
    component.roleLabel = roleLabel;
    component.countrySelectOptions = countrySelectOptions;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileThirdPartyComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    form = new FormGroup({
      [checkboxFieldName]: new FormControl(false, { nonNullable: true }),
      ...Object.fromEntries(Object.values(fieldNames).map((fieldName) => [fieldName, new FormControl(null)])),
    });
    configureComponent('applicant');
  });

  it('renders the exact unchecked checkbox contract without conditional controls', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe('Third party details');

    const checkboxes = fixture.debugElement.query(By.directive(GovukCheckboxesComponent))
      .componentInstance as GovukCheckboxesComponent;
    expect({ fieldSetId: checkboxes.fieldSetId, legendText: checkboxes.legendText }).toEqual({
      fieldSetId: checkboxFieldsetId,
      legendText: '',
    });

    const checkbox = fixture.debugElement.query(By.directive(GovukCheckboxesItemComponent))
      .componentInstance as GovukCheckboxesItemComponent;
    expect({
      labelText: checkbox.labelText,
      inputId: checkbox.inputId,
      inputName: checkbox.inputName,
      ariaControls: checkbox.ariaControls,
    }).toEqual({
      labelText: 'Send correspondence to a third party',
      inputId: checkboxFieldName,
      inputName: checkboxFieldName,
      ariaControls: `${conditionalId}-conditional`,
    });
    expect(checkbox.getControl).toBe(form.get(checkboxFieldName));
    expect(fixture.debugElement.query(By.directive(GovukCheckboxesConditionalComponent))).toBeNull();
    expect(fixture.debugElement.queryAll(By.directive(GovukTextInputComponent))).toHaveLength(0);
    expect(fixture.debugElement.query(By.directive(GovukSelectComponent))).toBeNull();
  });

  it.each([
    ['applicant', 'Relationship to the applicant'],
    ['respondent', 'Relationship to the respondent'],
  ] as const)(
    'renders the checked %s controls with exact copy, IDs, errors and options',
    (roleLabel, relationshipLabel) => {
      configureComponent(roleLabel);
      form.get(checkboxFieldName)?.setValue(true);
      fixture.detectChanges();

      const conditional = fixture.debugElement.query(By.directive(GovukCheckboxesConditionalComponent))
        .componentInstance as GovukCheckboxesConditionalComponent;
      expect(conditional.conditionalId).toBe(conditionalId);
      expect(conditional.id).toBe(`${conditionalId}-conditional`);

      const checkboxesHost = fixture.debugElement.query(By.directive(GovukCheckboxesComponent))
        .nativeElement as HTMLElement;
      const conditionalHost = fixture.debugElement.query(By.directive(GovukCheckboxesConditionalComponent))
        .nativeElement as HTMLElement;
      expect(checkboxesHost.nextElementSibling).toBe(conditionalHost);
      expect(conditionalHost.closest('opal-lib-govuk-checkboxes')).toBeNull();

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
          labelText: 'Name or organisation',
          inputId: fieldNames.nameOrOrganisation,
          inputName: fieldNames.nameOrOrganisation,
          inputClasses: undefined,
        },
        {
          labelText: relationshipLabel,
          inputId: fieldNames.relationship,
          inputName: fieldNames.relationship,
          inputClasses: undefined,
        },
        {
          labelText: 'Reference',
          inputId: fieldNames.reference,
          inputName: fieldNames.reference,
          inputClasses: undefined,
        },
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
      for (const input of textInputs) {
        expect(input.getControl).toBe(form.get(input.inputId));
        expect(input.errors).toBe(errors[input.inputId]);
      }

      const select = fixture.debugElement.query(By.directive(GovukSelectComponent))
        .componentInstance as GovukSelectComponent;
      expect({
        labelText: select.labelText,
        labelClasses: select.labelClasses,
        selectId: select.selectId,
        selectName: select.selectName,
      }).toEqual({
        labelText: 'Country',
        labelClasses: undefined,
        selectId: fieldNames.countryId,
        selectName: fieldNames.countryId,
      });
      expect(select.getControl).toBe(form.get(fieldNames.countryId));
      expect(select.errors).toBe(errors[fieldNames.countryId]);
      expect(select.options).toBe(countrySelectOptions);
    },
  );
});
