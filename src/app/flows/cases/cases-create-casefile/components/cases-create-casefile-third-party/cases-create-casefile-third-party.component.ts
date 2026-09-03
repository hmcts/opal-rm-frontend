import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AbstractNestedFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-nested-form-base';
import type { IAbstractFormControlErrorMessage } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import {
  GovukCheckboxesComponent,
  GovukCheckboxesConditionalComponent,
  GovukCheckboxesItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-checkboxes';
import { GovukSelectComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-select';
import type { IGovUkSelectOptions } from '@hmcts/opal-frontend-common/components/govuk/govuk-select/interfaces';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import { CasesCreateCasefileAddressTextFieldsComponent } from '../cases-create-casefile-address-text-fields/cases-create-casefile-address-text-fields.component';
import type { ICasesCreateCasefileThirdPartyFieldNames } from './interfaces/cases-create-casefile-third-party-field-names.interface';

@Component({
  selector: 'app-cases-create-casefile-third-party',
  imports: [
    GovukCheckboxesComponent,
    GovukCheckboxesConditionalComponent,
    GovukCheckboxesItemComponent,
    GovukSelectComponent,
    GovukTextInputComponent,
    CasesCreateCasefileAddressTextFieldsComponent,
  ],
  templateUrl: './cases-create-casefile-third-party.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileThirdPartyComponent extends AbstractNestedFormBaseComponent {
  @Input({ required: true }) public override form!: FormGroup;
  @Input({ required: true }) public override formControlErrorMessages!: IAbstractFormControlErrorMessage;
  @Input({ required: true }) public fieldNames!: ICasesCreateCasefileThirdPartyFieldNames;
  @Input({ required: true }) public checkboxFieldName!: string;
  @Input({ required: true }) public checkboxFieldsetId!: string;
  @Input({ required: true }) public conditionalId!: string;
  @Input({ required: true }) public countrySelectOptions!: IGovUkSelectOptions[];
  public relationshipLabel!: string;

  @Input({ required: true }) public set roleLabel(roleLabel: 'applicant' | 'respondent') {
    this.relationshipLabel = `Relationship to the ${roleLabel}`;
  }
}
