import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup, Validators, type ValidatorFn } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefilePartyAliasConditionalFormComponent } from './cases-create-casefile-party-alias-conditional-form.component';

type ApplicantControlName =
  | 'create_casefile_applicant_individual_add_aliases'
  | 'create_casefile_applicant_individual_aliases'
  | 'create_casefile_applicant_individual_send_correspondence_to_third_party'
  | 'create_casefile_applicant_individual_third_party_name_or_organisation'
  | 'create_casefile_applicant_individual_third_party_country_id'
  | 'create_casefile_applicant_individual_restricted_information'
  | 'create_casefile_applicant_individual_restricted_information_reason';

type RespondentControlName =
  | 'create_casefile_respondent_details_add_aliases'
  | 'create_casefile_respondent_details_aliases'
  | 'create_casefile_respondent_details_add_employer_details'
  | 'create_casefile_respondent_details_employer_name'
  | 'create_casefile_respondent_details_employer_country_id';

type ApplicantAliasRow = Record<string, string | null>;

type RespondentAliasRow = Record<string, string | null>;

const trimRequiredValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() !== '' ? null : { required: true };

@Component({ template: '' })
class ApplicantPartyAliasConditionalHarnessComponent extends CasesCreateCasefilePartyAliasConditionalFormComponent<
  ApplicantControlName,
  ApplicantAliasRow
> {
  protected override readonly conditionalBranches = [
    {
      checkbox: 'create_casefile_applicant_individual_send_correspondence_to_third_party',
      requiredText: ['create_casefile_applicant_individual_third_party_name_or_organisation'],
      requiredCountry: ['create_casefile_applicant_individual_third_party_country_id'],
      controls: [
        'create_casefile_applicant_individual_third_party_name_or_organisation',
        'create_casefile_applicant_individual_third_party_country_id',
      ],
    },
    {
      checkbox: 'create_casefile_applicant_individual_restricted_information',
      requiredText: ['create_casefile_applicant_individual_restricted_information_reason'],
      requiredCountry: [],
      controls: ['create_casefile_applicant_individual_restricted_information_reason'],
    },
  ] as const;
  protected override readonly requiredTextValidator = trimRequiredValidator;

  public configure(): void {
    this.form = new FormGroup({
      create_casefile_applicant_individual_add_aliases: new FormControl(false, { nonNullable: true }),
      create_casefile_applicant_individual_aliases: new FormArray<FormGroup>([]),
      create_casefile_applicant_individual_send_correspondence_to_third_party: new FormControl(false, {
        nonNullable: true,
      }),
      create_casefile_applicant_individual_third_party_name_or_organisation: new FormControl(
        { value: null, disabled: true },
        Validators.maxLength(40),
      ),
      create_casefile_applicant_individual_third_party_country_id: new FormControl({ value: null, disabled: true }),
      create_casefile_applicant_individual_restricted_information: new FormControl(false, { nonNullable: true }),
      create_casefile_applicant_individual_restricted_information_reason: new FormControl(
        { value: null, disabled: true },
        Validators.maxLength(250),
      ),
    });
    this.aliasFields = [
      'create_casefile_applicant_individual_alias_first_names',
      'create_casefile_applicant_individual_alias_last_name',
    ];
    this.aliasControlsValidation = this.aliasFields.map((controlName) => ({
      controlName,
      validators: [trimRequiredValidator],
    }));
    this.formControlErrorMessages = {};
    this.formErrorSummaryMessage = [];
    this.formErrors = [];
  }

  public initialiseSharedBehaviour(): void {
    this.initialisePartyAliasConditionalBehaviour();
  }

  public applyInitialBranches(): void {
    this.applyInitialConditionalBranches();
  }

  public connectAliasCheckbox(): void {
    this.setUpAliasCheckboxListener(
      'create_casefile_applicant_individual_add_aliases',
      'create_casefile_applicant_individual_aliases',
    );
  }

  public prepareAliases(count: number): void {
    this.setupAliasFormControls(
      Array.from({ length: count }, (_, index) => index),
      'create_casefile_applicant_individual_aliases',
    );
  }

  public mapAliasRows(rows: readonly ApplicantAliasRow[]) {
    return this.mapAliases(rows);
  }

  public normalise(value: string | number | null): number | null {
    return this.normaliseCountryId(value);
  }
}

@Component({ template: '' })
class RespondentPartyAliasConditionalHarnessComponent extends CasesCreateCasefilePartyAliasConditionalFormComponent<
  RespondentControlName,
  RespondentAliasRow
> {
  protected override readonly conditionalBranches = [
    {
      checkbox: 'create_casefile_respondent_details_add_employer_details',
      requiredText: ['create_casefile_respondent_details_employer_name'],
      requiredCountry: ['create_casefile_respondent_details_employer_country_id'],
      controls: [
        'create_casefile_respondent_details_employer_name',
        'create_casefile_respondent_details_employer_country_id',
      ],
    },
  ] as const;
  protected override readonly requiredTextValidator = trimRequiredValidator;

  public configure(): void {
    this.form = new FormGroup({
      create_casefile_respondent_details_add_aliases: new FormControl(false, { nonNullable: true }),
      create_casefile_respondent_details_aliases: new FormArray<FormGroup>([]),
      create_casefile_respondent_details_add_employer_details: new FormControl(true, { nonNullable: true }),
      create_casefile_respondent_details_employer_name: new FormControl({ value: 'Saved employer', disabled: true }),
      create_casefile_respondent_details_employer_country_id: new FormControl({ value: 826, disabled: true }),
    });
    this.aliasFields = [
      'create_casefile_respondent_details_alias_first_names',
      'create_casefile_respondent_details_alias_last_name',
    ];
    this.aliasControlsValidation = this.aliasFields.map((controlName) => ({
      controlName,
      validators: [trimRequiredValidator],
    }));
    this.formControlErrorMessages = {};
    this.formErrorSummaryMessage = [];
    this.formErrors = [];
  }

  public initialiseSharedBehaviour(): void {
    this.initialisePartyAliasConditionalBehaviour();
  }

  public applyInitialBranches(): void {
    this.applyInitialConditionalBranches();
  }
}

describe('CasesCreateCasefilePartyAliasConditionalFormComponent', () => {
  let applicantFixture: ComponentFixture<ApplicantPartyAliasConditionalHarnessComponent>;
  let applicant: ApplicantPartyAliasConditionalHarnessComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApplicantPartyAliasConditionalHarnessComponent, RespondentPartyAliasConditionalHarnessComponent],
      providers: [provideRouter([])],
    });

    applicantFixture = TestBed.createComponent(ApplicantPartyAliasConditionalHarnessComponent);
    applicant = applicantFixture.componentInstance;
    applicant.configure();
  });

  it('applies initial selected Respondent-like branches without clearing hydrated values', () => {
    const fixture = TestBed.createComponent(RespondentPartyAliasConditionalHarnessComponent);
    const component = fixture.componentInstance;
    component.configure();

    component.applyInitialBranches();

    const employerName = component.form.controls['create_casefile_respondent_details_employer_name'];
    const employerCountry = component.form.controls['create_casefile_respondent_details_employer_country_id'];
    expect(employerName.enabled).toBe(true);
    expect(employerName.value).toBe('Saved employer');
    expect(employerName.hasValidator(trimRequiredValidator)).toBe(true);
    expect(employerCountry.enabled).toBe(true);
    expect(employerCountry.value).toBe(826);
    expect(employerCountry.hasValidator(Validators.required)).toBe(true);
    expect(component.form.pristine).toBe(true);
  });

  it('updates Applicant-like branch validators when checkbox selections change', () => {
    applicant.initialiseSharedBehaviour();
    const checkbox = applicant.form.controls['create_casefile_applicant_individual_send_correspondence_to_third_party'];
    const name = applicant.form.controls['create_casefile_applicant_individual_third_party_name_or_organisation'];
    const country = applicant.form.controls['create_casefile_applicant_individual_third_party_country_id'];

    checkbox.setValue(true);

    expect(name.enabled).toBe(true);
    expect(name.hasValidator(trimRequiredValidator)).toBe(true);
    expect(name.hasError('required')).toBe(true);
    name.setValue('a'.repeat(41));
    expect(name.hasError('maxlength')).toBe(true);
    expect(country.enabled).toBe(true);
    expect(country.hasValidator(Validators.required)).toBe(true);
    expect(country.hasError('required')).toBe(true);
  });

  it('clears values and errors without conditional control emissions when a branch is deselected', () => {
    applicant.initialiseSharedBehaviour();
    const checkbox = applicant.form.controls['create_casefile_applicant_individual_restricted_information'];
    const reason = applicant.form.controls['create_casefile_applicant_individual_restricted_information_reason'];
    checkbox.setValue(true);
    reason.setValue('Temporary reason');
    reason.setErrors({ custom: true }, { emitEvent: false });
    applicant.formControlErrorMessages['create_casefile_applicant_individual_restricted_information_reason'] =
      'Existing error';
    applicant.formErrorSummaryMessage = [
      {
        fieldId: 'create_casefile_applicant_individual_restricted_information_reason',
        message: 'Existing error',
      },
      { fieldId: 'unrelated', message: 'Keep me' },
    ];
    applicant.formErrors = [
      {
        fieldId: 'create_casefile_applicant_individual_restricted_information_reason',
        message: 'Existing error',
        priority: 1,
        type: 'required',
      },
      { fieldId: 'unrelated', message: 'Keep me', priority: 1, type: 'required' },
    ];
    const valueChanges = vi.fn();
    reason.valueChanges.subscribe(valueChanges);

    checkbox.setValue(false);

    expect(reason.disabled).toBe(true);
    expect(reason.value).toBeNull();
    expect(reason.errors).toBeNull();
    expect(reason.hasValidator(trimRequiredValidator)).toBe(false);
    reason.enable({ emitEvent: false });
    reason.setValue('a'.repeat(251), { emitEvent: false });
    expect(reason.hasError('maxlength')).toBe(true);
    expect(valueChanges).not.toHaveBeenCalled();
    expect(
      applicant.formControlErrorMessages['create_casefile_applicant_individual_restricted_information_reason'],
    ).toBeNull();
    expect(applicant.formErrorSummaryMessage).toEqual([{ fieldId: 'unrelated', message: 'Keep me' }]);
    expect(applicant.formErrors).toEqual([{ fieldId: 'unrelated', message: 'Keep me', priority: 1, type: 'required' }]);
  });

  it('clears alias rows and their collected errors when aliases are deselected', () => {
    applicant.prepareAliases(1);
    applicant.form.controls['create_casefile_applicant_individual_add_aliases'].setValue(true, { emitEvent: false });
    applicant.connectAliasCheckbox();
    applicant.initialiseSharedBehaviour();
    applicant.formControlErrorMessages['create_casefile_applicant_individual_alias_first_names_0'] = 'Alias error';
    applicant.formErrorSummaryMessage = [
      { fieldId: 'create_casefile_applicant_individual_alias_first_names_0', message: 'Alias error' },
    ];
    applicant.formErrors = [
      {
        fieldId: 'create_casefile_applicant_individual_alias_first_names_0',
        message: 'Alias error',
        priority: 1,
        type: 'required',
      },
    ];

    applicant.form.controls['create_casefile_applicant_individual_add_aliases'].setValue(false);

    expect(applicant.aliasControls).toHaveLength(0);
    expect(applicant.form.controls['create_casefile_applicant_individual_aliases'].value).toEqual([]);
    expect(applicant.formControlErrorMessages['create_casefile_applicant_individual_alias_first_names_0']).toBe(
      undefined,
    );
    expect(applicant.formErrorSummaryMessage).toEqual([]);
    expect(applicant.formErrors).toEqual([]);
  });

  it('marks alias additions dirty and enforces the maximum of five rows', () => {
    applicant.prepareAliases(4);
    const focusFirstAliasField = vi.spyOn(applicant, 'focusFirstAliasField').mockImplementation(() => undefined);

    applicant.addAlias(4, 'create_casefile_applicant_individual_aliases');
    applicant.addAlias(5, 'create_casefile_applicant_individual_aliases');

    expect(applicant.aliasControls).toHaveLength(5);
    expect(applicant.form.controls['create_casefile_applicant_individual_aliases']).toHaveLength(5);
    expect(applicant.form.dirty).toBe(true);
    expect(focusFirstAliasField).toHaveBeenCalledTimes(1);
  });

  it('removes one of two aliases, clears only its errors, prevents navigation and focuses the remaining row', () => {
    applicant.prepareAliases(2);
    applicant.formErrorSummaryMessage = [
      { fieldId: 'create_casefile_applicant_individual_alias_first_names_0', message: 'Keep me' },
      { fieldId: 'create_casefile_applicant_individual_alias_first_names_1', message: 'Remove me' },
    ];
    applicant.formErrors = [
      {
        fieldId: 'create_casefile_applicant_individual_alias_first_names_0',
        message: 'Keep me',
        priority: 1,
        type: 'required',
      },
      {
        fieldId: 'create_casefile_applicant_individual_alias_first_names_1',
        message: 'Remove me',
        priority: 1,
        type: 'required',
      },
    ];
    const focusFirstAliasField = vi.spyOn(applicant, 'focusFirstAliasField').mockImplementation(() => undefined);
    const event = new Event('click', { cancelable: true });

    applicant.removeAlias(1, 'create_casefile_applicant_individual_aliases', event);

    expect(event.defaultPrevented).toBe(true);
    expect(applicant.aliasControls).toHaveLength(1);
    expect(applicant.form.controls['create_casefile_applicant_individual_aliases']).toHaveLength(1);
    expect(applicant.form.dirty).toBe(true);
    expect(applicant.formErrorSummaryMessage).toEqual([
      { fieldId: 'create_casefile_applicant_individual_alias_first_names_0', message: 'Keep me' },
    ]);
    expect(applicant.formErrors).toEqual([
      {
        fieldId: 'create_casefile_applicant_individual_alias_first_names_0',
        message: 'Keep me',
        priority: 1,
        type: 'required',
      },
    ]);
    expect(focusFirstAliasField).toHaveBeenCalledOnce();
  });

  it('maps indexed alias rows to the canonical party alias shape', () => {
    expect(
      applicant.mapAliasRows([
        {
          create_casefile_applicant_individual_alias_first_names_0: 'First',
          create_casefile_applicant_individual_alias_last_name_0: 'Alias',
        },
        {
          create_casefile_applicant_individual_alias_first_names_1: 'Second',
          create_casefile_applicant_individual_alias_last_name_1: 'Person',
        },
      ]),
    ).toEqual([
      { firstNames: 'First', lastName: 'Alias' },
      { firstNames: 'Second', lastName: 'Person' },
    ]);
  });

  it.each([
    [826, 826],
    ['250', 250],
    ['', null],
    [null, null],
  ])('normalises a Country ID of %s to %s', (value, expected) => {
    expect(applicant.normalise(value)).toBe(expected);
  });

  it('stops conditional and alias-error cleanup subscriptions when destroyed', () => {
    applicant.initialiseSharedBehaviour();
    applicant.formErrorSummaryMessage = [
      { fieldId: 'create_casefile_applicant_individual_alias_first_names_0', message: 'Keep after destroy' },
    ];

    applicant.ngOnDestroy();
    applicant.form.controls['create_casefile_applicant_individual_send_correspondence_to_third_party'].setValue(true);
    applicant.form.controls['create_casefile_applicant_individual_add_aliases'].setValue(false);

    expect(
      applicant.form.controls['create_casefile_applicant_individual_third_party_name_or_organisation'].disabled,
    ).toBe(true);
    expect(applicant.formErrorSummaryMessage).toEqual([
      { fieldId: 'create_casefile_applicant_individual_alias_first_names_0', message: 'Keep after destroy' },
    ]);
  });
});
