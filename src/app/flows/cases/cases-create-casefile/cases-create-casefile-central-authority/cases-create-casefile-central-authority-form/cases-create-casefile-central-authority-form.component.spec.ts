import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AlphagovAccessibleAutocompleteComponent } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-central-authority-field-names.constant';
import type { ICasesCreateCasefileCentralAuthorityFormData } from '../interfaces/cases-create-casefile-central-authority-form-data.interface';
import { CasesCreateCasefileCentralAuthorityFormComponent } from './cases-create-casefile-central-authority-form.component';

describe('CasesCreateCasefileCentralAuthorityFormComponent', () => {
  const centralAuthorityItems: IAlphagovAccessibleAutocompleteItem[] = [{ name: 'Central authority 901', value: 901 }];
  const defaultFormData: ICasesCreateCasefileCentralAuthorityFormData = {
    [FIELD_NAMES.remoReference]: null,
    [FIELD_NAMES.centralAuthorityReference]: null,
    [FIELD_NAMES.majorCreditorId]: null,
  };

  let fixture: ComponentFixture<CasesCreateCasefileCentralAuthorityFormComponent>;
  let component: CasesCreateCasefileCentralAuthorityFormComponent;

  const createComponent = (initialFormData: ICasesCreateCasefileCentralAuthorityFormData = defaultFormData): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileCentralAuthorityFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = initialFormData;
    component.centralAuthorityAutocompleteItems = centralAuthorityItems;
  };

  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCentralAuthorityFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('creates three optional typed controls and restores initial values', () => {
    createComponent({
      [FIELD_NAMES.remoReference]: 'REMO-1',
      [FIELD_NAMES.centralAuthorityReference]: 'CA-1',
      [FIELD_NAMES.majorCreditorId]: 901,
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      [FIELD_NAMES.remoReference]: 'REMO-1',
      [FIELD_NAMES.centralAuthorityReference]: 'CA-1',
      [FIELD_NAMES.majorCreditorId]: 901,
    });
    expect(component.form.valid).toBe(true);
  });

  it('renders exact labels, canonical names, autocomplete items and actions', () => {
    createComponent();
    fixture.detectChanges();

    const textInputs = fixture.debugElement
      .queryAll(By.directive(GovukTextInputComponent))
      .map((debugElement) => debugElement.componentInstance as GovukTextInputComponent);
    const autocomplete = fixture.debugElement.query(By.directive(AlphagovAccessibleAutocompleteComponent))
      .componentInstance as AlphagovAccessibleAutocompleteComponent;

    expect(textInputs.map(({ labelText, inputId, inputName }) => ({ labelText, inputId, inputName }))).toEqual([
      { labelText: 'REMO reference', inputId: FIELD_NAMES.remoReference, inputName: FIELD_NAMES.remoReference },
      {
        labelText: 'Central authority reference',
        inputId: FIELD_NAMES.centralAuthorityReference,
        inputName: FIELD_NAMES.centralAuthorityReference,
      },
    ]);
    expect(autocomplete.labelText).toBe('Central Authority');
    expect(autocomplete.inputId).toBe(FIELD_NAMES.majorCreditorId);
    expect(autocomplete.inputName).toBe(FIELD_NAMES.majorCreditorId);
    expect(autocomplete.autoCompleteItems).toBe(centralAuthorityItems);
    expect(autocomplete.showAllValues).toBe(true);
    expect(fixture.nativeElement.querySelector('#returnToCaseDetails')?.textContent.trim()).toBe(
      'Return to case details',
    );
    expect(fixture.nativeElement.querySelector('#cancelCentralAuthority a')?.textContent.trim()).toBe('Cancel');
  });

  it('uses canonical identifiers without HTML maxlength attributes', () => {
    createComponent();
    fixture.detectChanges();

    const controls = Array.from(
      fixture.nativeElement.querySelectorAll('input, select, textarea') as NodeListOf<HTMLElement>,
    );

    expect(controls.map((control) => control.id)).toEqual(Object.values(FIELD_NAMES));
    expect(controls.map((control) => control.getAttribute('name'))).toEqual(Object.values(FIELD_NAMES));
    expect(controls.every((control) => !control.hasAttribute('maxlength'))).toBe(true);
  });

  it.each([
    [FIELD_NAMES.remoReference, 'x'.repeat(21), 'REMO reference must be 20 characters or fewer'],
    [
      FIELD_NAMES.centralAuthorityReference,
      'x'.repeat(51),
      'Central authority reference must be 50 characters or fewer',
    ],
  ] as const)('shows and links exact maximum-length errors for %s', (fieldName, value, message) => {
    createComponent();
    fixture.detectChanges();
    component.form.controls[fieldName].setValue(value);
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(component.formControlErrorMessages[fieldName]).toBe(message);
    expect(component.formErrorSummaryMessage).toContainEqual({ fieldId: fieldName, message });
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.govuk-error-summary'));
    const summaryLink = fixture.nativeElement.querySelector('.govuk-error-summary__list a') as HTMLAnchorElement;
    expect(summaryLink.textContent?.trim()).toBe(message);
    summaryLink.click();
    expect(document.activeElement?.id).toBe(fieldName);
  });

  it('submits nullable optional values and emits Cancel', () => {
    createComponent();
    const unsavedChanges = vi.spyOn(component['unsavedChanges'], 'emit');
    const submit = vi.spyOn(component['formSubmit'], 'emit');
    const cancel = vi.spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    (fixture.nativeElement.querySelector('#cancelCentralAuthority a') as HTMLAnchorElement).click();

    expect(unsavedChanges).toHaveBeenCalledWith(false);
    expect(submit).toHaveBeenCalledWith({
      formData: {
        [FIELD_NAMES.remoReference]: null,
        [FIELD_NAMES.centralAuthorityReference]: null,
        [FIELD_NAMES.majorCreditorId]: null,
      },
      nestedFlow: false,
    });
    expect(cancel).toHaveBeenCalledOnce();
  });
});
