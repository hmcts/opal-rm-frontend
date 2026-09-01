import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileApplicantIndividualFormData } from '../interfaces/cases-create-casefile-applicant-individual-form-data.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../mocks/cases-create-casefile-applicant-individual.mock';
import { CasesCreateCasefileApplicantIndividualFormComponent } from './cases-create-casefile-applicant-individual-form.component';

describe('CasesCreateCasefileApplicantIndividualFormComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileApplicantIndividualFormComponent>;
  let component: CasesCreateCasefileApplicantIndividualFormComponent;

  const emptyFormData: ICasesCreateCasefileApplicantIndividualFormData = {
    applicant_title: null,
    applicant_first_names: null,
    applicant_last_name: null,
    applicant_add_aliases: false,
    applicant_aliases: [],
    applicant_date_of_birth: null,
    applicant_main_email_address: null,
    applicant_other_email_address: null,
    applicant_main_telephone_number: null,
    applicant_other_telephone_number: null,
    applicant_address_line_1: null,
    applicant_address_line_2: null,
    applicant_address_line_3: null,
    applicant_address_line_4: null,
    applicant_address_line_5: null,
    applicant_postal_or_zip_code: null,
    applicant_country_id: null,
    applicant_send_correspondence_to_third_party: false,
    applicant_third_party_name_or_organisation: null,
    applicant_third_party_relationship: null,
    applicant_third_party_reference: null,
    applicant_third_party_address_line_1: null,
    applicant_third_party_address_line_2: null,
    applicant_third_party_address_line_3: null,
    applicant_third_party_address_line_4: null,
    applicant_third_party_address_line_5: null,
    applicant_third_party_postal_or_zip_code: null,
    applicant_third_party_country_id: null,
    applicant_bank_type: null,
    applicant_uk_bank_name_on_account: null,
    applicant_uk_bank_sort_code: null,
    applicant_uk_bank_account_number: null,
    applicant_uk_bank_payment_reference: null,
    applicant_non_uk_bank_name_on_account: null,
    applicant_non_uk_bank_account_number: null,
    applicant_non_uk_bank_payment_reference: null,
    applicant_non_uk_bank_bic_swift_code: null,
    applicant_non_uk_bank_iban: null,
    applicant_non_uk_bank_name: null,
    applicant_non_uk_bank_branch_sort_code: null,
    applicant_restricted_information: false,
    applicant_restricted_information_reason: null,
  };

  const conditionalControlNames = [
    'applicant_third_party_name_or_organisation',
    'applicant_third_party_relationship',
    'applicant_third_party_reference',
    'applicant_third_party_address_line_1',
    'applicant_third_party_address_line_2',
    'applicant_third_party_address_line_3',
    'applicant_third_party_address_line_4',
    'applicant_third_party_address_line_5',
    'applicant_third_party_postal_or_zip_code',
    'applicant_third_party_country_id',
    'applicant_uk_bank_name_on_account',
    'applicant_uk_bank_sort_code',
    'applicant_uk_bank_account_number',
    'applicant_uk_bank_payment_reference',
    'applicant_non_uk_bank_name_on_account',
    'applicant_non_uk_bank_account_number',
    'applicant_non_uk_bank_payment_reference',
    'applicant_non_uk_bank_bic_swift_code',
    'applicant_non_uk_bank_iban',
    'applicant_non_uk_bank_name',
    'applicant_non_uk_bank_branch_sort_code',
    'applicant_restricted_information_reason',
  ] as const;

  const createComponent = (): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileApplicantIndividualFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = emptyFormData;
    component.countryAutocompleteItems = [
      { name: 'United Kingdom', value: 1 },
      { name: 'France', value: 2 },
    ];
    component.countrySelectOptions = [
      { name: 'United Kingdom', value: 1 },
      { name: 'France', value: 2 },
    ];
  };

  const setRenderedInputValue = (inputId: string, value: string): HTMLInputElement => {
    const input = fixture.nativeElement.querySelector(`#${inputId}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return input;
  };

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileApplicantIndividualFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    createComponent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds every typed form control with empty core state and disabled conditional fields', () => {
    fixture.detectChanges();

    expect(Object.keys(component.form.controls).sort()).toEqual(Object.keys(emptyFormData).sort());
    expect(component.form.controls['applicant_title'].value).toBeNull();
    expect(component.form.controls['applicant_first_names'].hasError('required')).toBe(true);
    expect(component.form.controls['applicant_last_name'].hasError('required')).toBe(true);
    expect(component.form.controls['applicant_address_line_1'].hasError('required')).toBe(true);
    expect(component.form.controls['applicant_country_id'].hasError('required')).toBe(true);
    expect(component.form.controls['applicant_aliases'].value).toEqual([]);
    for (const controlName of conditionalControlNames) {
      expect(component.form.controls[controlName].disabled).toBe(true);
    }
    expect(component.form.pristine).toBe(true);
  });

  it('renders the required sections and actions in their exact order with free-text Title', () => {
    fixture.detectChanges();

    const orderedElements = Array.from(
      fixture.nativeElement.querySelectorAll('h1, h2, #returnToCaseDetails, #cancelApplicantDetails'),
    ) as HTMLElement[];

    expect(orderedElements.map((element) => element.textContent?.trim())).toEqual([
      'Applicant details',
      'Contact details',
      'Address',
      'Third party details',
      'Bank details',
      'Restricted information',
      'Return to case details',
      'Cancel',
    ]);
    expect(fixture.nativeElement.querySelector('#applicant_title')).toBeInstanceOf(HTMLInputElement);
    expect(fixture.nativeElement.querySelector('select#applicant_title')).toBeNull();
  });

  it('hydrates saved identity, contact, address and indexed alias rows before first render', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData,
      applicant_aliases: [
        { firstNames: 'Alternative', lastName: 'Applicant' },
        { firstNames: 'Second', lastName: 'Alias' },
      ],
    };

    fixture.detectChanges();

    expect(component.form.controls['applicant_title'].value).toBe('Mr');
    expect(component.form.controls['applicant_first_names'].value).toBe('Test');
    expect(component.form.controls['applicant_date_of_birth'].value).toBe('31/01/1990');
    expect(component.form.controls['applicant_main_email_address'].value).toBe('applicant@example.com');
    expect(component.form.controls['applicant_main_telephone_number'].value).toBe('020 7946 0000');
    expect(component.form.controls['applicant_address_line_1'].value).toBe('1 Test Street');
    expect(component.form.controls['applicant_country_id'].value).toBe(1);
    expect(component.aliasControls).toHaveLength(2);
    expect(component.form.controls['applicant_aliases'].value).toEqual([
      {
        applicant_alias_first_names_0: 'Alternative',
        applicant_alias_last_name_0: 'Applicant',
      },
      {
        applicant_alias_first_names_1: 'Second',
        applicant_alias_last_name_1: 'Alias',
      },
    ]);
    expect(component.form.controls['applicant_uk_bank_name_on_account'].disabled).toBe(true);
    expect(component.form.controls['applicant_uk_bank_name_on_account'].value).toBe('Test Applicant');
    expect(component.form.pristine).toBe(true);
  });

  it('enforces the approved identity, contact and address validation boundaries', () => {
    fixture.detectChanges();

    component.form.controls['applicant_title'].setValue('T'.repeat(21));
    component.form.controls['applicant_first_names'].setValue('   ');
    component.form.controls['applicant_last_name'].setValue('L'.repeat(51));
    component.form.controls['applicant_date_of_birth'].setValue('01/01/2999');
    component.form.controls['applicant_main_email_address'].setValue('invalid');
    component.form.controls['applicant_main_telephone_number'].setValue('1'.repeat(36));
    component.form.controls['applicant_address_line_1'].setValue('\t');
    component.form.controls['applicant_address_line_2'].setValue('A'.repeat(31));
    component.form.controls['applicant_postal_or_zip_code'].setValue('P'.repeat(11));

    expect(component.form.controls['applicant_title'].hasError('maxlength')).toBe(true);
    expect(component.form.controls['applicant_first_names'].hasError('required')).toBe(true);
    expect(component.form.controls['applicant_last_name'].hasError('maxlength')).toBe(true);
    expect(component.form.controls['applicant_date_of_birth'].hasError('invalidDateOfBirth')).toBe(true);
    component.form.controls['applicant_date_of_birth'].setValue('31/02/2020');
    expect(component.form.controls['applicant_date_of_birth'].hasError('invalidDate')).toBe(true);
    component.form.controls['applicant_date_of_birth'].setValue('2020-01-31');
    expect(component.form.controls['applicant_date_of_birth'].hasError('invalidDateFormat')).toBe(true);
    expect(component.form.controls['applicant_main_email_address'].hasError('emailPattern')).toBe(true);
    expect(component.form.controls['applicant_main_telephone_number'].hasError('maxlength')).toBe(true);
    component.form.controls['applicant_main_telephone_number'].setValue('international + value');
    expect(component.form.controls['applicant_main_telephone_number'].errors).toBeNull();
    expect(component.form.controls['applicant_address_line_1'].hasError('required')).toBe(true);
    expect(component.form.controls['applicant_address_line_2'].hasError('maxlength')).toBe(true);
    expect(component.form.controls['applicant_postal_or_zip_code'].hasError('maxlength')).toBe(true);
  });

  it('accepts only supplied Country IDs while preserving an invalid hydrated value for correction', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData,
      applicant_country_id: 99,
    };
    fixture.detectChanges();

    expect(component.form.controls['applicant_country_id'].value).toBe(99);
    expect(component.form.controls['applicant_country_id'].hasError('required')).toBe(true);

    component.form.controls['applicant_country_id'].setValue(2);
    expect(component.form.controls['applicant_country_id'].errors).toBeNull();
  });

  it('keeps Country required when the supplied allow-list is empty', () => {
    component.countryAutocompleteItems = [];
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData,
      applicant_country_id: 1,
    };
    fixture.detectChanges();

    expect(component.form.controls['applicant_country_id'].value).toBe(1);
    expect(component.form.controls['applicant_country_id'].hasError('required')).toBe(true);
  });

  it('creates and focuses one stable alias row from the rendered checkbox and emits dirty state', async () => {
    const unsavedChangesSpy = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();
    const addAliasesCheckbox = fixture.nativeElement.querySelector('#applicant_add_aliases') as HTMLInputElement;

    addAliasesCheckbox.click();

    expect(addAliasesCheckbox.checked).toBe(true);
    expect(component.aliasControls).toHaveLength(1);
    expect(component.aliasControls[0]).toEqual({
      applicant_alias_first_names: {
        inputId: 'applicant_alias_first_names_0',
        inputName: 'applicant_alias_first_names_0',
        controlName: 'applicant_alias_first_names_0',
      },
      applicant_alias_last_name: {
        inputId: 'applicant_alias_last_name_0',
        inputName: 'applicant_alias_last_name_0',
        controlName: 'applicant_alias_last_name_0',
      },
    });
    expect(component.form.dirty).toBe(true);
    expect(unsavedChangesSpy).toHaveBeenCalledWith(true);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#applicant_alias_first_names_0'));
    });
  });

  it('uses the rendered Add button to focus new rows, emit dirty state and enforce the five-row limit', async () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData,
      applicant_aliases: [{ firstNames: 'Alternative', lastName: 'Applicant' }],
    };
    const unsavedChangesSpy = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();

    for (let index = 1; index < 5; index += 1) {
      (fixture.nativeElement.querySelector('#addApplicantAlias') as HTMLButtonElement).click();
    }

    expect(component.aliasControls).toHaveLength(5);
    expect(component.form.controls['applicant_aliases'].value).toHaveLength(5);
    expect(fixture.nativeElement.querySelector('#addApplicantAlias')).toBeNull();
    expect(component.form.dirty).toBe(true);
    expect(unsavedChangesSpy).toHaveBeenCalledWith(true);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#applicant_alias_first_names_4'));
    });
  });

  it('uses the rendered Remove link to clear only removed errors, emit dirty state and focus the remaining row', async () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData,
      applicant_aliases: [
        { firstNames: '', lastName: '' },
        { firstNames: '', lastName: '' },
      ],
    };
    const unsavedChangesSpy = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();
    unsavedChangesSpy.mockClear();

    (
      fixture.nativeElement.querySelector('#applicantAliasesConditional-conditional a.govuk-link') as HTMLAnchorElement
    ).click();

    expect(component.aliasControls).toHaveLength(1);
    expect(component.form.dirty).toBe(true);
    expect(unsavedChangesSpy).toHaveBeenCalledWith(true);
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'applicant_alias_first_names_0',
      message: 'Enter alias first name(s)',
    });
    expect(component.formErrorSummaryMessage.some((error: { fieldId: string }) => error.fieldId.endsWith('_1'))).toBe(
      false,
    );
    expect(component.formErrors.some((error: { fieldId: string }) => error.fieldId.endsWith('_1'))).toBe(false);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#applicant_alias_first_names_0'));
    });
  });

  it('uses the rendered checkbox to deselect aliases, clear their errors and emit dirty state', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData,
      applicant_aliases: [{ firstNames: '', lastName: '' }],
    };
    const unsavedChangesSpy = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();

    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'applicant_alias_first_names_0',
      message: 'Enter alias first name(s)',
    });
    unsavedChangesSpy.mockClear();

    const addAliasesCheckbox = fixture.nativeElement.querySelector('#applicant_add_aliases') as HTMLInputElement;
    addAliasesCheckbox.click();

    expect(addAliasesCheckbox.checked).toBe(false);
    expect(component.aliasControls).toHaveLength(0);
    expect(component.form.controls['applicant_aliases'].value).toEqual([]);
    expect(component.form.dirty).toBe(true);
    expect(unsavedChangesSpy).toHaveBeenCalledWith(true);
    expect(
      component.formErrorSummaryMessage.some((error: { fieldId: string }) =>
        error.fieldId.startsWith('applicant_alias_'),
      ),
    ).toBe(false);
    expect(
      component.formErrors.some((error: { fieldId: string }) => error.fieldId.startsWith('applicant_alias_')),
    ).toBe(false);
  });

  it('emits dirty state after a rendered core field edit', () => {
    const unsavedChangesSpy = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();
    const titleInput = fixture.nativeElement.querySelector('#applicant_title') as HTMLInputElement;

    titleInput.value = 'Dr';
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));

    expect(component.form.dirty).toBe(true);
    expect(unsavedChangesSpy).toHaveBeenCalledWith(true);
  });

  it('retains invalid rendered values and shows ordered inline and summary errors from the rendered Return button', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    const enteredValues = {
      applicant_first_names: '   ',
      applicant_last_name: 'L'.repeat(51),
      applicant_date_of_birth: '01/01/2999',
      applicant_main_email_address: 'invalid',
      applicant_address_line_1: '\t',
    } as const;
    const renderedInputs = Object.fromEntries(
      Object.entries(enteredValues).map(([controlName, value]) => [
        controlName,
        setRenderedInputValue(controlName, value),
      ]),
    );

    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();

    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: 'applicant_first_names', message: 'Enter applicant’s first name(s)' },
      { fieldId: 'applicant_last_name', message: 'Last name must be 50 characters or fewer' },
      { fieldId: 'applicant_date_of_birth', message: 'Date must be in the past' },
      {
        fieldId: 'applicant_main_email_address',
        message: 'Enter an email address in the correct format, like name@example.com',
      },
      { fieldId: 'applicant_address_line_1', message: 'Enter an address' },
      { fieldId: 'applicant_country_id', message: 'Select a country' },
    ]);
    expect(formSubmitSpy).not.toHaveBeenCalled();
    for (const [controlName, value] of Object.entries(enteredValues)) {
      expect(component.form.get(controlName)?.value).toBe(value);
      expect((renderedInputs[controlName] as HTMLInputElement).value).toBe(value);
      const message = component.formErrorSummaryMessage.find((error) => error.fieldId === controlName)?.message;
      expect(fixture.nativeElement.querySelector(`#${controlName}-error-message`)?.textContent).toContain(message);
    }
    expect(
      fixture.nativeElement.querySelector('#applicant_country_id-autocomplete-error-message')?.textContent,
    ).toContain('Select a country');
    expect(fixture.nativeElement.querySelector('.govuk-error-summary__title')?.textContent).toContain(
      'There is a problem',
    );
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.govuk-error-summary'));
  });

  it('uses identical inline and summary copy for date, email and length errors', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData,
      applicant_title: 'T'.repeat(21),
      applicant_date_of_birth: '01/01/2999',
      applicant_main_email_address: 'invalid',
      applicant_main_telephone_number: '1'.repeat(36),
    };
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();

    const expectedMessages = {
      applicant_title: 'Title must be 20 characters or fewer',
      applicant_date_of_birth: 'Date must be in the past',
      applicant_main_email_address: 'Enter an email address in the correct format, like name@example.com',
      applicant_main_telephone_number: 'Main telephone number must be 35 characters or fewer',
    } as const;

    for (const [controlName, message] of Object.entries(expectedMessages)) {
      expect(component.formControlErrorMessages[controlName]).toBe(message);
      expect(component.formErrorSummaryMessage).toContainEqual({ fieldId: controlName, message });
      expect(fixture.nativeElement.querySelector(`#${controlName}-error-message`)?.textContent).toContain(message);
    }
  });

  it('emits canonical alias rows and every raw control when valid Return is selected', () => {
    component.initialFormData = CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData;
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();

    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.validFormData,
      nestedFlow: false,
    });
  });

  it('emits Cancel through the shared link', () => {
    const cancelSpy = vi.spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('#cancelApplicantDetails a') as HTMLAnchorElement).click();

    expect(cancelSpy).toHaveBeenCalledOnce();
  });
});
