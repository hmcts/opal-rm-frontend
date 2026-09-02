import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../mocks/cases-create-casefile-applicant-organisation.mock';
import { CasesCreateCasefileApplicantOrganisationFormComponent } from './cases-create-casefile-applicant-organisation-form.component';

describe('CasesCreateCasefileApplicantOrganisationFormComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileApplicantOrganisationFormComponent>;
  let component: CasesCreateCasefileApplicantOrganisationFormComponent;

  const emptyFormData = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.emptyFormData;
  const ukBankControlNames = [
    'applicant_uk_bank_name_on_account',
    'applicant_uk_bank_sort_code',
    'applicant_uk_bank_account_number',
    'applicant_uk_bank_payment_reference',
  ] as const;
  const nonUkBankControlNames = [
    'applicant_non_uk_bank_name_on_account',
    'applicant_non_uk_bank_bic_swift_code',
    'applicant_non_uk_bank_iban',
    'applicant_non_uk_bank_payment_reference',
    'applicant_non_uk_bank_name',
    'applicant_non_uk_bank_branch_sort_code',
    'applicant_non_uk_bank_account_number',
  ] as const;
  const bankControlNames = [...ukBankControlNames, ...nonUkBankControlNames] as const;

  const expectedFieldErrors = {
    applicant_organisation_name: {
      required: { message: 'Enter organisation name', priority: 1 },
      maxlength: { message: 'Organisation name must be 80 characters or fewer', priority: 3 },
    },
    applicant_foreign_authority_reference: {
      required: { message: 'Enter a foreign authority reference number', priority: 1 },
      maxlength: { message: 'Foreign authority reference must be 40 characters or fewer', priority: 3 },
    },
    applicant_main_email_address: {
      emailPattern: {
        message: 'Enter an email address in the correct format, like name@example.com',
        priority: 2,
      },
      maxlength: { message: 'Main email address must be 76 characters or fewer', priority: 3 },
    },
    applicant_other_email_address: {
      emailPattern: {
        message: 'Enter an email address in the correct format, like name@example.com',
        priority: 2,
      },
      maxlength: { message: 'Other email address must be 76 characters or fewer', priority: 3 },
    },
    applicant_main_telephone_number: {
      maxlength: { message: 'Main telephone number must be 35 characters or fewer', priority: 1 },
    },
    applicant_other_telephone_number: {
      maxlength: { message: 'Other telephone number must be 35 characters or fewer', priority: 1 },
    },
    applicant_address_line_1: {
      required: { message: 'Enter an address', priority: 1 },
      maxlength: { message: 'Address line 1 must be 30 characters or fewer', priority: 3 },
    },
    applicant_address_line_2: {
      maxlength: { message: 'Address line 2 must be 30 characters or fewer', priority: 1 },
    },
    applicant_address_line_3: {
      maxlength: { message: 'Address line 3 must be 30 characters or fewer', priority: 1 },
    },
    applicant_address_line_4: {
      maxlength: { message: 'Address line 4 must be 30 characters or fewer', priority: 1 },
    },
    applicant_address_line_5: {
      maxlength: { message: 'Address line 5 must be 30 characters or fewer', priority: 1 },
    },
    applicant_postal_or_zip_code: {
      maxlength: { message: 'Postal or zip code must be 10 characters or fewer', priority: 1 },
    },
    applicant_country_id: {
      required: { message: 'Select a country', priority: 1 },
    },
    applicant_bank_type: {
      required: { message: 'Select an option', priority: 1 },
    },
    applicant_uk_bank_name_on_account: {
      required: { message: 'Enter name on account', priority: 1 },
    },
    applicant_uk_bank_sort_code: {
      required: { message: 'Enter sort code', priority: 1 },
      ukSortCodePattern: { message: 'Enter correct sort code', priority: 2 },
      ukSortCodeLength: { message: 'Sort code must only contain 6 numbers', priority: 3 },
    },
    applicant_uk_bank_account_number: {
      required: { message: 'Enter account number', priority: 1 },
      ukAccountNumberPattern: { message: 'Account number must only contain numbers', priority: 2 },
      ukAccountNumberLength: { message: 'Account number must be between 6 and 8 numbers', priority: 3 },
    },
    applicant_uk_bank_payment_reference: {
      required: { message: 'Enter UK bank account payment reference', priority: 1 },
    },
    applicant_non_uk_bank_name_on_account: {
      required: { message: 'Enter name on account', priority: 1 },
    },
    applicant_non_uk_bank_bic_swift_code: {
      internationalIdentifierRequired: {
        message: 'Enter either BIC or SWIFT code or IBAN number',
        priority: 2,
      },
      internationalIdentifierPattern: {
        message: 'Enter correct BIC or SWIFT code or IBAN number',
        priority: 2,
      },
    },
    applicant_non_uk_bank_iban: {
      internationalIdentifierPattern: {
        message: 'Enter correct BIC or SWIFT code or IBAN number',
        priority: 2,
      },
    },
    applicant_non_uk_bank_payment_reference: {},
    applicant_non_uk_bank_name: {},
    applicant_non_uk_bank_branch_sort_code: {
      branchSortCodePattern: { message: 'Enter correct branch or sort code', priority: 2 },
      branchSortCodeLength: { message: 'Branch or sort code must be 12 numbers or fewer', priority: 3 },
    },
    applicant_non_uk_bank_account_number: {
      maxlength: { message: 'Account number must be 20 characters or fewer', priority: 1 },
    },
  } as const;

  const createComponent = (): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileApplicantOrganisationFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = emptyFormData;
    component.countryAutocompleteItems = [
      { name: 'United Kingdom', value: 826 },
      { name: 'France', value: 250 },
    ];
  };

  const setRenderedInputValue = (inputId: string, value: string): HTMLInputElement => {
    const input = fixture.nativeElement.querySelector(`#${inputId}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return input;
  };

  const selectBankType = (bankType: string): void => {
    (fixture.nativeElement.querySelector(`#applicant_bank_type-${bankType}`) as HTMLInputElement).click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileApplicantOrganisationFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    createComponent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('builds every typed control with empty core state and disabled bank branches', () => {
    fixture.detectChanges();

    expect(Object.keys(component.form.controls)).toEqual(Object.keys(emptyFormData));
    expect(component.form.getRawValue()).toEqual(emptyFormData);
    expect(component.form.controls.applicant_organisation_name.hasError('required')).toBe(true);
    expect(component.form.controls.applicant_foreign_authority_reference.hasError('required')).toBe(true);
    expect(component.form.controls.applicant_address_line_1.hasError('required')).toBe(true);
    expect(component.form.controls.applicant_country_id.hasError('required')).toBe(true);
    expect(component.form.controls.applicant_bank_type.hasError('required')).toBe(true);
    for (const controlName of bankControlNames) {
      expect(component.form.controls[controlName].disabled).toBe(true);
      expect(component.form.controls[controlName].validator).toBeNull();
    }
    expect(component.form.pristine).toBe(true);
  });

  it('renders the complete control set in the approved DOM order', async () => {
    fixture.detectChanges();
    await vi.waitFor(() => {
      expect(fixture.nativeElement.querySelector('#applicant_country_id-autocomplete')).not.toBeNull();
    });

    const renderedControlIds = Array.from(
      fixture.nativeElement.querySelectorAll(
        'form input:not([type="hidden"]):not(:disabled), form button, form opal-lib-govuk-cancel-link',
      ),
    ).map((control) => (control as HTMLElement).id);
    expect(renderedControlIds).toEqual([
      'applicant_organisation_name',
      'applicant_foreign_authority_reference',
      'applicant_main_email_address',
      'applicant_other_email_address',
      'applicant_main_telephone_number',
      'applicant_other_telephone_number',
      'applicant_address_line_1',
      'applicant_address_line_2',
      'applicant_address_line_3',
      'applicant_address_line_4',
      'applicant_address_line_5',
      'applicant_postal_or_zip_code',
      'applicant_country_id-autocomplete',
      'applicant_bank_type-uk',
      'applicant_bank_type-non-uk',
      'applicant_bank_type-none',
      'returnToCaseDetails',
      'cancelApplicantDetails',
    ]);

    const headingElements = Array.from(
      fixture.nativeElement.querySelectorAll('h1, fieldset > legend h2') as NodeListOf<HTMLElement>,
    );
    expect(headingElements.map((element) => element.textContent?.trim())).toEqual([
      'Applicant details',
      'Contact details',
      'Address',
      'Bank details',
    ]);
    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
  });

  it('hydrates every Organisation, contact, address and selected bank value before first render', async () => {
    component.initialFormData = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNonUkFormData;

    fixture.detectChanges();
    await vi.waitFor(() => {
      expect(fixture.nativeElement.querySelector('#applicant_country_id-autocomplete')).not.toBeNull();
    });

    expect(component.form.getRawValue()).toEqual(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNonUkFormData);
    for (const [controlName, value] of Object.entries(
      CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNonUkFormData,
    )) {
      expect(component.form.get(controlName)?.value).toBe(value);
    }
    expect((fixture.nativeElement.querySelector('#applicant_organisation_name') as HTMLInputElement).value).toBe(
      'Example Organisation',
    );
    expect((fixture.nativeElement.querySelector('#applicant_country_id-autocomplete') as HTMLInputElement).value).toBe(
      'United Kingdom',
    );
    expect((fixture.nativeElement.querySelector('#applicant_bank_type-non-uk') as HTMLInputElement).checked).toBe(true);
    expect(component.form.pristine).toBe(true);
  });

  it('enforces trimmed required, maximum-length and email validation while allowing telephone punctuation and letters', () => {
    fixture.detectChanges();

    expect(component['fieldErrors']).toEqual(expectedFieldErrors);
    component.form.controls.applicant_organisation_name.setValue('   ');
    component.form.controls.applicant_foreign_authority_reference.setValue('\t');
    component.form.controls.applicant_address_line_1.setValue('\n');
    expect(component.form.controls.applicant_organisation_name.hasError('required')).toBe(true);
    expect(component.form.controls.applicant_foreign_authority_reference.hasError('required')).toBe(true);
    expect(component.form.controls.applicant_address_line_1.hasError('required')).toBe(true);

    const maximumLengths = {
      applicant_organisation_name: 80,
      applicant_foreign_authority_reference: 40,
      applicant_main_email_address: 76,
      applicant_other_email_address: 76,
      applicant_main_telephone_number: 35,
      applicant_other_telephone_number: 35,
      applicant_address_line_1: 30,
      applicant_address_line_2: 30,
      applicant_address_line_3: 30,
      applicant_address_line_4: 30,
      applicant_address_line_5: 30,
      applicant_postal_or_zip_code: 10,
    } as const;
    for (const controlName of Object.keys(maximumLengths) as Array<keyof typeof maximumLengths>) {
      component.form.controls[controlName].setValue('X'.repeat(maximumLengths[controlName] + 1));
      expect(component.form.controls[controlName].hasError('maxlength')).toBe(true);
    }

    component.form.controls.applicant_main_email_address.setValue('invalid');
    component.form.controls.applicant_other_email_address.setValue('also-invalid');
    expect(component.form.controls.applicant_main_email_address.hasError('emailPattern')).toBe(true);
    expect(component.form.controls.applicant_other_email_address.hasError('emailPattern')).toBe(true);
    component.form.controls.applicant_main_telephone_number.setValue('International + EXT x12');
    component.form.controls.applicant_other_telephone_number.setValue('(020) CALL-US');
    expect(component.form.controls.applicant_main_telephone_number.errors).toBeNull();
    expect(component.form.controls.applicant_other_telephone_number.errors).toBeNull();
  });

  it('accepts only Country IDs present in countryAutocompleteItems', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNoneFormData,
      applicant_country_id: 999,
    };
    fixture.detectChanges();

    expect(component.form.controls.applicant_country_id.value).toBe(999);
    expect(component.form.controls.applicant_country_id.hasError('required')).toBe(true);
    component.form.controls.applicant_country_id.setValue(250);
    expect(component.form.controls.applicant_country_id.errors).toBeNull();
    component.form.controls.applicant_country_id.setValue(null);
    expect(component.form.controls.applicant_country_id.hasError('required')).toBe(true);
  });

  it('renders one required bank radio group with the three shared options and accessible conditional associations', () => {
    fixture.detectChanges();

    const bankFieldset = fixture.nativeElement.querySelector('#applicant_bank_type') as HTMLFieldSetElement;
    const radios = Array.from(bankFieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    const labels = Array.from(bankFieldset.querySelectorAll('.govuk-radios__label')).map((label) =>
      label.textContent?.trim(),
    );
    expect(radios.map((radio) => radio.value)).toEqual(['uk', 'non-uk', 'none']);
    expect(labels).toEqual(['UK bank account', 'Non-UK bank account', 'None or not applicable']);
    expect(bankFieldset.querySelector('.govuk-fieldset__legend')?.textContent?.trim()).toBe('Select bank account type');

    const revealOptions = [
      {
        bankType: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
        conditionalId: 'applicantUkBankConditional',
        description: 'Selecting UK bank account reveals the UK bank details fields.',
      },
      {
        bankType: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
        conditionalId: 'applicantNonUkBankConditional',
        description: 'Selecting Non-UK bank account reveals the non-UK bank details fields.',
      },
    ] as const;
    for (const { bankType, conditionalId, description } of revealOptions) {
      const radio = fixture.nativeElement.querySelector(`#applicant_bank_type-${bankType}`) as HTMLInputElement;
      const conditional = fixture.nativeElement.querySelector(`#${conditionalId}`) as HTMLDivElement;
      const descriptionId = `applicant_bank_type-${bankType}-description`;
      expect(radio.getAttribute('aria-controls')).toBe(conditionalId);
      expect(radio.getAttribute('aria-describedby')).toBe(descriptionId);
      expect(radio.hasAttribute('aria-expanded')).toBe(false);
      expect(radio.hasAttribute('tabindex')).toBe(false);
      expect(fixture.nativeElement.querySelector(`#${descriptionId}`).textContent?.trim()).toBe(description);
      expect(radio.closest('.govuk-radios__item')?.nextElementSibling).toBe(conditional);
      expect(conditional.classList.contains('govuk-radios__conditional--hidden')).toBe(true);
    }

    const noneRadio = fixture.nativeElement.querySelector('#applicant_bank_type-none') as HTMLInputElement;
    expect(noneRadio.hasAttribute('aria-controls')).toBe(false);
    expect(noneRadio.hasAttribute('aria-describedby')).toBe(false);
    expect(noneRadio.hasAttribute('aria-expanded')).toBe(false);
    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();
    expect(component.form.controls.applicant_bank_type.hasError('required')).toBe(true);
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'applicant_bank_type',
      message: 'Select an option',
    });
    expect(bankFieldset.getAttribute('aria-describedby')).toBe('applicant_bank_type-error-message');
  });

  it('enables and validates only the UK branch', () => {
    component.initialFormData = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNoneFormData;
    fixture.detectChanges();

    selectBankType(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK);

    for (const controlName of ukBankControlNames) {
      expect(component.form.controls[controlName].enabled).toBe(true);
      expect(component.form.controls[controlName].hasError('required')).toBe(true);
      expect((fixture.nativeElement.querySelector(`#${controlName}`) as HTMLInputElement).disabled).toBe(false);
    }
    for (const controlName of nonUkBankControlNames) {
      expect(component.form.controls[controlName].disabled).toBe(true);
      expect((fixture.nativeElement.querySelector(`#${controlName}`) as HTMLInputElement).disabled).toBe(true);
    }
    const ukReveal = fixture.nativeElement.querySelector('#applicantUkBankConditional') as HTMLDivElement;
    expect(Array.from(ukReveal.querySelectorAll('input')).map((input) => input.id)).toEqual(ukBankControlNames);
    expect(ukReveal.classList.contains('govuk-radios__conditional--hidden')).toBe(false);

    component.form.controls.applicant_uk_bank_name_on_account.setValue('Account holder');
    component.form.controls.applicant_uk_bank_payment_reference.setValue('PAY-001');
    component.form.controls.applicant_uk_bank_sort_code.setValue('11 22 33');
    expect(component.form.controls.applicant_uk_bank_sort_code.hasError('ukSortCodePattern')).toBe(true);
    component.form.controls.applicant_uk_bank_sort_code.setValue('12345');
    expect(component.form.controls.applicant_uk_bank_sort_code.hasError('ukSortCodeLength')).toBe(true);
    component.form.controls.applicant_uk_bank_account_number.setValue('12345A');
    expect(component.form.controls.applicant_uk_bank_account_number.hasError('ukAccountNumberPattern')).toBe(true);
    component.form.controls.applicant_uk_bank_account_number.setValue('12345');
    expect(component.form.controls.applicant_uk_bank_account_number.hasError('ukAccountNumberLength')).toBe(true);

    component.form.controls.applicant_uk_bank_sort_code.setValue('11-22-33');
    component.form.controls.applicant_uk_bank_account_number.setValue('123456');
    expect(component.form.controls.applicant_uk_bank_sort_code.errors).toBeNull();
    expect(component.form.controls.applicant_uk_bank_account_number.errors).toBeNull();
    component.form.controls.applicant_uk_bank_sort_code.setValue('112233');
    component.form.controls.applicant_uk_bank_account_number.setValue('12345678');
    expect(component.form.valid).toBe(true);
  });

  it('enables and validates only the non-UK branch by BIC or IBAN', () => {
    component.initialFormData = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNoneFormData;
    fixture.detectChanges();

    selectBankType(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK);

    for (const controlName of ukBankControlNames) {
      expect(component.form.controls[controlName].disabled).toBe(true);
    }
    for (const controlName of nonUkBankControlNames) {
      expect(component.form.controls[controlName].enabled).toBe(true);
    }
    const nonUkReveal = fixture.nativeElement.querySelector('#applicantNonUkBankConditional') as HTMLDivElement;
    expect(Array.from(nonUkReveal.querySelectorAll('input')).map((input) => input.id)).toEqual(nonUkBankControlNames);
    expect(nonUkReveal.classList.contains('govuk-radios__conditional--hidden')).toBe(false);

    const nameOnAccount = component.form.controls.applicant_non_uk_bank_name_on_account;
    const bic = component.form.controls.applicant_non_uk_bank_bic_swift_code;
    const iban = component.form.controls.applicant_non_uk_bank_iban;
    const branchCode = component.form.controls.applicant_non_uk_bank_branch_sort_code;
    const accountNumber = component.form.controls.applicant_non_uk_bank_account_number;
    expect(nameOnAccount.hasError('required')).toBe(true);
    expect(bic.hasError('internationalIdentifierRequired')).toBe(true);
    expect(component.form.controls.applicant_non_uk_bank_payment_reference.errors).toBeNull();
    expect(component.form.controls.applicant_non_uk_bank_name.errors).toBeNull();

    nameOnAccount.setValue('Account holder');
    bic.setValue('EXAMGB2L');
    expect(bic.errors).toBeNull();
    bic.setValue(null);
    iban.setValue('GB29NWBK60161331926819');
    expect(iban.errors).toBeNull();
    expect(bic.errors).toBeNull();
    branchCode.setValue('123A');
    expect(branchCode.hasError('branchSortCodePattern')).toBe(true);
    branchCode.setValue('1'.repeat(13));
    expect(branchCode.hasError('branchSortCodeLength')).toBe(true);
    branchCode.setValue('123456');
    accountNumber.setValue('A'.repeat(21));
    expect(accountNumber.hasError('maxlength')).toBe(true);
    accountNumber.setValue('ACCOUNT-123');
    expect(component.form.valid).toBe(true);
  });

  it('clears disabled branch values, validators, inline errors and summary entries when bank type changes', () => {
    component.initialFormData = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData;
    fixture.detectChanges();
    component.form.controls.applicant_uk_bank_sort_code.setValue('invalid');
    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();
    expect(component.formControlErrorMessages['applicant_uk_bank_sort_code']).toBe('Enter correct sort code');
    expect(component.formErrorSummaryMessage).toContainEqual({
      fieldId: 'applicant_uk_bank_sort_code',
      message: 'Enter correct sort code',
    });
    expect(component.formErrors.some((error) => error.fieldId === 'applicant_uk_bank_sort_code')).toBe(true);

    selectBankType(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK);

    for (const controlName of ukBankControlNames) {
      const control = component.form.controls[controlName];
      expect(control.disabled).toBe(true);
      expect(control.value).toBeNull();
      expect(control.validator).toBeNull();
      expect(control.errors).toBeNull();
      expect(component.formControlErrorMessages[controlName]).toBeNull();
      expect((fixture.nativeElement.querySelector(`#${controlName}`) as HTMLInputElement).disabled).toBe(true);
    }
    expect(component.formErrorSummaryMessage.some((error) => error.fieldId.startsWith('applicant_uk_bank_'))).toBe(
      false,
    );
    expect(component.formErrors.some((error) => error.fieldId.startsWith('applicant_uk_bank_'))).toBe(false);

    component.form.controls.applicant_non_uk_bank_name_on_account.setValue('   ');
    component.form.controls.applicant_non_uk_bank_bic_swift_code.setValue('invalid');
    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();
    expect(component.formControlErrorMessages['applicant_non_uk_bank_name_on_account']).toBe('Enter name on account');
    expect(component.formErrorSummaryMessage.some((error) => error.fieldId.startsWith('applicant_non_uk_bank_'))).toBe(
      true,
    );
    expect(component.formErrors.some((error) => error.fieldId.startsWith('applicant_non_uk_bank_'))).toBe(true);

    selectBankType(CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE);

    for (const controlName of nonUkBankControlNames) {
      const control = component.form.controls[controlName];
      expect(control.disabled).toBe(true);
      expect(control.value).toBeNull();
      expect(control.validator).toBeNull();
      expect(control.errors).toBeNull();
      expect(component.formControlErrorMessages[controlName]).toBeNull();
      expect((fixture.nativeElement.querySelector(`#${controlName}`) as HTMLInputElement).disabled).toBe(true);
    }
    expect(component.formErrorSummaryMessage.some((error) => error.fieldId.startsWith('applicant_non_uk_bank_'))).toBe(
      false,
    );
    expect(component.formErrors.some((error) => error.fieldId.startsWith('applicant_non_uk_bank_'))).toBe(false);
    expect(component.form.valid).toBe(true);
  });

  it('restores the selected saved bank branch without marking the form dirty', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNonUkFormData,
      applicant_non_uk_bank_branch_sort_code: '123456',
    };
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('#applicant_bank_type-non-uk') as HTMLInputElement).checked).toBe(true);
    expect(component.form.controls.applicant_non_uk_bank_name_on_account.value).toBe(
      'Example Organisation International',
    );
    expect(component.form.controls.applicant_non_uk_bank_bic_swift_code.value).toBe('EXAMGB2L');
    expect(component.form.controls.applicant_non_uk_bank_iban.value).toBe('GB29NWBK60161331926819');
    for (const controlName of nonUkBankControlNames) {
      expect(component.form.controls[controlName].enabled).toBe(true);
    }
    for (const controlName of ukBankControlNames) {
      expect(component.form.controls[controlName].disabled).toBe(true);
    }
    expect(
      (fixture.nativeElement.querySelector('#applicantNonUkBankConditional') as HTMLElement).classList.contains(
        'govuk-radios__conditional--hidden',
      ),
    ).toBe(false);
    expect(component.form.valid).toBe(true);
    expect(component.form.pristine).toBe(true);
  });

  it('retains valid entered values, focuses the summary and links summary errors to controls after invalid Return', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    const enteredValues = {
      applicant_organisation_name: '   ',
      applicant_foreign_authority_reference: 'F'.repeat(41),
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
      { fieldId: 'applicant_organisation_name', message: 'Enter organisation name' },
      {
        fieldId: 'applicant_foreign_authority_reference',
        message: 'Foreign authority reference must be 40 characters or fewer',
      },
      {
        fieldId: 'applicant_main_email_address',
        message: 'Enter an email address in the correct format, like name@example.com',
      },
      { fieldId: 'applicant_address_line_1', message: 'Enter an address' },
      { fieldId: 'applicant_country_id', message: 'Select a country' },
      { fieldId: 'applicant_bank_type', message: 'Select an option' },
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
    expect(fixture.nativeElement.querySelector('#applicant_bank_type-error-message')?.textContent).toContain(
      'Select an option',
    );
    const summaryLinks = Array.from(
      fixture.nativeElement.querySelectorAll('.govuk-error-summary__list a') as NodeListOf<HTMLAnchorElement>,
    );
    expect(summaryLinks.map((link) => link.textContent?.trim())).toEqual(
      component.formErrorSummaryMessage.map((error) => error.message),
    );
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.govuk-error-summary'));
    summaryLinks[0]?.click();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#applicant_organisation_name'));
  });

  it('emits dirty-state changes, complete valid form data and Cancel exactly once', () => {
    component.initialFormData = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData;
    const unsavedChangesSpy = vi.spyOn(component['unsavedChanges'], 'emit');
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    const cancelSpy = vi.spyOn(component.cancel, 'emit');
    fixture.detectChanges();
    const organisationName = setRenderedInputValue('applicant_organisation_name', 'Updated Organisation');

    expect(organisationName.value).toBe('Updated Organisation');
    expect(component.form.dirty).toBe(true);
    expect(unsavedChangesSpy).toHaveBeenCalledTimes(1);
    expect(unsavedChangesSpy).toHaveBeenCalledWith(true);
    (fixture.nativeElement.querySelector('#returnToCaseDetails') as HTMLButtonElement).click();
    expect(formSubmitSpy).toHaveBeenCalledOnce();
    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: {
        ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
        applicant_organisation_name: 'Updated Organisation',
      },
      nestedFlow: false,
    });
    expect(unsavedChangesSpy).toHaveBeenCalledTimes(2);
    expect(unsavedChangesSpy).toHaveBeenLastCalledWith(false);

    const cancelHost = fixture.nativeElement.querySelector(
      'opal-lib-govuk-cancel-link#cancelApplicantDetails',
    ) as HTMLElement;
    expect(cancelHost.id).toBe('cancelApplicantDetails');
    (cancelHost.querySelector('a') as HTMLAnchorElement).click();
    expect(cancelSpy).toHaveBeenCalledOnce();
  });

  it('cleans up the IBAN-to-BIC revalidation subscription on destroy', () => {
    component.initialFormData = {
      ...CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validNonUkFormData,
      applicant_non_uk_bank_bic_swift_code: null,
      applicant_non_uk_bank_iban: null,
      applicant_non_uk_bank_branch_sort_code: null,
    };
    fixture.detectChanges();
    const bic = component.form.controls.applicant_non_uk_bank_bic_swift_code;
    const iban = component.form.controls.applicant_non_uk_bank_iban;
    const updateSpy = vi.spyOn(bic, 'updateValueAndValidity');

    iban.setValue('GB29NWBK60161331926819');
    expect(updateSpy).toHaveBeenCalled();
    updateSpy.mockClear();
    fixture.destroy();
    iban.setValue('GB82WEST12345698765432');

    expect(updateSpy).not.toHaveBeenCalled();
  });
});
