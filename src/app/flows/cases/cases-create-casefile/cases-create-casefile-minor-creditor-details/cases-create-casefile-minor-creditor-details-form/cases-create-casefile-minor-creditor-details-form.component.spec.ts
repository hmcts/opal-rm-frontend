import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileAddressComponent } from '../../components/cases-create-casefile-address/cases-create-casefile-address.component';
import { CasesCreateCasefileBankDetailsComponent } from '../../components/cases-create-casefile-bank-details/cases-create-casefile-bank-details.component';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from '../constants/cases-create-casefile-minor-creditor-field-names.constant';
import type { ICasesCreateCasefileMinorCreditorFormData } from '../interfaces/cases-create-casefile-minor-creditor-form-data.interface';
import { toMinorCreditorFormData } from '../utils/cases-create-casefile-minor-creditor-mapper';
import { CasesCreateCasefileMinorCreditorDetailsFormComponent } from './cases-create-casefile-minor-creditor-details-form.component';

describe('CasesCreateCasefileMinorCreditorDetailsFormComponent', () => {
  const countries = [{ name: 'United Kingdom', value: 826 }];

  const render = (initialFormData = toMinorCreditorFormData(null)) => {
    const fixture = TestBed.createComponent(CasesCreateCasefileMinorCreditorDetailsFormComponent);
    fixture.componentRef.setInput('initialFormData', initialFormData);
    fixture.componentRef.setInput('countryAutocompleteItems', countries);
    fixture.componentRef.setInput('countrySelectOptions', countries);
    fixture.detectChanges();
    return fixture;
  };

  const validOrganisationNone = (): ICasesCreateCasefileMinorCreditorFormData => ({
    ...toMinorCreditorFormData(null),
    [F.creditorType]: 'organisation',
    [F.organisationName]: 'Example creditor',
    [F.addressLine1]: '1 Test Street',
    [F.countryId]: 826,
    [F.bankType]: 'none',
  });

  const submit = (fixture: ReturnType<typeof render>): void => {
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileMinorCreditorDetailsFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    vi.restoreAllMocks();
  });

  it('renders the page structure and passes the canonical form contracts to the shared sections', () => {
    const fixture = render();
    const component = fixture.componentInstance;

    expect(fixture.nativeElement.querySelector('.govuk-caption-l').textContent.trim()).toBe('Order terms');
    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Minor creditor details');
    expect(fixture.nativeElement.querySelector(`#${F.creditorType}-individual`)).toBeInstanceOf(HTMLInputElement);
    expect(fixture.nativeElement.querySelector(`#${F.creditorType}-organisation`)).toBeInstanceOf(HTMLInputElement);

    const address = fixture.debugElement.query(By.directive(CasesCreateCasefileAddressComponent))
      .componentInstance as CasesCreateCasefileAddressComponent;
    expect(address.form).toBe(component.form);
    expect(address.fieldNames).toEqual({
      addressLine1: F.addressLine1,
      addressLine2: F.addressLine2,
      addressLine3: F.addressLine3,
      addressLine4: F.addressLine4,
      addressLine5: F.addressLine5,
      postalOrZipCode: F.postalOrZipCode,
      countryId: F.countryId,
    });
    expect(address.countryAutocompleteItems).toBe(countries);

    const bank = fixture.debugElement.query(By.directive(CasesCreateCasefileBankDetailsComponent))
      .componentInstance as CasesCreateCasefileBankDetailsComponent;
    expect(bank.form).toBe(component.form);
    expect(bank.layout).toEqual({
      headingMode: 'fieldset',
      nonUkFieldOrder: [
        'nonUkNameOnAccount',
        'nonUkAccountNumber',
        'nonUkPaymentReference',
        'nonUkBicSwiftCode',
        'nonUkIban',
        'nonUkBankName',
        'nonUkBranchSortCode',
      ],
    });
    expect(bank.ukBankConditionalId).toBe('create_casefile_minor_creditor_uk_bank');
    expect(bank.nonUkBankConditionalId).toBe('create_casefile_minor_creditor_non_uk_bank');
  });

  it('shows the three top-level errors in rendered order and does not submit an empty form', () => {
    const fixture = render();
    const emitted = vi.spyOn(fixture.componentInstance['formSubmit'], 'emit');

    submit(fixture);

    expect(emitted).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Select minor creditor type');
    expect(fixture.nativeElement.textContent).toContain('Select a country');
    expect(fixture.nativeElement.textContent).toContain('Select an option');
    expect(fixture.componentInstance.formErrorSummaryMessage.map(({ fieldId }) => fieldId)).toEqual([
      F.creditorType,
      F.addressLine1,
      F.countryId,
      F.bankType,
    ]);
  });

  it('focuses the first radio or visible field from every error-summary link', async () => {
    const fixture = render();
    submit(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll(
      '.govuk-error-summary__list a',
    ) as NodeListOf<HTMLAnchorElement>;

    links[0].click();
    expect(document.activeElement?.id).toBe(`${F.creditorType}-individual`);
    links[1].click();
    expect(document.activeElement?.id).toBe(F.addressLine1);
    links[2].click();
    expect(document.activeElement?.id).toBe(`${F.countryId}-autocomplete`);
    links[3].click();
    expect(document.activeElement?.id).toBe(`${F.bankType}-uk`);
  });

  it('renders only the selected identity branch and clears its values and errors when type changes', () => {
    const fixture = render({
      ...validOrganisationNone(),
      [F.creditorType]: 'individual',
      [F.organisationName]: null,
      [F.firstNames]: 'Example',
      [F.lastName]: '',
    });
    const component = fixture.componentInstance;

    submit(fixture);
    expect(fixture.nativeElement.querySelector(`#${F.firstNames}`)).toBeInstanceOf(HTMLInputElement);
    expect(fixture.nativeElement.querySelector(`#${F.organisationName}`)).toBeNull();
    expect(component.formControlErrorMessages[F.lastName]).toBe('Enter minor creditor last name');

    (fixture.nativeElement.querySelector(`#${F.creditorType}-organisation`) as HTMLInputElement).click();
    fixture.detectChanges();

    expect(component.form.controls[F.firstNames].value).toBeNull();
    expect(component.form.controls[F.firstNames].disabled).toBe(true);
    expect(component.formControlErrorMessages[F.lastName]).toBeNull();
    expect(component.formErrorSummaryMessage.some(({ fieldId }) => fieldId === F.lastName)).toBe(false);
    expect(fixture.nativeElement.querySelector(`#${F.firstNames}`)).toBeNull();
    expect(fixture.nativeElement.querySelector(`#${F.organisationName}`)).toBeInstanceOf(HTMLInputElement);
  });

  it.each([
    ['uk', F.ukNameOnAccount, 'Enter name on account'],
    ['non-uk', F.nonUkNameOnAccount, 'Enter name on account'],
  ] as const)('validates the selected %s bank branch', (bankType, requiredField, expectedError) => {
    const fixture = render({ ...validOrganisationNone(), [F.bankType]: bankType });

    submit(fixture);

    expect(fixture.componentInstance.formControlErrorMessages[requiredField]).toBe(expectedError);
    expect(fixture.nativeElement.querySelector(`#${requiredField}`)).toBeInstanceOf(HTMLInputElement);
  });

  it('clears deselected bank values and errors while preserving identity and address', () => {
    const fixture = render({
      ...validOrganisationNone(),
      [F.bankType]: 'uk',
      [F.ukNameOnAccount]: 'Example creditor',
      [F.ukSortCode]: '001122',
      [F.ukAccountNumber]: '00112233',
      [F.ukPaymentReference]: '',
    });
    const component = fixture.componentInstance;
    submit(fixture);
    expect(component.formControlErrorMessages[F.ukPaymentReference]).toBe('Enter UK bank account payment reference');

    component.form.controls[F.bankType].setValue('none');
    fixture.detectChanges();

    expect(component.form.controls[F.ukNameOnAccount].value).toBeNull();
    expect(component.form.controls[F.ukNameOnAccount].disabled).toBe(true);
    expect(component.formControlErrorMessages[F.ukPaymentReference]).toBeNull();
    expect(component.form.controls[F.organisationName].value).toBe('Example creditor');
    expect(component.form.controls[F.addressLine1].value).toBe('1 Test Street');
    expect((fixture.nativeElement.querySelector(`#${F.ukNameOnAccount}`) as HTMLInputElement).disabled).toBe(true);
    expect((fixture.nativeElement.querySelector(`#${F.nonUkNameOnAccount}`) as HTMLInputElement).disabled).toBe(true);
  });

  it('restores saved selected branches before first render without clearing them', () => {
    const fixture = render({
      ...validOrganisationNone(),
      [F.creditorType]: 'individual',
      [F.organisationName]: null,
      [F.title]: 'Mx',
      [F.firstNames]: 'Alex',
      [F.lastName]: 'Example',
      [F.bankType]: 'non-uk',
      [F.nonUkNameOnAccount]: 'Alex Example',
      [F.nonUkPaymentReference]: 'REF001',
      [F.nonUkIban]: 'GB00TEST',
    });

    expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
      [F.creditorType]: 'individual',
      [F.firstNames]: 'Alex',
      [F.lastName]: 'Example',
      [F.bankType]: 'non-uk',
      [F.nonUkNameOnAccount]: 'Alex Example',
      [F.nonUkPaymentReference]: 'REF001',
      [F.nonUkIban]: 'GB00TEST',
    });
    expect((fixture.nativeElement.querySelector(`#${F.firstNames}`) as HTMLInputElement).value).toBe('Alex');
    expect((fixture.nativeElement.querySelector(`#${F.nonUkIban}`) as HTMLInputElement).value).toBe('GB00TEST');
    expect(fixture.componentInstance.form.pristine).toBe(true);
  });

  it('keeps entered values after an invalid submission', () => {
    const fixture = render();
    fixture.componentInstance.form.controls[F.creditorType].setValue('organisation');
    fixture.detectChanges();
    fixture.componentInstance.form.controls[F.organisationName].setValue('Typed creditor');

    submit(fixture);

    expect((fixture.nativeElement.querySelector(`#${F.organisationName}`) as HTMLInputElement).value).toBe(
      'Typed creditor',
    );
  });

  it('emits complete raw form data with nestedFlow false for a valid form', () => {
    const fixture = render(validOrganisationNone());
    const emitted = vi.spyOn(fixture.componentInstance['formSubmit'], 'emit');

    submit(fixture);

    expect(emitted).toHaveBeenCalledWith({ formData: validOrganisationNone(), nestedFlow: false });
  });

  it('rebases the dirty baseline after accepted data and reports later edits as unsaved', () => {
    const fixture = render(validOrganisationNone());
    const unsaved = vi.spyOn(fixture.componentInstance['unsavedChanges'], 'emit');

    fixture.componentInstance.form.controls[F.organisationName].setValue('Changed before save');
    expect(unsaved).toHaveBeenLastCalledWith(true);

    fixture.componentInstance.acceptSavedData({
      ...validOrganisationNone(),
      [F.organisationName]: 'Changed before save',
    });
    expect(unsaved).toHaveBeenLastCalledWith(false);
    expect(fixture.componentInstance.form.pristine).toBe(true);

    fixture.componentInstance.form.controls[F.organisationName].setValue('Changed after save');
    expect(unsaved).toHaveBeenLastCalledWith(true);
  });

  it('keeps the form dirty after a successful submission proposal until the parent accepts it', () => {
    const fixture = render(validOrganisationNone());
    const unsaved = vi.spyOn(fixture.componentInstance['unsavedChanges'], 'emit');
    fixture.componentInstance.form.controls[F.organisationName].setValue('Changed creditor');

    submit(fixture);
    fixture.componentInstance.form.controls[F.addressLine1].setValue('2 Test Street');

    expect(unsaved).toHaveBeenLastCalledWith(true);
  });

  it('emits cancel without mutating the form', () => {
    const fixture = render(validOrganisationNone());
    const emitted = vi.spyOn(fixture.componentInstance.cancel, 'emit');

    (fixture.nativeElement.querySelector('#create_casefile_minor_creditor_cancel a') as HTMLAnchorElement).click();

    expect(emitted).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.form.getRawValue()).toEqual(validOrganisationNone());
  });
});
