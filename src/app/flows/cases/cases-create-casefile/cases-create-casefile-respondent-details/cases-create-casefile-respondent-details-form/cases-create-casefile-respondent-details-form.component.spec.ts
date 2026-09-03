import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileRestrictedInformationComponent } from '../../components/cases-create-casefile-restricted-information/cases-create-casefile-restricted-information.component';
import { CasesCreateCasefileThirdPartyComponent } from '../../components/cases-create-casefile-third-party/cases-create-casefile-third-party.component';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS } from '../mocks/cases-create-casefile-respondent-details.mock';
import type { ICasesCreateCasefileRespondentDetailsFormData } from '../interfaces/cases-create-casefile-respondent-details-form-data.interface';
import { CasesCreateCasefileRespondentDetailsFormComponent } from './cases-create-casefile-respondent-details-form.component';

describe('CasesCreateCasefileRespondentDetailsFormComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileRespondentDetailsFormComponent>;
  let component: CasesCreateCasefileRespondentDetailsFormComponent;

  const emptyFormData: ICasesCreateCasefileRespondentDetailsFormData = {
    create_casefile_respondent_details_title: null,
    create_casefile_respondent_details_first_names: null,
    create_casefile_respondent_details_last_name: null,
    create_casefile_respondent_details_add_aliases: false,
    create_casefile_respondent_details_aliases: [],
    create_casefile_respondent_details_date_of_birth: null,
    create_casefile_respondent_details_national_insurance_number: null,
    create_casefile_respondent_details_other_personal_information: null,
    create_casefile_respondent_details_main_email_address: null,
    create_casefile_respondent_details_other_email_address: null,
    create_casefile_respondent_details_main_telephone_number: null,
    create_casefile_respondent_details_other_telephone_number: null,
    create_casefile_respondent_details_address_line_1: null,
    create_casefile_respondent_details_address_line_2: null,
    create_casefile_respondent_details_address_line_3: null,
    create_casefile_respondent_details_address_line_4: null,
    create_casefile_respondent_details_address_line_5: null,
    create_casefile_respondent_details_postal_or_zip_code: null,
    create_casefile_respondent_details_country_id: null,
    create_casefile_respondent_details_send_correspondence_to_third_party: false,
    create_casefile_respondent_details_third_party_name_or_organisation: null,
    create_casefile_respondent_details_third_party_relationship: null,
    create_casefile_respondent_details_third_party_reference: null,
    create_casefile_respondent_details_third_party_address_line_1: null,
    create_casefile_respondent_details_third_party_address_line_2: null,
    create_casefile_respondent_details_third_party_address_line_3: null,
    create_casefile_respondent_details_third_party_address_line_4: null,
    create_casefile_respondent_details_third_party_address_line_5: null,
    create_casefile_respondent_details_third_party_postal_or_zip_code: null,
    create_casefile_respondent_details_third_party_country_id: null,
    create_casefile_respondent_details_add_employer_details: false,
    create_casefile_respondent_details_employer_name: null,
    create_casefile_respondent_details_employee_reference: null,
    create_casefile_respondent_details_employer_email_address: null,
    create_casefile_respondent_details_employer_telephone_number: null,
    create_casefile_respondent_details_employer_address_line_1: null,
    create_casefile_respondent_details_employer_address_line_2: null,
    create_casefile_respondent_details_employer_address_line_3: null,
    create_casefile_respondent_details_employer_address_line_4: null,
    create_casefile_respondent_details_employer_address_line_5: null,
    create_casefile_respondent_details_employer_postal_or_zip_code: null,
    create_casefile_respondent_details_employer_country_id: null,
    create_casefile_respondent_details_restricted_information: false,
    create_casefile_respondent_details_restricted_information_reason: null,
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

  it('uses canonical, unique identifiers for every form control and error-summary target', () => {
    fixture.detectChanges();
    component.form.controls['create_casefile_respondent_details_add_aliases'].setValue(true);
    component.form.controls['create_casefile_respondent_details_send_correspondence_to_third_party'].setValue(true);
    component.form.controls['create_casefile_respondent_details_add_employer_details'].setValue(true);
    component.form.controls['create_casefile_respondent_details_restricted_information'].setValue(true);
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit'));
    fixture.detectChanges();

    const controls = Array.from(
      fixture.nativeElement.querySelectorAll('input, select, textarea') as NodeListOf<HTMLElement>,
    );
    const ids = controls.map((control) => control.id);
    const names = controls.map((control) => control.getAttribute('name') ?? '');

    expect(ids.every((id) => id.startsWith('create_casefile_respondent_details_'))).toBe(true);
    expect(names.every((name) => name.startsWith('create_casefile_respondent_details_'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    for (const controlName of Object.keys(component.form.controls).filter((name) => !name.endsWith('_aliases'))) {
      expect(names).toContain(controlName);
    }
    for (const error of component.formErrorSummaryMessage) {
      expect(fixture.nativeElement.querySelectorAll(`[id="${error.fieldId}"]`)).toHaveLength(1);
    }
  });

  it('builds the required base controls and leaves optional branches disabled', () => {
    fixture.detectChanges();

    expect(component.form.controls['create_casefile_respondent_details_first_names'].hasError('required')).toBe(true);
    expect(component.form.controls['create_casefile_respondent_details_address_line_1'].hasError('required')).toBe(
      true,
    );
    expect(component.form.controls['create_casefile_respondent_details_country_id'].hasError('required')).toBe(true);
    expect(component.form.controls['create_casefile_respondent_details_employer_name'].disabled).toBe(true);
    expect(
      component.form.controls['create_casefile_respondent_details_third_party_name_or_organisation'].disabled,
    ).toBe(true);
    expect(component.form.controls['create_casefile_respondent_details_restricted_information_reason'].disabled).toBe(
      true,
    );
  });

  it('passes the original form and respondent-specific contracts to the shared conditional sections', () => {
    fixture.detectChanges();

    const thirdParty = fixture.debugElement.query(By.directive(CasesCreateCasefileThirdPartyComponent))
      .componentInstance as CasesCreateCasefileThirdPartyComponent;
    expect(thirdParty.form).toBe(component.form);
    expect(thirdParty.formControlErrorMessages).toBe(component.formControlErrorMessages);
    expect(thirdParty.fieldNames).toEqual({
      nameOrOrganisation: 'create_casefile_respondent_details_third_party_name_or_organisation',
      relationship: 'create_casefile_respondent_details_third_party_relationship',
      reference: 'create_casefile_respondent_details_third_party_reference',
      addressLine1: 'create_casefile_respondent_details_third_party_address_line_1',
      addressLine2: 'create_casefile_respondent_details_third_party_address_line_2',
      addressLine3: 'create_casefile_respondent_details_third_party_address_line_3',
      addressLine4: 'create_casefile_respondent_details_third_party_address_line_4',
      addressLine5: 'create_casefile_respondent_details_third_party_address_line_5',
      postalOrZipCode: 'create_casefile_respondent_details_third_party_postal_or_zip_code',
      countryId: 'create_casefile_respondent_details_third_party_country_id',
    });
    expect(thirdParty.checkboxFieldName).toBe('create_casefile_respondent_details_send_correspondence_to_third_party');
    expect(thirdParty.checkboxFieldsetId).toBe(
      'create_casefile_respondent_details_send_correspondence_to_third_party_fieldset',
    );
    expect(thirdParty.conditionalId).toBe('respondentThirdPartyConditional');
    expect(thirdParty.relationshipLabel).toBe('Relationship to the respondent');
    expect(thirdParty.countrySelectOptions).toBe(component.countrySelectOptions);

    const restrictedInformation = fixture.debugElement.query(
      By.directive(CasesCreateCasefileRestrictedInformationComponent),
    ).componentInstance as CasesCreateCasefileRestrictedInformationComponent;
    expect(restrictedInformation.form).toBe(component.form);
    expect(restrictedInformation.formControlErrorMessages).toBe(component.formControlErrorMessages);
    expect(restrictedInformation.checkboxFieldName).toBe('create_casefile_respondent_details_restricted_information');
    expect(restrictedInformation.reasonFieldName).toBe(
      'create_casefile_respondent_details_restricted_information_reason',
    );
    expect(restrictedInformation.checkboxFieldsetId).toBe(
      'create_casefile_respondent_details_restricted_information_fieldset',
    );
    expect(restrictedInformation.conditionalId).toBe('respondentRestrictedInformationConditional');
    expect(restrictedInformation.checkboxLabel).toBe('Restrict the respondent’s personal information');
  });

  it('adds aliases up to five and clears them immediately when deselected', () => {
    fixture.detectChanges();

    component.form.controls['create_casefile_respondent_details_add_aliases'].setValue(true);
    for (let index = 1; index < 5; index += 1) {
      component.addAlias(index, 'create_casefile_respondent_details_aliases');
    }
    component.addAlias(5, 'create_casefile_respondent_details_aliases');
    expect(component.aliasControls).toHaveLength(5);

    component.form.controls['create_casefile_respondent_details_add_aliases'].setValue(false);
    expect(component.aliasControls).toHaveLength(0);
    expect(component.form.controls['create_casefile_respondent_details_aliases'].value).toEqual([]);
  });

  it.each([
    ['create_casefile_respondent_details_add_employer_details', 'create_casefile_respondent_details_employer_name'],
    [
      'create_casefile_respondent_details_send_correspondence_to_third_party',
      'create_casefile_respondent_details_third_party_name_or_organisation',
    ],
    [
      'create_casefile_respondent_details_restricted_information',
      'create_casefile_respondent_details_restricted_information_reason',
    ],
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
      'create_casefile_respondent_details_send_correspondence_to_third_party',
      [
        'create_casefile_respondent_details_third_party_name_or_organisation',
        'create_casefile_respondent_details_third_party_relationship',
        'create_casefile_respondent_details_third_party_address_line_1',
        'create_casefile_respondent_details_third_party_country_id',
      ],
    ],
    [
      'create_casefile_respondent_details_add_employer_details',
      [
        'create_casefile_respondent_details_employer_name',
        'create_casefile_respondent_details_employer_address_line_1',
        'create_casefile_respondent_details_employer_country_id',
      ],
    ],
    [
      'create_casefile_respondent_details_restricted_information',
      ['create_casefile_respondent_details_restricted_information_reason'],
    ],
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

    const nameControl = component.form.controls['create_casefile_respondent_details_third_party_name_or_organisation'];
    component.form.controls['create_casefile_respondent_details_send_correspondence_to_third_party'].setValue(true);

    expect(nameControl.hasError('required')).toBe(true);
    nameControl.setValue('a'.repeat(41));
    expect(nameControl.hasError('maxlength')).toBe(true);
  });

  it('clears conditional control and summary errors when a branch is deselected', () => {
    fixture.detectChanges();

    component.form.controls['create_casefile_respondent_details_send_correspondence_to_third_party'].setValue(true);
    component.handleFormSubmit(new SubmitEvent('submit'));
    expect(component.formControlErrorMessages['create_casefile_respondent_details_third_party_country_id']).toBe(
      'Select a country',
    );

    component.form.controls['create_casefile_respondent_details_send_correspondence_to_third_party'].setValue(false);

    expect(component.formControlErrorMessages['create_casefile_respondent_details_third_party_country_id']).toBeNull();
    expect(component.formErrorSummaryMessage).not.toContainEqual({
      fieldId: 'create_casefile_respondent_details_third_party_country_id',
      message: 'Select a country',
    });
  });

  it('does not accept a future date or invalid email and does not phone-pattern validate', () => {
    fixture.detectChanges();

    component.form.controls['create_casefile_respondent_details_date_of_birth'].setValue('01/01/2999');
    component.form.controls['create_casefile_respondent_details_main_email_address'].setValue('invalid');
    component.form.controls['create_casefile_respondent_details_main_telephone_number'].setValue(
      'international + value',
    );

    expect(
      component.form.controls['create_casefile_respondent_details_date_of_birth'].hasError('invalidDateOfBirth'),
    ).toBe(true);
    expect(
      component.form.controls['create_casefile_respondent_details_main_email_address'].hasError('emailPattern'),
    ).toBe(true);
    expect(component.form.controls['create_casefile_respondent_details_main_telephone_number'].valid).toBe(true);
  });

  it.each(['AB123456C', 'AB123456', '12Y12345'])(
    'accepts approved National Insurance number format %s',
    (nationalInsuranceNumber) => {
      fixture.detectChanges();

      const control = component.form.controls['create_casefile_respondent_details_national_insurance_number'];
      control.setValue(nationalInsuranceNumber);

      expect(control.errors).toBeNull();
    },
  );

  it.each(['A123456', 'ABC123456', 'AB12345', 'AB123456CD', '1Y12345', '12X12345', '12Y1234', '12Y123456'])(
    'rejects invalid National Insurance number boundary %s',
    (nationalInsuranceNumber) => {
      fixture.detectChanges();

      const control = component.form.controls['create_casefile_respondent_details_national_insurance_number'];
      control.setValue(nationalInsuranceNumber);

      expect(control.hasError('nationalInsuranceNumberPattern')).toBe(true);
    },
  );

  it.each([null, ''])('allows an optional National Insurance number value of %s', (nationalInsuranceNumber) => {
    fixture.detectChanges();

    const control = component.form.controls['create_casefile_respondent_details_national_insurance_number'];
    control.setValue(nationalInsuranceNumber);

    expect(control.errors).toBeNull();
  });

  it('renders the approved National Insurance number error under the preserved error key', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_national_insurance_number: 'invalid',
    };
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    const message = 'Enter a National Insurance number in the format AANNNNNNA';
    expect(formSubmitSpy).not.toHaveBeenCalled();
    expect(
      component.form.controls['create_casefile_respondent_details_national_insurance_number'].hasError(
        'nationalInsuranceNumberPattern',
      ),
    ).toBe(true);
    expect(component.formControlErrorMessages['create_casefile_respondent_details_national_insurance_number']).toBe(
      message,
    );
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'create_casefile_respondent_details_national_insurance_number',
      message,
    });
    expect(
      fixture.nativeElement.querySelector('#create_casefile_respondent_details_national_insurance_number-error-message')
        ?.textContent,
    ).toContain(message);
  });

  it('blocks whitespace-only required text and renders each existing exact error message', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_first_names: '   ',
      create_casefile_respondent_details_last_name: '\t',
      create_casefile_respondent_details_aliases: [{ firstNames: '  ', lastName: '\n' }],
      create_casefile_respondent_details_address_line_1: '   ',
      create_casefile_respondent_details_send_correspondence_to_third_party: true,
      create_casefile_respondent_details_third_party_name_or_organisation: '\t',
      create_casefile_respondent_details_third_party_relationship: '   ',
      create_casefile_respondent_details_third_party_address_line_1: '\n',
      create_casefile_respondent_details_third_party_country_id: 1,
      create_casefile_respondent_details_add_employer_details: true,
      create_casefile_respondent_details_employer_name: '   ',
      create_casefile_respondent_details_employer_address_line_1: '\t',
      create_casefile_respondent_details_employer_country_id: 1,
      create_casefile_respondent_details_restricted_information: true,
      create_casefile_respondent_details_restricted_information_reason: '   ',
    };
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(formSubmitSpy).not.toHaveBeenCalled();
    const expectedMessages = {
      create_casefile_respondent_details_first_names: 'Enter respondent’s first name(s)',
      create_casefile_respondent_details_last_name: 'Enter respondent’s last name',
      create_casefile_respondent_details_alias_first_names_0: 'Enter alias 1 first name(s)',
      create_casefile_respondent_details_alias_last_name_0: 'Enter alias 1 last name',
      create_casefile_respondent_details_address_line_1: 'Enter an address',
      create_casefile_respondent_details_third_party_name_or_organisation: 'Enter name or organisation',
      create_casefile_respondent_details_third_party_relationship: 'Enter relationship to the respondent',
      create_casefile_respondent_details_third_party_address_line_1: 'Enter an address',
      create_casefile_respondent_details_employer_name: 'Enter employer name',
      create_casefile_respondent_details_employer_address_line_1: 'Enter employer address',
      create_casefile_respondent_details_restricted_information_reason:
        'Enter a reason why the respondent’s personal information should not be shared',
    } as const;

    for (const [controlName, message] of Object.entries(expectedMessages)) {
      expect(component.formControlErrorMessages[controlName]).toBe(message);
      expect(component.formErrorSummaryMessage).toContainEqual({ fieldId: controlName, message });
      expect(fixture.nativeElement.querySelector(`#${controlName}-error-message`)?.textContent).toContain(message);
    }
  });

  it('hydrates saved base, alias and selected branch state before first render', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_aliases: [
        { firstNames: 'Alternative', lastName: 'Respondent' },
        { firstNames: 'Second', lastName: 'Alias' },
      ],
      create_casefile_respondent_details_send_correspondence_to_third_party: true,
      create_casefile_respondent_details_third_party_name_or_organisation: 'Support contact',
      create_casefile_respondent_details_third_party_relationship: 'Representative',
      create_casefile_respondent_details_third_party_address_line_1: '2 Test Street',
      create_casefile_respondent_details_third_party_country_id: 1,
    };
    fixture.detectChanges();

    expect(component.form.controls['create_casefile_respondent_details_first_names'].value).toBe('Test');
    expect(component.aliasControls).toHaveLength(2);
    expect(component.form.controls['create_casefile_respondent_details_aliases'].value).toEqual([
      {
        create_casefile_respondent_details_alias_first_names_0: 'Alternative',
        create_casefile_respondent_details_alias_last_name_0: 'Respondent',
      },
      {
        create_casefile_respondent_details_alias_first_names_1: 'Second',
        create_casefile_respondent_details_alias_last_name_1: 'Alias',
      },
    ]);
    expect(component.form.controls['create_casefile_respondent_details_third_party_name_or_organisation'].enabled).toBe(
      true,
    );
    expect(component.form.controls['create_casefile_respondent_details_third_party_name_or_organisation'].value).toBe(
      'Support contact',
    );
    expect(component.form.pristine).toBe(true);
  });

  it('removes all alias summary and form errors immediately when aliases are deselected', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_aliases: [{ firstNames: '', lastName: '' }],
    };
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit'));
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'create_casefile_respondent_details_alias_first_names_0',
      message: 'Enter alias 1 first name(s)',
    });

    component.form.controls['create_casefile_respondent_details_add_aliases'].setValue(false);

    expect(
      component.formErrorSummaryMessage.some((error) =>
        error.fieldId.startsWith('create_casefile_respondent_details_alias_'),
      ),
    ).toBe(false);
    expect(
      component.formErrors.some((error) => error.fieldId.startsWith('create_casefile_respondent_details_alias_')),
    ).toBe(false);
  });

  it('removes only the last alias summary and form errors when the last row is removed', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_aliases: [
        { firstNames: 'Alternative', lastName: 'Respondent' },
        { firstNames: '', lastName: '' },
      ],
    };
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit'));
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'create_casefile_respondent_details_alias_last_name_1',
      message: 'Enter alias 2 last name',
    });

    component.removeAlias(1, 'create_casefile_respondent_details_aliases');

    expect(component.formErrorSummaryMessage.some((error) => error.fieldId.endsWith('_1'))).toBe(false);
    expect(component.formErrors.some((error) => error.fieldId.endsWith('_1'))).toBe(false);
    expect(component.aliasControls).toHaveLength(1);
  });

  it('cleans up a single removed alias without trying to focus a remaining row', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_aliases: [{ firstNames: 'Alternative', lastName: 'Respondent' }],
    };
    const focusFirstAliasFieldSpy = vi.spyOn(
      component as unknown as { focusFirstAliasField: () => void },
      'focusFirstAliasField',
    );
    fixture.detectChanges();

    component.removeAlias(0, 'create_casefile_respondent_details_aliases');

    expect(component.aliasControls).toHaveLength(0);
    expect(focusFirstAliasFieldSpy).not.toHaveBeenCalled();
  });

  it('shows exact error-summary content when Return is submitted invalid', () => {
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(component.formControlErrorMessages['create_casefile_respondent_details_first_names']).toBe(
      'Enter respondent’s first name(s)',
    );
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'create_casefile_respondent_details_first_names',
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
      create_casefile_respondent_details_send_correspondence_to_third_party: true,
      create_casefile_respondent_details_third_party_name_or_organisation: 'Support contact',
      create_casefile_respondent_details_third_party_relationship: 'Representative',
      create_casefile_respondent_details_third_party_address_line_1: '2 Test Street',
      create_casefile_respondent_details_third_party_country_id: null,
    };
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector(
      '#create_casefile_respondent_details_third_party_country_id',
    ) as HTMLSelectElement;
    select.value = '1';
    select.dispatchEvent(new Event('change'));

    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();

    expect(formSubmitSpy).toHaveBeenCalledOnce();
    const submittedCountryId =
      formSubmitSpy.mock.calls[0]?.[0]?.formData.create_casefile_respondent_details_third_party_country_id;
    expect(submittedCountryId).toBe(1);
    expect(typeof submittedCountryId).toBe('number');
  });

  it('keeps Country required and invalid when the supplied collections are empty', () => {
    component.countryAutocompleteItems = [];
    component.countrySelectOptions = [];
    fixture.detectChanges();

    expect(component.form.controls['create_casefile_respondent_details_country_id'].hasError('required')).toBe(true);
  });

  it('rejects hydrated Country IDs that are absent from empty collections without discarding them', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_send_correspondence_to_third_party: true,
      create_casefile_respondent_details_third_party_name_or_organisation: 'Support contact',
      create_casefile_respondent_details_third_party_relationship: 'Representative',
      create_casefile_respondent_details_third_party_address_line_1: '2 Test Street',
      create_casefile_respondent_details_third_party_country_id: 1,
      create_casefile_respondent_details_add_employer_details: true,
      create_casefile_respondent_details_employer_name: 'Test employer',
      create_casefile_respondent_details_employer_address_line_1: '3 Test Street',
      create_casefile_respondent_details_employer_country_id: 1,
      create_casefile_respondent_details_restricted_information: true,
      create_casefile_respondent_details_restricted_information_reason: 'Court order',
    };
    component.countryAutocompleteItems = [];
    component.countrySelectOptions = [];
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(formSubmitSpy).not.toHaveBeenCalled();
    expect(component.form.controls['create_casefile_respondent_details_country_id'].value).toBe(1);
    expect(component.form.controls['create_casefile_respondent_details_third_party_country_id'].value).toBe(1);
    expect(component.form.controls['create_casefile_respondent_details_employer_country_id'].value).toBe(1);
    for (const countryControlName of [
      'create_casefile_respondent_details_country_id',
      'create_casefile_respondent_details_third_party_country_id',
      'create_casefile_respondent_details_employer_country_id',
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

    const employerCheckbox = component.form.controls['create_casefile_respondent_details_add_employer_details'];
    const employerName = component.form.controls['create_casefile_respondent_details_employer_name'];

    component.ngOnDestroy();
    employerCheckbox.setValue(true);

    expect(employerName.disabled).toBe(true);
  });

  it('nests every conditional beside its checkbox and points controls at the rendered ID', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      create_casefile_respondent_details_send_correspondence_to_third_party: true,
      create_casefile_respondent_details_add_employer_details: true,
      create_casefile_respondent_details_restricted_information: true,
    };
    fixture.detectChanges();

    for (const [checkboxId, conditionalId] of [
      ['create_casefile_respondent_details_add_aliases', 'respondentAliasesConditional-conditional'],
      [
        'create_casefile_respondent_details_send_correspondence_to_third_party',
        'respondentThirdPartyConditional-conditional',
      ],
      ['create_casefile_respondent_details_add_employer_details', 'respondentEmployerConditional-conditional'],
      [
        'create_casefile_respondent_details_restricted_information',
        'respondentRestrictedInformationConditional-conditional',
      ],
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
