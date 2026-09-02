import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AbstractNestedFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-nested-form-base';
import type { IAbstractFormControlErrorMessage } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import {
  GovukCheckboxesComponent,
  GovukCheckboxesConditionalComponent,
  GovukCheckboxesItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-checkboxes';
import { GovukTextAreaComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-area';

@Component({
  selector: 'app-cases-create-casefile-restricted-information',
  imports: [
    GovukCheckboxesComponent,
    GovukCheckboxesConditionalComponent,
    GovukCheckboxesItemComponent,
    GovukTextAreaComponent,
  ],
  templateUrl: './cases-create-casefile-restricted-information.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileRestrictedInformationComponent extends AbstractNestedFormBaseComponent {
  @Input({ required: true }) public override form!: FormGroup;
  @Input({ required: true }) public override formControlErrorMessages!: IAbstractFormControlErrorMessage;
  @Input({ required: true }) public checkboxFieldName!: string;
  @Input({ required: true }) public reasonFieldName!: string;
  @Input({ required: true }) public checkboxFieldsetId!: string;
  @Input({ required: true }) public conditionalId!: string;
  @Input({ required: true }) public checkboxLabel!: string;
}
