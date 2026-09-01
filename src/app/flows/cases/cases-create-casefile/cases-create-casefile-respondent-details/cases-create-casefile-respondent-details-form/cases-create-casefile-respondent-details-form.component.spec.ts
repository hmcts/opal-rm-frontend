import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS } from '../mocks/cases-create-casefile-respondent-details.mock';
import type { ICasesCreateCasefileRespondentDetailsFormData } from '../interfaces/cases-create-casefile-respondent-details-form-data.interface';
import { CasesCreateCasefileRespondentDetailsFormComponent } from './cases-create-casefile-respondent-details-form.component';

describe('CasesCreateCasefileRespondentDetailsFormComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileRespondentDetailsFormComponent>;
  let component: CasesCreateCasefileRespondentDetailsFormComponent;

  const emptyFormData: ICasesCreateCasefileRespondentDetailsFormData = {
    respondent_title: null,
    respondent_first_names: null,
    respondent_last_name: null,
    respondent_add_aliases: false,
    respondent_aliases: [],
    respondent_date_of_birth: null,
    respondent_national_insurance_number: null,
    respondent_other_personal_information: null,
    respondent_main_email_address: null,
    respondent_other_email_address: null,
    respondent_main_telephone_number: null,
    respondent_other_telephone_number: null,
    respondent_address_line_1: null,
    respondent_address_line_2: null,
    respondent_address_line_3: null,
    respondent_address_line_4: null,
    respondent_address_line_5: null,
    respondent_postal_or_zip_code: null,
    respondent_country_id: null,
    respondent_send_correspondence_to_third_party: false,
    respondent_third_party_name_or_organisation: null,
    respondent_third_party_relationship: null,
    respondent_third_party_reference: null,
    respondent_third_party_address_line_1: null,
    respondent_third_party_address_line_2: null,
    respondent_third_party_address_line_3: null,
    respondent_third_party_address_line_4: null,
    respondent_third_party_address_line_5: null,
    respondent_third_party_postal_or_zip_code: null,
    respondent_third_party_country_id: null,
    respondent_add_employer_details: false,
    respondent_employer_name: null,
    respondent_employee_reference: null,
    respondent_employer_email_address: null,
    respondent_employer_telephone_number: null,
    respondent_employer_address_line_1: null,
    respondent_employer_address_line_2: null,
    respondent_employer_address_line_3: null,
    respondent_employer_address_line_4: null,
    respondent_employer_address_line_5: null,
    respondent_employer_postal_or_zip_code: null,
    respondent_employer_country_id: null,
    respondent_restricted_information: false,
    respondent_restricted_information_reason: null,
  };

  const createComponent = (): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileRespondentDetailsFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = emptyFormData;
    component.countryAutocompleteItems = [{ name: 'England', value: 1 }];
    component.countrySelectOptions = [{ name: 'England', value: 1 }];
  };

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileRespondentDetailsFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    createComponent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds the required base controls and leaves optional branches disabled', () => {
    fixture.detectChanges();

    expect(component.form.controls['respondent_first_names'].hasError('required')).toBe(true);
    expect(component.form.controls['respondent_address_line_1'].hasError('required')).toBe(true);
    expect(component.form.controls['respondent_country_id'].hasError('required')).toBe(true);
    expect(component.form.controls['respondent_employer_name'].disabled).toBe(true);
    expect(component.form.controls['respondent_third_party_name_or_organisation'].disabled).toBe(true);
    expect(component.form.controls['respondent_restricted_information_reason'].disabled).toBe(true);
  });

  it('adds aliases up to five and clears them immediately when deselected', () => {
    fixture.detectChanges();

    component.form.controls['respondent_add_aliases'].setValue(true);
    for (let index = 1; index < 5; index += 1) {
      component.addAlias(index, 'respondent_aliases');
    }
    component.addAlias(5, 'respondent_aliases');
    expect(component.aliasControls).toHaveLength(5);

    component.form.controls['respondent_add_aliases'].setValue(false);
    expect(component.aliasControls).toHaveLength(0);
    expect(component.form.controls['respondent_aliases'].value).toEqual([]);
  });

  it.each([
    ['respondent_add_employer_details', 'respondent_employer_name'],
    ['respondent_send_correspondence_to_third_party', 'respondent_third_party_name_or_organisation'],
    ['respondent_restricted_information', 'respondent_restricted_information_reason'],
  ])('enables, requires and then clears %s branch controls', (checkboxName, fieldName) => {
    fixture.detectChanges();

    component.form.controls[checkboxName].setValue(true);
    component.form.controls[fieldName].setValue('Temporary value');
    expect(component.form.controls[fieldName].enabled).toBe(true);

    component.form.controls[checkboxName].setValue(false);
    expect(component.form.controls[fieldName].disabled).toBe(true);
    expect(component.form.controls[fieldName].value).toBeNull();
  });

  it.each([
    [
      'respondent_send_correspondence_to_third_party',
      [
        'respondent_third_party_name_or_organisation',
        'respondent_third_party_relationship',
        'respondent_third_party_address_line_1',
        'respondent_third_party_country_id',
      ],
    ],
    [
      'respondent_add_employer_details',
      ['respondent_employer_name', 'respondent_employer_address_line_1', 'respondent_employer_country_id'],
    ],
    ['respondent_restricted_information', ['respondent_restricted_information_reason']],
  ])('requires every configured control when %s is selected', (checkboxName, requiredControlNames) => {
    fixture.detectChanges();

    component.form.controls[checkboxName].setValue(true);

    for (const controlName of requiredControlNames) {
      expect(component.form.controls[controlName].enabled).toBe(true);
      expect(component.form.controls[controlName].hasError('required')).toBe(true);
    }
  });

  it('adds required validators without dropping branch length validators', () => {
    fixture.detectChanges();

    const nameControl = component.form.controls['respondent_third_party_name_or_organisation'];
    component.form.controls['respondent_send_correspondence_to_third_party'].setValue(true);

    expect(nameControl.hasError('required')).toBe(true);
    nameControl.setValue('a'.repeat(41));
    expect(nameControl.hasError('maxlength')).toBe(true);
  });

  it('clears conditional control and summary errors when a branch is deselected', () => {
    fixture.detectChanges();

    component.form.controls['respondent_send_correspondence_to_third_party'].setValue(true);
    component.handleFormSubmit(new SubmitEvent('submit'));
    expect(component.formControlErrorMessages['respondent_third_party_country_id']).toBe('Select a country');

    component.form.controls['respondent_send_correspondence_to_third_party'].setValue(false);

    expect(component.formControlErrorMessages['respondent_third_party_country_id']).toBeNull();
    expect(component.formErrorSummaryMessage).not.toContainEqual({
      fieldId: 'respondent_third_party_country_id',
      message: 'Select a country',
    });
  });

  it('does not accept a future date or invalid email and does not phone-pattern validate', () => {
    fixture.detectChanges();

    component.form.controls['respondent_date_of_birth'].setValue('01/01/2999');
    component.form.controls['respondent_main_email_address'].setValue('invalid');
    component.form.controls['respondent_main_telephone_number'].setValue('international + value');

    expect(component.form.controls['respondent_date_of_birth'].hasError('invalidDateOfBirth')).toBe(true);
    expect(component.form.controls['respondent_main_email_address'].hasError('emailPattern')).toBe(true);
    expect(component.form.controls['respondent_main_telephone_number'].valid).toBe(true);
  });

  it('hydrates saved base, alias and selected branch state before first render', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      respondent_aliases: [
        { firstNames: 'Alternative', lastName: 'Respondent' },
        { firstNames: 'Second', lastName: 'Alias' },
      ],
      respondent_send_correspondence_to_third_party: true,
      respondent_third_party_name_or_organisation: 'Support contact',
      respondent_third_party_relationship: 'Representative',
      respondent_third_party_address_line_1: '2 Test Street',
      respondent_third_party_country_id: 1,
    };
    fixture.detectChanges();

    expect(component.form.controls['respondent_first_names'].value).toBe('Test');
    expect(component.aliasControls).toHaveLength(2);
    expect(component.form.controls['respondent_aliases'].value).toEqual([
      {
        respondent_alias_first_names_0: 'Alternative',
        respondent_alias_last_name_0: 'Respondent',
      },
      {
        respondent_alias_first_names_1: 'Second',
        respondent_alias_last_name_1: 'Alias',
      },
    ]);
    expect(component.form.controls['respondent_third_party_name_or_organisation'].enabled).toBe(true);
    expect(component.form.controls['respondent_third_party_name_or_organisation'].value).toBe('Support contact');
  });

  it('removes all alias summary and form errors immediately when aliases are deselected', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      respondent_aliases: [{ firstNames: '', lastName: '' }],
    };
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit'));
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'respondent_alias_first_names_0',
      message: 'Enter alias 1 first name(s)',
    });

    component.form.controls['respondent_add_aliases'].setValue(false);

    expect(component.formErrorSummaryMessage.some((error) => error.fieldId.startsWith('respondent_alias_'))).toBe(
      false,
    );
    expect(component.formErrors.some((error) => error.fieldId.startsWith('respondent_alias_'))).toBe(false);
  });

  it('removes only the last alias summary and form errors when the last row is removed', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      respondent_aliases: [
        { firstNames: 'Alternative', lastName: 'Respondent' },
        { firstNames: '', lastName: '' },
      ],
    };
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit'));
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'respondent_alias_last_name_1',
      message: 'Enter alias 2 last name',
    });

    component.removeAlias(1, 'respondent_aliases');

    expect(component.formErrorSummaryMessage.some((error) => error.fieldId.endsWith('_1'))).toBe(false);
    expect(component.formErrors.some((error) => error.fieldId.endsWith('_1'))).toBe(false);
    expect(component.aliasControls).toHaveLength(1);
  });

  it('shows exact error-summary content when Return is submitted invalid', () => {
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(component.formControlErrorMessages['respondent_first_names']).toBe('Enter respondent’s first name(s)');
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'respondent_first_names',
      message: 'Enter respondent’s first name(s)',
    });
    expect(fixture.nativeElement.querySelector('opal-lib-govuk-error-summary')).toBeTruthy();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.govuk-error-summary'));
  });

  it('emits the typed raw value with nestedFlow false when Return is submitted valid', () => {
    component.initialFormData = CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData;
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      nestedFlow: false,
    });
  });

  it('emits the rendered third-party Country selection as a number when Return is submitted', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      respondent_send_correspondence_to_third_party: true,
      respondent_third_party_name_or_organisation: 'Support contact',
      respondent_third_party_relationship: 'Representative',
      respondent_third_party_address_line_1: '2 Test Street',
      respondent_third_party_country_id: null,
    };
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('#respondent_third_party_country_id') as HTMLSelectElement;
    select.value = '1';
    select.dispatchEvent(new Event('change'));

    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();

    expect(formSubmitSpy).toHaveBeenCalledOnce();
    const submittedCountryId = formSubmitSpy.mock.calls[0]?.[0]?.formData.respondent_third_party_country_id;
    expect(submittedCountryId).toBe(1);
    expect(typeof submittedCountryId).toBe('number');
  });

  it('keeps Country required and invalid when the supplied collections are empty', () => {
    component.countryAutocompleteItems = [];
    component.countrySelectOptions = [];
    fixture.detectChanges();

    expect(component.form.controls['respondent_country_id'].hasError('required')).toBe(true);
  });

  it('rejects hydrated Country IDs that are absent from empty collections without discarding them', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      respondent_send_correspondence_to_third_party: true,
      respondent_third_party_name_or_organisation: 'Support contact',
      respondent_third_party_relationship: 'Representative',
      respondent_third_party_address_line_1: '2 Test Street',
      respondent_third_party_country_id: 1,
      respondent_add_employer_details: true,
      respondent_employer_name: 'Test employer',
      respondent_employer_address_line_1: '3 Test Street',
      respondent_employer_country_id: 1,
      respondent_restricted_information: true,
      respondent_restricted_information_reason: 'Court order',
    };
    component.countryAutocompleteItems = [];
    component.countrySelectOptions = [];
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(formSubmitSpy).not.toHaveBeenCalled();
    expect(component.form.controls['respondent_country_id'].value).toBe(1);
    expect(component.form.controls['respondent_third_party_country_id'].value).toBe(1);
    expect(component.form.controls['respondent_employer_country_id'].value).toBe(1);
    for (const countryControlName of [
      'respondent_country_id',
      'respondent_third_party_country_id',
      'respondent_employer_country_id',
    ]) {
      expect(component.formControlErrorMessages[countryControlName]).toBe('Select a country');
      expect(component.formErrorSummaryMessage).toContainEqual({
        fieldId: countryControlName,
        message: 'Select a country',
      });
    }
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.govuk-error-summary'));
  });

  it('stops conditional branch updates after destruction', () => {
    fixture.detectChanges();

    const employerCheckbox = component.form.controls['respondent_add_employer_details'];
    const employerName = component.form.controls['respondent_employer_name'];

    component.ngOnDestroy();
    employerCheckbox.setValue(true);

    expect(employerName.disabled).toBe(true);
  });

  it('nests every conditional beside its checkbox and points controls at the rendered ID', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      respondent_send_correspondence_to_third_party: true,
      respondent_add_employer_details: true,
      respondent_restricted_information: true,
    };
    fixture.detectChanges();

    for (const [checkboxId, conditionalId] of [
      ['respondent_add_aliases', 'respondentAliasesConditional-conditional'],
      ['respondent_send_correspondence_to_third_party', 'respondentThirdPartyConditional-conditional'],
      ['respondent_add_employer_details', 'respondentEmployerConditional-conditional'],
      ['respondent_restricted_information', 'respondentRestrictedInformationConditional-conditional'],
    ]) {
      const checkbox = fixture.nativeElement.querySelector(`#${checkboxId}`) as HTMLInputElement;
      const conditional = fixture.nativeElement.querySelector(`#${conditionalId}`) as HTMLDivElement;
      const checkboxItem = checkbox.closest('.govuk-checkboxes__item');

      expect(checkbox.getAttribute('data-aria-controls')).toBe(conditional.id);
      expect(checkboxItem?.nextElementSibling).toBe(conditional);
      expect(conditional.closest('opal-lib-govuk-checkboxes')).toBeTruthy();
    }
    expect(fixture.nativeElement.querySelector('#returnToCaseDetails')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#cancelRespondentDetails')).toBeTruthy();
  });
});
