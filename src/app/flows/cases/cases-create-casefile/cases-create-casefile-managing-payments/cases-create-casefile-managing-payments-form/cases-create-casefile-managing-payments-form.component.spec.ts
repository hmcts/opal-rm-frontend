import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from '../../constants/cases-create-casefile-payment-arrangements.constant';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-managing-payments-field-names.constant';
import type { ICasesCreateCasefileManagingPaymentsFormData } from '../interfaces/cases-create-casefile-managing-payments-form-data.interface';
import { CasesCreateCasefileManagingPaymentsFormComponent } from './cases-create-casefile-managing-payments-form.component';

describe('CasesCreateCasefileManagingPaymentsFormComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileManagingPaymentsFormComponent>;
  let component: CasesCreateCasefileManagingPaymentsFormComponent;

  const createComponent = (
    initialFormData: ICasesCreateCasefileManagingPaymentsFormData = {
      [FIELD_NAMES.paymentArrangement]: null,
    },
  ): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileManagingPaymentsFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = initialFormData;
  };

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileManagingPaymentsFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    createComponent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('creates one required typed control with an empty default', () => {
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({ [FIELD_NAMES.paymentArrangement]: null });
    expect(component.form.controls[FIELD_NAMES.paymentArrangement].hasError('required')).toBe(true);
    expect(component.form.valid).toBe(false);
  });

  it('renders exact content, option order and Direct hint without excluded controls', () => {
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll(
        `#${FIELD_NAMES.paymentArrangement} .govuk-radios__label`,
      ) as NodeListOf<HTMLElement>,
    ).map((label) => label.textContent?.trim());
    const radios = Array.from(
      fixture.nativeElement.querySelectorAll(
        `input[name="${FIELD_NAMES.paymentArrangement}"]`,
      ) as NodeListOf<HTMLInputElement>,
    );
    const directRadio = fixture.nativeElement.querySelector(
      `#${FIELD_NAMES.paymentArrangement}-direct`,
    ) as HTMLInputElement;
    const directHint = fixture.nativeElement.querySelector(
      `#${FIELD_NAMES.paymentArrangement}-direct-item-hint`,
    ) as HTMLElement;

    expect(fixture.nativeElement.querySelector('h1')?.textContent.trim()).toBe('Managing payments');
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.paymentArrangement}`)?.tagName).toBe('FIELDSET');
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.paymentArrangement} legend`)?.textContent.trim()).toBe(
      'Select payment arrangement',
    );
    expect(labels).toEqual(['Payments via the court', 'Direct payments to creditors']);
    expect(radios.map((radio) => radio.value)).toEqual(['court', 'direct']);
    expect(directHint.textContent?.trim()).toBe('HMCTS will not collect payments for this case');
    expect(directRadio.getAttribute('aria-describedby')).toBe(directHint.id);
    expect(fixture.nativeElement.querySelector('#returnToCaseDetails')?.textContent.trim()).toBe(
      'Return to case details',
    );
    expect(fixture.nativeElement.querySelector('#cancelManagingPayments a')?.textContent.trim()).toBe('Cancel');
    expect(fixture.nativeElement.querySelector('.govuk-back-link')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('input[type="text"], input[name*="amount"], input[name*="rate"]'),
    ).toBeNull();
  });

  it('uses the canonical identifier for the group, radio name and error target', () => {
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    const radios = Array.from(
      fixture.nativeElement.querySelectorAll(
        `input[name="${FIELD_NAMES.paymentArrangement}"]`,
      ) as NodeListOf<HTMLInputElement>,
    );

    expect(radios).toHaveLength(2);
    expect(radios.map((radio) => radio.id)).toEqual([
      `${FIELD_NAMES.paymentArrangement}-court`,
      `${FIELD_NAMES.paymentArrangement}-direct`,
    ]);
    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: FIELD_NAMES.paymentArrangement, message: 'Choose payment arrangement' },
    ]);
  });

  it('shows the exact inline and summary error and focuses the summary', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(component.formControlErrorMessages).toMatchObject({
      [FIELD_NAMES.paymentArrangement]: 'Choose payment arrangement',
    });
    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: FIELD_NAMES.paymentArrangement, message: 'Choose payment arrangement' },
    ]);
    expect(
      fixture.nativeElement.querySelector(`#${FIELD_NAMES.paymentArrangement}-error-message`)?.textContent,
    ).toContain('Choose payment arrangement');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.govuk-error-summary'));
    expect(formSubmitSpy).not.toHaveBeenCalled();
  });

  it('links the summary error to the first radio', () => {
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.govuk-error-summary__list a') as HTMLAnchorElement).click();

    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector(`#${FIELD_NAMES.paymentArrangement}-court`),
    );
  });

  it('retains the choice entered after validation and submits that value', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector(`#${FIELD_NAMES.paymentArrangement}-direct`) as HTMLInputElement).click();
    fixture.detectChanges();

    expect(component.form.controls[FIELD_NAMES.paymentArrangement].value).toBe(
      CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
    );
    expect(
      (fixture.nativeElement.querySelector(`#${FIELD_NAMES.paymentArrangement}-direct`) as HTMLInputElement).checked,
    ).toBe(true);

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: {
        [FIELD_NAMES.paymentArrangement]: CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
      },
      nestedFlow: false,
    });
  });

  it.each([
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT,
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
  ] as const)('restores supplied initial value %s', (paymentArrangement) => {
    fixture.destroy();
    createComponent({ [FIELD_NAMES.paymentArrangement]: paymentArrangement });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({ [FIELD_NAMES.paymentArrangement]: paymentArrangement });
    expect(
      (
        fixture.nativeElement.querySelector(
          `#${FIELD_NAMES.paymentArrangement}-${paymentArrangement}`,
        ) as HTMLInputElement
      ).checked,
    ).toBe(true);
  });

  it.each([
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT,
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
  ] as const)('emits dirty state and validated non-null value %s', (paymentArrangement) => {
    const unsavedChangesSpy = vi.spyOn(component['unsavedChanges'], 'emit');
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        `#${FIELD_NAMES.paymentArrangement}-${paymentArrangement}`,
      ) as HTMLInputElement
    ).click();
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(unsavedChangesSpy).toHaveBeenCalledWith(true);
    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: { [FIELD_NAMES.paymentArrangement]: paymentArrangement },
      nestedFlow: false,
    });
  });

  it('emits Cancel from the rendered link', () => {
    const cancelSpy = vi.spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('#cancelManagingPayments a') as HTMLAnchorElement).click();

    expect(cancelSpy).toHaveBeenCalledOnce();
  });

  it('does not emit when a supposedly valid raw value is unexpectedly null', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    component.form.controls[FIELD_NAMES.paymentArrangement].clearValidators();
    component.form.controls[FIELD_NAMES.paymentArrangement].setValue(null);

    component.handleFormSubmit(new SubmitEvent('submit'));

    expect(formSubmitSpy).not.toHaveBeenCalled();
  });
});
