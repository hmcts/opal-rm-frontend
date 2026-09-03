import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CasesCreateCasefileFormParentBaseComponent } from '../components/abstract/cases-create-casefile-form-parent-base/cases-create-casefile-form-parent-base.component';
import { CasesCreateCasefileApplicantOrganisationFormComponent } from './cases-create-casefile-applicant-organisation-form/cases-create-casefile-applicant-organisation-form.component';
import type { ICasesCreateCasefileApplicantOrganisationForm } from './interfaces/cases-create-casefile-applicant-organisation-form.interface';
import { CasesCreateCasefileApplicantOrganisationMapperService } from './services/cases-create-casefile-applicant-organisation-mapper.service';

@Component({
  selector: 'app-cases-create-casefile-applicant-organisation',
  imports: [CasesCreateCasefileApplicantOrganisationFormComponent],
  templateUrl: './cases-create-casefile-applicant-organisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileApplicantOrganisationComponent extends CasesCreateCasefileFormParentBaseComponent {
  private readonly mapper = inject(CasesCreateCasefileApplicantOrganisationMapperService);
  public readonly initialFormData = this.mapper.toFormData(this.store.applicantDetails());

  public handleFormSubmit(form: ICasesCreateCasefileApplicantOrganisationForm): void {
    this.completeFormSubmission(() => {
      this.store.setApplicantDetails(this.mapper.toApplicantDetails(form.formData));
    });
  }
}
