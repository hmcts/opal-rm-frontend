import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from '../../constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-interest-indexation-field-names.constant';
import type { ICasesCreateCasefileInterestIndexationFormData } from '../interfaces/cases-create-casefile-interest-indexation-form-data.interface';
import { CasesCreateCasefileInterestIndexationFormComponent } from './cases-create-casefile-interest-indexation-form.component';

describe('CasesCreateCasefileInterestIndexationFormComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileInterestIndexationFormComponent>;
  let component: CasesCreateCasefileInterestIndexationFormComponent;

  const createComponent = (
    initialFormData: ICasesCreateCasefileInterestIndexationFormData = {
      [FIELD_NAMES.interestApplies]: null,
      [FIELD_NAMES.indexationType]: null,
    },
  ): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileInterestIndexationFormComponent);
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
      imports: [CasesCreateCasefileInterestIndexationFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    createComponent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('uses canonical, unique identifiers for every form control and error-summary target', () => {
    fixture.detectChanges();
    component.handleFormSubmit(new SubmitEvent('submit'));
    fixture.detectChanges();

    const controls = Array.from(
      fixture.nativeElement.querySelectorAll('input, select, textarea') as NodeListOf<HTMLElement>,
    );
    const ids = controls.map((control) => control.id);
    const names = controls.map((control) => control.getAttribute('name') ?? '');

    expect(ids.every((id) => id.startsWith('create_casefile_interest_indexation_'))).toBe(true);
    expect(names.every((name) => name.startsWith('create_casefile_interest_indexation_'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    for (const controlName of Object.keys(component.form.controls)) {
      expect(names).toContain(controlName);
    }
    for (const error of component.formErrorSummaryMessage) {
      expect(fixture.nativeElement.querySelectorAll(`[id="${error.fieldId}"]`)).toHaveLength(1);
    }
  });

  it('creates two required typed controls with empty defaults', () => {
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      [FIELD_NAMES.interestApplies]: null,
      [FIELD_NAMES.indexationType]: null,
    });
    expect(component.form.controls[FIELD_NAMES.interestApplies].hasError('required')).toBe(true);
    expect(component.form.controls[FIELD_NAMES.indexationType].hasError('required')).toBe(true);
    expect(component.form.valid).toBe(false);
  });

  it('renders the exact heading, groups, options, divider and actions without excluded controls', () => {
    fixture.detectChanges();

    const interestLabels = Array.from(
      fixture.nativeElement.querySelectorAll(
        `#${FIELD_NAMES.interestApplies} .govuk-radios__label`,
      ) as NodeListOf<HTMLElement>,
    ).map((label) => label.textContent?.trim());
    const indexationLabels = Array.from(
      fixture.nativeElement.querySelectorAll(
        `#${FIELD_NAMES.indexationType} .govuk-radios__label`,
      ) as NodeListOf<HTMLElement>,
    ).map((label) => label.textContent?.trim());

    expect(fixture.nativeElement.querySelector('h1')?.textContent.trim()).toBe('Interest and indexation');
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.interestApplies} legend`)?.textContent.trim()).toBe(
      'Does interest apply?',
    );
    expect(interestLabels).toEqual(['Yes', 'No']);
    expect(fixture.nativeElement.querySelectorAll(`input[name="${FIELD_NAMES.interestApplies}"]`)).toHaveLength(2);
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.indexationType} legend`)?.textContent.trim()).toBe(
      'What type of indexation applies?',
    );
    expect(indexationLabels).toEqual([
      'Retail Price Index (RPI)',
      'Consumer Price Index (CPI)',
      'Other indexation',
      'No indexation',
    ]);
    expect(
      fixture.nativeElement.querySelector(`#${FIELD_NAMES.indexationType} .govuk-radios__divider`)?.textContent.trim(),
    ).toBe('or');
    expect(fixture.nativeElement.querySelector('#returnToCaseDetails')?.textContent.trim()).toBe(
      'Return to case details',
    );
    expect(fixture.nativeElement.querySelector('#cancelInterestAndIndexation a')?.textContent.trim()).toBe('Cancel');
    expect(fixture.nativeElement.querySelector('.govuk-back-link')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('input[type="text"], input[name*="amount"], input[name*="rate"]'),
    ).toBeNull();
  });

  it('shows both exact inline and summary errors and focuses the summary', () => {
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(component.formControlErrorMessages).toMatchObject({
      [FIELD_NAMES.interestApplies]: 'Choose whether interest applies',
      [FIELD_NAMES.indexationType]: 'Select what type of indexation applies',
    });
    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: FIELD_NAMES.interestApplies, message: 'Choose whether interest applies' },
      { fieldId: FIELD_NAMES.indexationType, message: 'Select what type of indexation applies' },
    ]);
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.interestApplies}-error-message`)?.textContent).toContain(
      'Choose whether interest applies',
    );
    expect(fixture.nativeElement.querySelector(`#${FIELD_NAMES.indexationType}-error-message`)?.textContent).toContain(
      'Select what type of indexation applies',
    );
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.govuk-error-summary'));
  });

  it('shows only the Indexation error when Interest is selected', () => {
    component.initialFormData = { [FIELD_NAMES.interestApplies]: true, [FIELD_NAMES.indexationType]: null };
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: FIELD_NAMES.indexationType, message: 'Select what type of indexation applies' },
    ]);
  });

  it('shows only the Interest error when Indexation is selected', () => {
    component.initialFormData = {
      [FIELD_NAMES.interestApplies]: null,
      [FIELD_NAMES.indexationType]: CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI,
    };
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(component.formErrorSummaryMessage).toEqual([
      { fieldId: FIELD_NAMES.interestApplies, message: 'Choose whether interest applies' },
    ]);
  });

  it('links summary errors to the first radio in each associated group', () => {
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll(
      '.govuk-error-summary__list a',
    ) as NodeListOf<HTMLAnchorElement>;

    links[0].click();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector(`#${FIELD_NAMES.interestApplies}-yes`));
    links[1].click();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector(`#${FIELD_NAMES.indexationType}-rpi`));
  });

  it('retains a valid entered selection when the other group is invalid', () => {
    fixture.detectChanges();
    (fixture.nativeElement.querySelector(`#${FIELD_NAMES.interestApplies}-no`) as HTMLInputElement).click();
    fixture.detectChanges();

    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(component.form.controls[FIELD_NAMES.interestApplies].value).toBe(false);
    expect(
      (fixture.nativeElement.querySelector(`#${FIELD_NAMES.interestApplies}-no`) as HTMLInputElement).checked,
    ).toBe(true);
  });

  it('restores supplied initial form data', () => {
    fixture.destroy();
    createComponent({
      [FIELD_NAMES.interestApplies]: true,
      [FIELD_NAMES.indexationType]: CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER,
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      [FIELD_NAMES.interestApplies]: true,
      [FIELD_NAMES.indexationType]: 'OTHER',
    });
    expect(
      (fixture.nativeElement.querySelector(`#${FIELD_NAMES.interestApplies}-yes`) as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelector(`#${FIELD_NAMES.indexationType}-other`) as HTMLInputElement).checked,
    ).toBe(true);
  });

  it('emits dirty state, a valid non-null form event and Cancel', () => {
    const unsavedChangesSpy = vi.spyOn(component['unsavedChanges'], 'emit');
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    const cancelSpy = vi.spyOn(component.cancel, 'emit');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector(`#${FIELD_NAMES.interestApplies}-no`) as HTMLInputElement).click();
    (fixture.nativeElement.querySelector(`#${FIELD_NAMES.indexationType}-none`) as HTMLInputElement).click();
    fixture.detectChanges();

    expect(unsavedChangesSpy).toHaveBeenCalledWith(true);
    component.handleFormSubmit(new SubmitEvent('submit', { cancelable: true }));
    expect(formSubmitSpy).toHaveBeenCalledWith({
      formData: { [FIELD_NAMES.interestApplies]: false, [FIELD_NAMES.indexationType]: 'NONE' },
      nestedFlow: false,
    });
    (fixture.nativeElement.querySelector('#cancelInterestAndIndexation a') as HTMLAnchorElement).click();
    expect(cancelSpy).toHaveBeenCalledOnce();
  });

  it('does not emit a valid submission when required raw values are unexpectedly null', () => {
    const formSubmitSpy = vi.spyOn(component['formSubmit'], 'emit');
    component.form.controls[FIELD_NAMES.interestApplies].clearValidators();
    component.form.controls[FIELD_NAMES.indexationType].clearValidators();
    component.form.controls[FIELD_NAMES.interestApplies].setValue(null);
    component.form.controls[FIELD_NAMES.indexationType].setValue(null);

    component.handleFormSubmit(new SubmitEvent('submit'));

    expect(formSubmitSpy).not.toHaveBeenCalled();
  });
});
