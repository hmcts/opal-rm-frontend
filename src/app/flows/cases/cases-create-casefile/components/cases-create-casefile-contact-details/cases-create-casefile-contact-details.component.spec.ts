import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileContactDetailsComponent } from './cases-create-casefile-contact-details.component';

describe('CasesCreateCasefileContactDetailsComponent', () => {
  const fieldNames = {
    mainEmailAddress: 'party_main_email_address',
    otherEmailAddress: 'party_other_email_address',
    mainTelephoneNumber: 'party_main_telephone_number',
    otherTelephoneNumber: 'party_other_telephone_number',
  } as const;
  const errors: Record<string, string> = {
    party_main_email_address: 'Enter the main email address correctly',
    party_other_email_address: 'Enter the other email address correctly',
    party_main_telephone_number: 'Enter the main telephone number correctly',
    party_other_telephone_number: 'Enter the other telephone number correctly',
  };

  let fixture: ComponentFixture<CasesCreateCasefileContactDetailsComponent>;
  let component: CasesCreateCasefileContactDetailsComponent;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileContactDetailsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    form = new FormGroup(
      Object.fromEntries(Object.values(fieldNames).map((fieldName) => [fieldName, new FormControl(null)])),
    );
    fixture = TestBed.createComponent(CasesCreateCasefileContactDetailsComponent);
    component = fixture.componentInstance;
    component.form = form;
    component.formControlErrorMessages = errors;
    component.fieldNames = fieldNames;
  });

  it('renders the visible Contact details fieldset legend and exact control contract', () => {
    fixture.detectChanges();

    const legend = fixture.nativeElement.querySelector('fieldset > legend') as HTMLLegendElement;
    expect(legend.textContent?.trim()).toBe('Contact details');

    const inputs = fixture.debugElement
      .queryAll(By.directive(GovukTextInputComponent))
      .map((debugElement) => debugElement.componentInstance as GovukTextInputComponent);
    expect(
      inputs.map(({ labelText, hintText, inputId, inputName, inputClasses }) => ({
        labelText,
        hintText,
        inputId,
        inputName,
        inputClasses,
      })),
    ).toEqual([
      {
        labelText: 'Main email address',
        hintText: undefined,
        inputId: fieldNames.mainEmailAddress,
        inputName: fieldNames.mainEmailAddress,
        inputClasses: 'govuk-input--width-20',
      },
      {
        labelText: 'Other email address',
        hintText: undefined,
        inputId: fieldNames.otherEmailAddress,
        inputName: fieldNames.otherEmailAddress,
        inputClasses: 'govuk-input--width-20',
      },
      {
        labelText: 'Main telephone number',
        hintText: 'For international numbers include the country code',
        inputId: fieldNames.mainTelephoneNumber,
        inputName: fieldNames.mainTelephoneNumber,
        inputClasses: 'govuk-input--width-20',
      },
      {
        labelText: 'Other telephone number',
        hintText: 'For international numbers include the country code',
        inputId: fieldNames.otherTelephoneNumber,
        inputName: fieldNames.otherTelephoneNumber,
        inputClasses: 'govuk-input--width-20',
      },
    ]);
    expect(inputs.every(({ labelClasses }) => labelClasses === 'govuk-label--s')).toBe(true);
  });

  it('binds each input to the original parent control and matching error', () => {
    fixture.detectChanges();

    const inputs = fixture.debugElement
      .queryAll(By.directive(GovukTextInputComponent))
      .map((debugElement) => debugElement.componentInstance as GovukTextInputComponent);

    for (const input of inputs) {
      expect(input.getControl).toBe(form.get(input.inputId));
      expect(input.errors).toBe(errors[input.inputId]);
    }
  });
});
