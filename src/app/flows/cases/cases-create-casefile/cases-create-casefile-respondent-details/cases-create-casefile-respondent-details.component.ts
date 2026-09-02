import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CasesCreateCasefileFormParentBaseComponent } from '../components/abstract/cases-create-casefile-form-parent-base/cases-create-casefile-form-parent-base.component';
import { CasesCreateCasefileRespondentDetailsFormComponent } from './cases-create-casefile-respondent-details-form/cases-create-casefile-respondent-details-form.component';
import type { ICasesCreateCasefileRespondentDetailsForm } from './interfaces/cases-create-casefile-respondent-details-form.interface';
import { CasesCreateCasefileRespondentDetailsMapperService } from './services/cases-create-casefile-respondent-details-mapper.service';

@Component({
  selector: 'app-cases-create-casefile-respondent-details',
  imports: [CasesCreateCasefileRespondentDetailsFormComponent],
  templateUrl: './cases-create-casefile-respondent-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileRespondentDetailsComponent extends CasesCreateCasefileFormParentBaseComponent {
  private readonly mapper = inject(CasesCreateCasefileRespondentDetailsMapperService);
  public readonly initialFormData = this.mapper.toFormData(this.store.respondentDetails());

  public handleFormSubmit(form: ICasesCreateCasefileRespondentDetailsForm): void {
    this.completeFormSubmission(() => {
      this.store.setRespondentDetails(this.mapper.toRespondentDetails(form.formData));
    });
  }
}
