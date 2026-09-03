import { Directive, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';
import type { IGovUkSelectOptions } from '@hmcts/opal-frontend-common/components/govuk/govuk-select/interfaces';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from '../../../services/interfaces/cases-create-casefile-country-reference-data-response.interface';
import { CasesCreateCasefileStore } from '../../../stores/cases-create-casefile.store';

@Directive()
export abstract class CasesCreateCasefileFormParentBaseComponent
  extends AbstractFormParentBaseComponent
  implements OnDestroy
{
  private readonly route = inject(ActivatedRoute);
  private readonly countries = this.route.snapshot.data[
    'countries'
  ] as ICasesCreateCasefileCountryReferenceDataResponse;
  protected readonly store = inject(CasesCreateCasefileStore);

  public readonly countryAutocompleteItems: IAlphagovAccessibleAutocompleteItem[] = this.countries.refData.map(
    ({ country_id, country_name }) => ({ name: country_name, value: country_id }),
  );
  public readonly countrySelectOptions: IGovUkSelectOptions[] = [
    { name: 'Select', value: '' },
    ...this.countries.refData.map(({ country_id, country_name }) => ({ name: country_name, value: country_id })),
  ];

  protected completeFormSubmission(save: () => void): void {
    save();
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
