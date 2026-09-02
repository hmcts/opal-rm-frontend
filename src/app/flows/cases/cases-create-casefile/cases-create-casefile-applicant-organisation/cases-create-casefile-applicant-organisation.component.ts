import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from '../services/interfaces/cases-create-casefile-country-reference-data-response.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileApplicantOrganisationFormComponent } from './cases-create-casefile-applicant-organisation-form/cases-create-casefile-applicant-organisation-form.component';
import type { ICasesCreateCasefileApplicantOrganisationForm } from './interfaces/cases-create-casefile-applicant-organisation-form.interface';
import { CasesCreateCasefileApplicantOrganisationMapperService } from './services/cases-create-casefile-applicant-organisation-mapper.service';

@Component({
  selector: 'app-cases-create-casefile-applicant-organisation',
  imports: [CasesCreateCasefileApplicantOrganisationFormComponent],
  templateUrl: './cases-create-casefile-applicant-organisation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileApplicantOrganisationComponent
  extends AbstractFormParentBaseComponent
  implements OnDestroy
{
  private readonly route = inject(ActivatedRoute);
  private readonly mapper = inject(CasesCreateCasefileApplicantOrganisationMapperService);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly countries = this.route.snapshot.data[
    'countries'
  ] as ICasesCreateCasefileCountryReferenceDataResponse;

  public readonly countryAutocompleteItems: IAlphagovAccessibleAutocompleteItem[] = this.countries.refData.map(
    ({ country_id, country_name }) => ({ name: country_name, value: country_id }),
  );
  public readonly initialFormData = this.mapper.toFormData(this.store.applicantDetails());

  public handleFormSubmit(form: ICasesCreateCasefileApplicantOrganisationForm): void {
    this.store.setApplicantDetails(this.mapper.toApplicantDetails(form.formData));
    this.stateUnsavedChanges = false;
    this.routerNavigate('/cases/create-casefile/task-list', true);
  }

  public handleUnsavedChanges(unsavedChanges: boolean): void {
    this.store.setUnsavedChanges(unsavedChanges);
    this.stateUnsavedChanges = unsavedChanges;
  }

  public handleCancel(): void {
    this.routerNavigate('/cases/create-casefile/task-list', true);
  }

  public ngOnDestroy(): void {
    this.store.setUnsavedChanges(false);
  }
}
