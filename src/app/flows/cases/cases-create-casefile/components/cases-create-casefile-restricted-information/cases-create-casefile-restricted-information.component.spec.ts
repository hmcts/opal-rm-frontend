import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import {
  GovukCheckboxesComponent,
  GovukCheckboxesConditionalComponent,
  GovukCheckboxesItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-checkboxes';
import { GovukTextAreaComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-area';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileRestrictedInformationComponent } from './cases-create-casefile-restricted-information.component';

describe('CasesCreateCasefileRestrictedInformationComponent', () => {
  const checkboxFieldName = 'party_restricted_information';
  const reasonFieldName = 'party_restricted_information_reason';
  const checkboxFieldsetId = 'party_restricted_information_fieldset';
  const conditionalId = 'partyRestrictedInformationConditional';
  const errors = { [reasonFieldName]: 'Enter a reason' };

  let fixture: ComponentFixture<CasesCreateCasefileRestrictedInformationComponent>;
  let component: CasesCreateCasefileRestrictedInformationComponent;
  let form: FormGroup;

  const configureComponent = (checkboxLabel: string): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileRestrictedInformationComponent);
    component = fixture.componentInstance;
    component.form = form;
    component.formControlErrorMessages = errors;
    component.checkboxFieldName = checkboxFieldName;
    component.reasonFieldName = reasonFieldName;
    component.checkboxFieldsetId = checkboxFieldsetId;
    component.conditionalId = conditionalId;
    component.checkboxLabel = checkboxLabel;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileRestrictedInformationComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    form = new FormGroup({
      [checkboxFieldName]: new FormControl(false, { nonNullable: true }),
      [reasonFieldName]: new FormControl(null),
    });
  });

  it.each(['Applicant’s personal information should not be shared', 'Restrict the respondent’s personal information'])(
    'renders the exact unchecked checkbox contract for "%s" without a reason field',
    (checkboxLabel) => {
      configureComponent(checkboxLabel);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('h2')?.textContent?.trim()).toBe('Restricted information');

      const checkboxes = fixture.debugElement.query(By.directive(GovukCheckboxesComponent))
        .componentInstance as GovukCheckboxesComponent;
      expect({ fieldSetId: checkboxes.fieldSetId, legendText: checkboxes.legendText }).toEqual({
        fieldSetId: checkboxFieldsetId,
        legendText: '',
      });

      const checkbox = fixture.debugElement.query(By.directive(GovukCheckboxesItemComponent))
        .componentInstance as GovukCheckboxesItemComponent;
      expect({
        labelText: checkbox.labelText,
        inputId: checkbox.inputId,
        inputName: checkbox.inputName,
        ariaControls: checkbox.ariaControls,
      }).toEqual({
        labelText: checkboxLabel,
        inputId: checkboxFieldName,
        inputName: checkboxFieldName,
        ariaControls: `${conditionalId}-conditional`,
      });
      expect(checkbox.getControl).toBe(form.get(checkboxFieldName));
      expect(fixture.debugElement.query(By.directive(GovukCheckboxesConditionalComponent))).toBeNull();
      expect(fixture.debugElement.query(By.directive(GovukTextAreaComponent))).toBeNull();
    },
  );

  it('renders the checked conditional Reason with its exact ID, control, error and character-count contract', () => {
    configureComponent('Applicant’s personal information should not be shared');
    form.get(checkboxFieldName)?.setValue(true);
    fixture.detectChanges();

    const conditional = fixture.debugElement.query(By.directive(GovukCheckboxesConditionalComponent))
      .componentInstance as GovukCheckboxesConditionalComponent;
    expect(conditional.conditionalId).toBe(conditionalId);
    expect(conditional.id).toBe(`${conditionalId}-conditional`);

    const reason = fixture.debugElement.query(By.directive(GovukTextAreaComponent))
      .componentInstance as GovukTextAreaComponent;
    expect({
      labelText: reason.labelText,
      labelClasses: reason.labelClasses,
      inputId: reason.inputId,
      inputName: reason.inputName,
      rows: reason.rows,
      characterCountEnabled: reason.characterCountEnabled,
      maxCharacterLimit: reason.maxCharacterLimit,
    }).toEqual({
      labelText: 'Reason',
      labelClasses: 'govuk-label--s',
      inputId: reasonFieldName,
      inputName: reasonFieldName,
      rows: 5,
      characterCountEnabled: true,
      maxCharacterLimit: 250,
    });
    expect(reason.getControl).toBe(form.get(reasonFieldName));
    expect(reason.errors).toBe(errors[reasonFieldName]);
  });
});
