import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CasesCreateCasefileFormParentBaseComponent } from '../components/abstract/cases-create-casefile-form-parent-base/cases-create-casefile-form-parent-base.component';
import { CasesCreateCasefileApplicantIndividualFormComponent } from './cases-create-casefile-applicant-individual-form/cases-create-casefile-applicant-individual-form.component';
import type { ICasesCreateCasefileApplicantIndividualForm } from './interfaces/cases-create-casefile-applicant-individual-form.interface';
import { CasesCreateCasefileApplicantIndividualMapperService } from './services/cases-create-casefile-applicant-individual-mapper.service';

@Component({
  selector: 'app-cases-create-casefile-applicant-individual',
  imports: [CasesCreateCasefileApplicantIndividualFormComponent],
  templateUrl: './cases-create-casefile-applicant-individual.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileApplicantIndividualComponent extends CasesCreateCasefileFormParentBaseComponent {
  private readonly mapper = inject(CasesCreateCasefileApplicantIndividualMapperService);
  public readonly initialFormData = this.mapper.toFormData(this.store.applicantDetails());

  public handleFormSubmit(form: ICasesCreateCasefileApplicantIndividualForm): void {
    this.completeFormSubmission(() => {
      this.store.setApplicantDetails(this.mapper.toApplicantDetails(form.formData));
    });
  }
}
