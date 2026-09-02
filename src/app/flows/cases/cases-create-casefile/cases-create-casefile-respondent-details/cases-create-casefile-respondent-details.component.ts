import { ChangeDetectionStrategy, Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import type { IGovUkSelectOptions } from '@hmcts/opal-frontend-common/components/govuk/govuk-select/interfaces';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from '../services/interfaces/cases-create-casefile-country-reference-data-response.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileRespondentDetailsFormComponent } from './cases-create-casefile-respondent-details-form/cases-create-casefile-respondent-details-form.component';
import type { ICasesCreateCasefileRespondentDetailsForm } from './interfaces/cases-create-casefile-respondent-details-form.interface';
import { CasesCreateCasefileRespondentDetailsMapperService } from './services/cases-create-casefile-respondent-details-mapper.service';

@Component({
  selector: 'app-cases-create-casefile-respondent-details',
  imports: [CasesCreateCasefileRespondentDetailsFormComponent],
  templateUrl: './cases-create-casefile-respondent-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileRespondentDetailsComponent
  extends AbstractFormParentBaseComponent
  implements OnDestroy
{
  private readonly route = inject(ActivatedRoute);
  private readonly mapper = inject(CasesCreateCasefileRespondentDetailsMapperService);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly countries = this.route.snapshot.data[
    'countries'
  ] as ICasesCreateCasefileCountryReferenceDataResponse;

  public readonly countryAutocompleteItems: IAlphagovAccessibleAutocompleteItem[] = this.countries.refData.map(
    ({ country_id, country_name }) => ({ name: country_name, value: country_id }),
  );
  public readonly countrySelectOptions: IGovUkSelectOptions[] = [
    { name: 'Select', value: '' },
    ...this.countries.refData.map(({ country_id, country_name }) => ({ name: country_name, value: country_id })),
  ];
  public readonly initialFormData = this.mapper.toFormData(this.store.respondentDetails());

  public handleFormSubmit(form: ICasesCreateCasefileRespondentDetailsForm): void {
    this.store.setRespondentDetails(this.mapper.toRespondentDetails(form.formData));
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
