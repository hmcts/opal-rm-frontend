import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../../constants/cases-create-casefile-case-types.constant';
import { CasesCreateCasefileCaseTypeFormComponent } from './cases-create-casefile-case-type-form.component';

describe('CasesCreateCasefileCaseTypeFormComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileCaseTypeFormComponent>;
  let component: CasesCreateCasefileCaseTypeFormComponent;
  beforeEach(async () => {
    document.body.classList.add('govuk-frontend-supported', 'js-enabled');
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCaseTypeFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CasesCreateCasefileCaseTypeFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = { caseType: null, applicantType: null };
    fixture.detectChanges();
  });

  it('starts with no default values and Applicant Type disabled', () => {
    expect(component.caseTypeControl.value).toBeNull();
    expect(component.applicantTypeControl.value).toBeNull();
    expect(component.applicantTypeControl.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('input[name="caseType"]:checked')).toBeNull();
  });

  it('describes and controls the Applicant Type reveal without unsupported expanded state', () => {
    const remoInRadio = fixture.nativeElement.querySelector('#caseType-remo-in') as HTMLInputElement;
    const conditional = fixture.nativeElement.querySelector('#applicantTypeConditional') as HTMLDivElement;
    const description = fixture.nativeElement.querySelector('#caseType-remo-in-description') as HTMLSpanElement;

    expect(remoInRadio.getAttribute('aria-controls')).toBe('applicantTypeConditional');
    expect(remoInRadio.getAttribute('aria-describedby')).toBe('caseType-remo-in-description');
    expect(remoInRadio.hasAttribute('aria-expanded')).toBe(false);
    expect(description.textContent?.trim()).toBe('Selecting REMO In reveals the required applicant type field.');
    expect(conditional.classList.contains('govuk-radios__conditional--hidden')).toBe(true);

    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN);
    fixture.detectChanges();

    expect(conditional.classList.contains('govuk-radios__conditional--hidden')).toBe(false);
  });

  it('requires an explicit Applicant Type only for REMO In', () => {
    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN);
    expect(component.applicantTypeControl.enabled).toBe(true);
    expect(component.applicantTypeControl.hasError('required')).toBe(true);

    component.applicantTypeControl.setValue(CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL);
    expect(component.applicantTypeControl.valid).toBe(true);
  });

  it('clears and disables Applicant Type when switching outbound', () => {
    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN);
    component.applicantTypeControl.setValue(CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION);
    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT);

    expect(component.applicantTypeControl.value).toBeNull();
    expect(component.applicantTypeControl.disabled).toBe(true);
    expect(component.form.valid).toBe(true);
  });

  it('rehydrates a REMO In Applicant Type selection', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(CasesCreateCasefileCaseTypeFormComponent);
    component = fixture.componentInstance;
    component.initialFormData = {
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    };
    fixture.detectChanges();

    expect(component.caseTypeControl.value).toBe(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN);
    expect(component.applicantTypeControl.enabled).toBe(true);
    expect(component.applicantTypeControl.value).toBe(CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION);
    expect(component.form.valid).toBe(true);
  });

  it('shows the exact Case Type validation error', () => {
    const event = new SubmitEvent('submit', { cancelable: true });

    component.handleFormSubmit(event);

    expect(event.defaultPrevented).toBe(true);
    expect(component.formControlErrorMessages['caseType']).toBe('Select a case type');
    expect(component.formErrorSummaryMessage).toEqual([{ fieldId: 'caseType', message: 'Select a case type' }]);
  });

  it('shows the exact Applicant Type validation error', () => {
    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN);
    component.handleFormSubmit(new SubmitEvent('submit'));
    expect(component.formControlErrorMessages['applicantType']).toBe('Select applicant type');
  });

  it('clears Applicant Type errors when switching outbound', () => {
    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN);
    component.handleFormSubmit(new SubmitEvent('submit'));

    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT);

    expect(component.formControlErrorMessages['applicantType']).toBeNull();
    expect(component.formErrorSummaryMessage).not.toContainEqual({
      fieldId: 'applicantType',
      message: 'Select applicant type',
    });

    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN);

    expect(component.formControlErrorMessages['applicantType']).toBeNull();
    expect(component.formErrorSummaryMessage).not.toContainEqual({
      fieldId: 'applicantType',
      message: 'Select applicant type',
    });
  });

  it('emits an explicit valid REMO In selection', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    const event = new SubmitEvent('submit', { cancelable: true });
    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN);
    component.applicantTypeControl.setValue(CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL);

    component.handleFormSubmit(event);

    expect(event.defaultPrevented).toBe(true);
    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: { caseType: 'REMO In', applicantType: 'Individual' },
      nestedFlow: false,
    });
  });

  it('emits a null Applicant Type for a valid outbound selection', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    component.caseTypeControl.setValue(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT);

    component.handleFormSubmit(new SubmitEvent('submit'));

    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: { caseType: 'REMO Out', applicantType: null },
      nestedFlow: false,
    });
  });
});
