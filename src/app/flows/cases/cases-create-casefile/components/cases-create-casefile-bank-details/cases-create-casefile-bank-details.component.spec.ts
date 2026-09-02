import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS } from '../../constants/cases-create-casefile-applicant-bank-options.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import { CasesCreateCasefileBankDetailsComponent } from './cases-create-casefile-bank-details.component';

describe('CasesCreateCasefileBankDetailsComponent', () => {
  const fieldNames = {
    bankType: 'party_bank_type',
    ukNameOnAccount: 'party_uk_bank_name_on_account',
    ukSortCode: 'party_uk_bank_sort_code',
    ukAccountNumber: 'party_uk_bank_account_number',
    ukPaymentReference: 'party_uk_bank_payment_reference',
    nonUkNameOnAccount: 'party_non_uk_bank_name_on_account',
    nonUkAccountNumber: 'party_non_uk_bank_account_number',
    nonUkPaymentReference: 'party_non_uk_bank_payment_reference',
    nonUkBicSwiftCode: 'party_non_uk_bank_bic_swift_code',
    nonUkIban: 'party_non_uk_bank_iban',
    nonUkBankName: 'party_non_uk_bank_name',
    nonUkBranchSortCode: 'party_non_uk_bank_branch_sort_code',
  } as const;
  const ukConditionalId = 'partyUkBankConditional';
  const nonUkConditionalId = 'partyNonUkBankConditional';
  const individualNonUkFieldOrder = [
    'nonUkNameOnAccount',
    'nonUkAccountNumber',
    'nonUkPaymentReference',
    'nonUkBicSwiftCode',
    'nonUkIban',
    'nonUkBankName',
    'nonUkBranchSortCode',
  ] as const;
  const organisationNonUkFieldOrder = [
    'nonUkNameOnAccount',
    'nonUkBicSwiftCode',
    'nonUkIban',
    'nonUkPaymentReference',
    'nonUkBankName',
    'nonUkBranchSortCode',
    'nonUkAccountNumber',
  ] as const;
  const errors = Object.fromEntries(Object.values(fieldNames).map((fieldName) => [fieldName, `${fieldName} error`]));

  let fixture: ComponentFixture<CasesCreateCasefileBankDetailsComponent>;
  let component: CasesCreateCasefileBankDetailsComponent;
  let form: FormGroup;

  const configureComponent = (
    headingMode: 'heading' | 'fieldset' = 'heading',
    nonUkFieldOrder: typeof individualNonUkFieldOrder | typeof organisationNonUkFieldOrder = individualNonUkFieldOrder,
  ): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileBankDetailsComponent);
    component = fixture.componentInstance;
    component.form = form;
    component.formControlErrorMessages = errors;
    component.fieldNames = fieldNames;
    component.bankOptions = CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS;
    component.bankTypes = CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES;
    component.ukBankConditionalId = ukConditionalId;
    component.nonUkBankConditionalId = nonUkConditionalId;
    component.layout = { headingMode, nonUkFieldOrder };
  };

  const renderedTextInputs = (): GovukTextInputComponent[] =>
    fixture.debugElement
      .queryAll(By.directive(GovukTextInputComponent))
      .map((debugElement) => debugElement.componentInstance as GovukTextInputComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileBankDetailsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    form = new FormGroup(
      Object.fromEntries(
        Object.values(fieldNames).map((fieldName) => [
          fieldName,
          fieldName === fieldNames.bankType ? new FormControl(null) : new FormControl({ value: null, disabled: true }),
        ]),
      ),
    );
    configureComponent();
  });

  it('renders the exact radio values, IDs, names and visible or hidden descriptions', () => {
    fixture.detectChanges();

    const bankFieldset = fixture.nativeElement.querySelector(`#${fieldNames.bankType}`) as HTMLFieldSetElement;
    const radios = Array.from(bankFieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(radios.map(({ id, name, value }) => ({ id, name, value }))).toEqual([
      { id: `${fieldNames.bankType}-uk`, name: fieldNames.bankType, value: 'uk' },
      { id: `${fieldNames.bankType}-non-uk`, name: fieldNames.bankType, value: 'non-uk' },
      { id: `${fieldNames.bankType}-none`, name: fieldNames.bankType, value: 'none' },
    ]);
    expect(
      Array.from(bankFieldset.querySelectorAll('.govuk-radios__label')).map((label) => label.textContent?.trim()),
    ).toEqual(['UK bank account', 'Non-UK bank account', 'None or not applicable']);

    expect(radios[0].getAttribute('aria-controls')).toBe(ukConditionalId);
    expect(radios[0].getAttribute('aria-describedby')).toBe(`${fieldNames.bankType}-uk-description`);
    expect(radios[1].getAttribute('aria-controls')).toBe(nonUkConditionalId);
    expect(radios[1].getAttribute('aria-describedby')).toBe(`${fieldNames.bankType}-non-uk-description`);
    expect(radios[2].hasAttribute('aria-controls')).toBe(false);
    expect(radios[2].hasAttribute('aria-describedby')).toBe(false);
    expect(fixture.nativeElement.querySelector(`#${fieldNames.bankType}-uk-description`).textContent?.trim()).toBe(
      'Selecting UK bank account reveals the UK bank details fields.',
    );
    expect(fixture.nativeElement.querySelector(`#${fieldNames.bankType}-non-uk-description`).textContent?.trim()).toBe(
      'Selecting Non-UK bank account reveals the non-UK bank details fields.',
    );
    expect(
      fixture.nativeElement.querySelectorAll(`#${fieldNames.bankType}-uk-description.govuk-visually-hidden`),
    ).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelectorAll(`#${fieldNames.bankType}-non-uk-description.govuk-visually-hidden`),
    ).toHaveLength(1);
  });

  it('binds the bank error and every field to the matching parent control and error', () => {
    fixture.detectChanges();

    const bankFieldset = fixture.nativeElement.querySelector(`#${fieldNames.bankType}`) as HTMLFieldSetElement;
    expect(bankFieldset.getAttribute('aria-describedby')).toBe(`${fieldNames.bankType}-error-message`);
    expect(fixture.nativeElement.querySelector(`#${fieldNames.bankType}-error-message`).textContent).toContain(
      errors[fieldNames.bankType],
    );

    for (const input of renderedTextInputs()) {
      expect(input.getControl).toBe(form.get(input.inputId));
      expect(input.errors).toBe(errors[input.inputId]);
      expect(input.inputName).toBe(input.inputId);
    }
  });

  it.each([
    ['heading', individualNonUkFieldOrder],
    ['fieldset', organisationNonUkFieldOrder],
  ] as const)('renders the %s layout with exact UK and configured non-UK control order', (headingMode, order) => {
    configureComponent(headingMode, order);
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h2') as HTMLHeadingElement;
    expect(heading.textContent?.trim()).toBe('Bank details');
    expect(Boolean(heading.closest('legend'))).toBe(headingMode === 'fieldset');

    const inputIds = renderedTextInputs().map(({ inputId }) => inputId);
    expect(inputIds.slice(0, 4)).toEqual([
      fieldNames.ukNameOnAccount,
      fieldNames.ukSortCode,
      fieldNames.ukAccountNumber,
      fieldNames.ukPaymentReference,
    ]);
    expect(inputIds.slice(4)).toEqual(order.map((fieldName) => fieldNames[fieldName]));

    expect((fixture.nativeElement.querySelector(`#${ukConditionalId}`) as HTMLElement).classList).toContain(
      'govuk-radios__conditional--hidden',
    );
    expect((fixture.nativeElement.querySelector(`#${nonUkConditionalId}`) as HTMLElement).classList).toContain(
      'govuk-radios__conditional--hidden',
    );
    (
      fixture.nativeElement.querySelector(
        `#${fieldNames.bankType}-${CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK}`,
      ) as HTMLInputElement
    ).click();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector(`#${ukConditionalId}`) as HTMLElement).classList).toContain(
      'govuk-radios__conditional--hidden',
    );
    expect((fixture.nativeElement.querySelector(`#${nonUkConditionalId}`) as HTMLElement).classList).not.toContain(
      'govuk-radios__conditional--hidden',
    );
  });
});
