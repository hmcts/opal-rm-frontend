import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AlphagovAccessibleAutocompleteComponent } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete';
import { GovukSelectComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-select';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { MojDatePickerComponent } from '@hmcts/opal-frontend-common/components/moj/moj-date-picker';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { DateTime } from 'luxon';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-order-details-field-names.constant';
import type { ICasesCreateCasefileOrderDetailsFormData } from '../interfaces/cases-create-casefile-order-details-form-data.interface';
import { CasesCreateCasefileOrderDetailsFormComponent } from './cases-create-casefile-order-details-form.component';

describe('CasesCreateCasefileOrderDetailsFormComponent', () => {
  const applicationAutocompleteItems = [{ name: 'TEST01 - Synthetic application', value: 901 }];
  const emptyFormData: ICasesCreateCasefileOrderDetailsFormData = {
    [FIELD_NAMES.applicationId]: null,
    [FIELD_NAMES.court]: null,
    [FIELD_NAMES.dateOrderMade]: null,
    [FIELD_NAMES.paymentFrequency]: null,
    [FIELD_NAMES.dateArrearsLastUpdated]: null,
  };
  let fixture: ComponentFixture<CasesCreateCasefileOrderDetailsFormComponent>;
  let component: CasesCreateCasefileOrderDetailsFormComponent;

  const createComponent = (initialFormData: ICasesCreateCasefileOrderDetailsFormData = emptyFormData): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileOrderDetailsFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = initialFormData;
    component.applicationAutocompleteItems = applicationAutocompleteItems;
  };

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileOrderDetailsFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    vi.spyOn(TestBed.inject(DateService), 'getDateNow').mockReturnValue(DateTime.fromISO('2026-09-16'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it.each([FIELD_NAMES.dateOrderMade, FIELD_NAMES.dateArrearsLastUpdated])(
    'reports a calendar-only edit to %s and clears it when restored',
    (field) => {
      createComponent({ ...emptyFormData, [field]: '01/09/2026' });
      fixture.detectChanges();
      const changes = vi.spyOn(component['unsavedChanges'], 'emit');
      const picker = fixture.debugElement
        .queryAll(By.directive(MojDatePickerComponent))
        .find((element) => element.componentInstance.inputId === field)!;

      picker.triggerEventHandler('dateChange', '02/09/2026');
      expect(changes).toHaveBeenLastCalledWith(true);
      picker.triggerEventHandler('dateChange', '01/09/2026');
      expect(changes).toHaveBeenLastCalledWith(false);
      picker.triggerEventHandler('dateChange', '');
      expect(changes).toHaveBeenLastCalledWith(true);
    },
  );

  it('keeps an invalid return on the form and focuses linked errors', () => {
    createComponent();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(component.formErrorSummaryMessage.map((error) => error.message)).toEqual([
      'Select an application code',
      'Select a payment frequency',
      'Enter the date arrears last updated',
    ]);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.govuk-error-summary'));
    expect(component.form.controls[FIELD_NAMES.dateOrderMade].valid).toBe(true);
  });

  it('renders exact labels, canonical identifiers, options and actions', () => {
    createComponent();
    fixture.detectChanges();

    const autocomplete = fixture.debugElement.query(By.directive(AlphagovAccessibleAutocompleteComponent))
      .componentInstance as AlphagovAccessibleAutocompleteComponent;
    const textInput = fixture.debugElement.query(By.directive(GovukTextInputComponent))
      .componentInstance as GovukTextInputComponent;
    const dates = fixture.debugElement
      .queryAll(By.directive(MojDatePickerComponent))
      .map((element) => element.componentInstance as MojDatePickerComponent);
    const frequency = fixture.debugElement.query(By.directive(GovukSelectComponent))
      .componentInstance as GovukSelectComponent;

    expect({ label: autocomplete.labelText, id: autocomplete.inputId, name: autocomplete.inputName }).toEqual({
      label: 'Application',
      id: FIELD_NAMES.applicationId,
      name: FIELD_NAMES.applicationId,
    });
    expect(autocomplete.autoCompleteItems).toBe(applicationAutocompleteItems);
    expect({ label: textInput.labelText, id: textInput.inputId, name: textInput.inputName }).toEqual({
      label: 'Court that made the order',
      id: FIELD_NAMES.court,
      name: FIELD_NAMES.court,
    });
    expect(dates.map(({ labelText, inputId, inputName }) => ({ labelText, inputId, inputName }))).toEqual([
      { labelText: 'Date order made', inputId: FIELD_NAMES.dateOrderMade, inputName: FIELD_NAMES.dateOrderMade },
      {
        labelText: 'Date arrears last updated',
        inputId: FIELD_NAMES.dateArrearsLastUpdated,
        inputName: FIELD_NAMES.dateArrearsLastUpdated,
      },
    ]);
    expect({ label: frequency.labelText, id: frequency.selectId, name: frequency.selectName }).toEqual({
      label: 'Payment frequency',
      id: FIELD_NAMES.paymentFrequency,
      name: FIELD_NAMES.paymentFrequency,
    });
    const renderedFrequencyOptions = Array.from(
      fixture.nativeElement.querySelectorAll(`#${FIELD_NAMES.paymentFrequency} option`),
    ).map((option) => {
      const htmlOption = option as HTMLOptionElement;
      return { value: htmlOption.value, text: htmlOption.textContent?.trim() };
    });
    expect(renderedFrequencyOptions).toEqual([
      { value: '', text: '' },
      { value: 'Weekly', text: 'Weekly' },
      { value: 'Fortnightly', text: 'Fortnightly' },
      { value: 'Monthly', text: 'Monthly' },
      { value: 'Quarterly', text: 'Quarterly' },
      { value: 'Yearly', text: 'Yearly' },
    ]);
    expect(component.form.controls[FIELD_NAMES.paymentFrequency].value).toBeNull();
    expect(component.form.controls[FIELD_NAMES.paymentFrequency].valid).toBe(false);
    expect(
      fixture.nativeElement.querySelector('#create_casefile_order_details_return_to_case_details')?.textContent.trim(),
    ).toBe('Return to case details');
    expect(fixture.nativeElement.querySelector('#create_casefile_order_details_cancel a')?.textContent.trim()).toBe(
      'Cancel',
    );
  });

  it.each([
    [FIELD_NAMES.court, 'x'.repeat(41), 'Court that made the order must be 40 characters or fewer'],
    [FIELD_NAMES.dateOrderMade, '31/02/2026', 'Enter a real date in the format DD/MM/YYYY'],
    [FIELD_NAMES.dateOrderMade, '17/09/2026', 'Date cannot be in the future'],
    [FIELD_NAMES.dateArrearsLastUpdated, '31/02/2026', 'Enter a real date in the format DD/MM/YYYY'],
    [FIELD_NAMES.dateArrearsLastUpdated, '17/09/2026', 'Date cannot be in the future'],
  ] as const)('shows and links the exact error for %s', (fieldName, value, message) => {
    createComponent({
      ...emptyFormData,
      [FIELD_NAMES.applicationId]: 901,
      [FIELD_NAMES.paymentFrequency]: 'Monthly',
      [FIELD_NAMES.dateArrearsLastUpdated]: '15/09/2026',
    });
    fixture.detectChanges();
    component.form.controls[fieldName].setValue(value);
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(component.formControlErrorMessages[fieldName]).toBe(message);
    expect(component.formErrorSummaryMessage).toContainEqual({ fieldId: fieldName, message });
  });

  it('marks unmatched autocomplete text dirty and blocks submission with the exact selection error', () => {
    createComponent({
      ...emptyFormData,
      [FIELD_NAMES.paymentFrequency]: 'Monthly',
      [FIELD_NAMES.dateArrearsLastUpdated]: '15/09/2026',
    });
    const submit = vi.spyOn(component['formSubmit'], 'emit');
    const unsavedChanges = vi.spyOn(component['unsavedChanges'], 'emit');
    fixture.detectChanges();
    const input = document.createElement('input');
    input.id = `${FIELD_NAMES.applicationId}-autocomplete`;
    input.value = 'Unknown application';

    component.handleApplicationInput({ target: input } as unknown as Event);
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(component.form.controls[FIELD_NAMES.applicationId].dirty).toBe(true);
    expect(component.formControlErrorMessages[FIELD_NAMES.applicationId]).toBe(
      'Select an application code from the list',
    );
    expect(unsavedChanges).toHaveBeenCalledWith(true);
    expect(submit).not.toHaveBeenCalled();
  });

  it('restores a stale application ID without replacing it and prevents saving it', () => {
    createComponent({
      ...emptyFormData,
      [FIELD_NAMES.applicationId]: 999,
      [FIELD_NAMES.paymentFrequency]: 'Monthly',
      [FIELD_NAMES.dateArrearsLastUpdated]: '15/09/2026',
    });
    const submit = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();

    expect(component.form.controls[FIELD_NAMES.applicationId].value).toBe(999);
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(component.formControlErrorMessages[FIELD_NAMES.applicationId]).toBe(
      'Select an application code from the list',
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits valid restored values and emits Cancel', () => {
    const formData: ICasesCreateCasefileOrderDetailsFormData = {
      [FIELD_NAMES.applicationId]: 901,
      [FIELD_NAMES.court]: 'Test Court',
      [FIELD_NAMES.dateOrderMade]: null,
      [FIELD_NAMES.paymentFrequency]: 'Monthly',
      [FIELD_NAMES.dateArrearsLastUpdated]: '15/09/2026',
    };
    createComponent(formData);
    const submit = vi.spyOn(component['formSubmit'], 'emit');
    const cancel = vi.spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    (fixture.nativeElement.querySelector('#create_casefile_order_details_cancel a') as HTMLAnchorElement).click();

    expect(submit).toHaveBeenCalledWith({ formData, nestedFlow: false });
    expect(cancel).toHaveBeenCalledOnce();
  });
  it('rejects an exact typed label converted to an ID by autocomplete blur', () => {
    createComponent({
      ...emptyFormData,
      [FIELD_NAMES.paymentFrequency]: 'Monthly',
      [FIELD_NAMES.dateArrearsLastUpdated]: '15/09/2026',
    });
    const submit = vi.spyOn(component['formSubmit'], 'emit');
    fixture.detectChanges();
    const input = document.createElement('input');
    input.id = `${FIELD_NAMES.applicationId}-autocomplete`;
    input.value = applicationAutocompleteItems[0].name;
    component.handleApplicationInput({ target: input } as unknown as Event);
    component.form.controls[FIELD_NAMES.applicationId].setValue(901);
    input.addEventListener('keydown', (event) => component.handleApplicationSelection(event));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    expect(component.formControlErrorMessages[FIELD_NAMES.applicationId]).toBe(
      'Select an application code from the list',
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it.each(['Enter', ' ', 'click'])('accepts explicit option activation with %s', (activation) => {
    createComponent();
    fixture.detectChanges();
    const input = document.createElement('input');
    input.id = `${FIELD_NAMES.applicationId}-autocomplete`;
    input.value = applicationAutocompleteItems[0].name;
    component.handleApplicationInput({ target: input } as unknown as Event);
    const control = component.form.controls[FIELD_NAMES.applicationId];
    control.setValue(901);
    const option = document.createElement('li');
    option.id = `${FIELD_NAMES.applicationId}-autocomplete__option--0`;
    option.setAttribute('role', 'option');
    const event = activation === 'click' ? new MouseEvent('click') : new KeyboardEvent('keydown', { key: activation });
    option.addEventListener(event.type, (event) =>
      component.handleApplicationSelection(event as MouseEvent | KeyboardEvent),
    );
    option.dispatchEvent(event);
    expect(control.valid).toBe(true);
  });

  it.each(['ArrowDown', 'disabled'])('does not accept %s as option confirmation', (activation) => {
    createComponent();
    fixture.detectChanges();
    const input = document.createElement('input');
    input.id = `${FIELD_NAMES.applicationId}-autocomplete`;
    input.value = applicationAutocompleteItems[0].name;
    component.handleApplicationInput({ target: input } as unknown as Event);
    const control = component.form.controls[FIELD_NAMES.applicationId];
    control.setValue(901);
    const option = document.createElement('li');
    option.id = `${FIELD_NAMES.applicationId}-autocomplete__option--0`;
    option.setAttribute('role', 'option');
    if (activation === 'disabled') option.setAttribute('aria-disabled', 'true');
    option.addEventListener('keydown', (event) => component.handleApplicationSelection(event));
    option.dispatchEvent(new KeyboardEvent('keydown', { key: activation === 'disabled' ? 'Enter' : activation }));
    expect(control.errors).toEqual({ invalidSelection: true });
  });
  it('accepts keyboard activation of the input active ARIA suggestion before the menu closes', () => {
    createComponent();
    fixture.detectChanges();
    const input = document.createElement('input');
    input.id = `${FIELD_NAMES.applicationId}-autocomplete`;
    input.value = 'TEST01';
    component.handleApplicationInput({ target: input } as unknown as Event);
    const option = document.createElement('li');
    option.id = `${input.id}__option--0`;
    option.setAttribute('role', 'option');
    document.body.append(option);
    input.setAttribute('aria-activedescendant', option.id);
    input.addEventListener('keydown', (event) => component.handleApplicationSelection(event));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    component.form.controls[FIELD_NAMES.applicationId].setValue(901);
    expect(component.form.controls[FIELD_NAMES.applicationId].valid).toBe(true);
    option.remove();
  });

  it.each(['click', ' '])(
    'does not treat %s on an input with an active descendant as option activation',
    (activation) => {
      createComponent();
      fixture.detectChanges();
      const input = document.createElement('input');
      input.id = `${FIELD_NAMES.applicationId}-autocomplete`;
      input.value = applicationAutocompleteItems[0].name;
      component.handleApplicationInput({ target: input } as unknown as Event);
      const option = document.createElement('li');
      option.id = `${input.id}__option--0`;
      option.setAttribute('role', 'option');
      document.body.append(option);
      input.setAttribute('aria-activedescendant', option.id);
      const event =
        activation === 'click' ? new MouseEvent('click') : new KeyboardEvent('keydown', { key: activation });
      input.addEventListener(event.type, (event) =>
        component.handleApplicationSelection(event as MouseEvent | KeyboardEvent),
      );
      input.dispatchEvent(event);
      component.form.controls[FIELD_NAMES.applicationId].setValue(901);
      expect(component.form.controls[FIELD_NAMES.applicationId].errors).toEqual({ invalidSelection: true });
      option.remove();
    },
  );
});
