import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermsSelectFormComponent } from './cases-create-casefile-order-terms-select-form/cases-create-casefile-order-terms-select-form.component';
import type { ICasesCreateCasefileOrderTermsSelectFormData } from './interfaces/cases-create-casefile-order-terms-select-form-data.interface';
import type { ICasesCreateCasefileOrderTermsSelectForm } from './interfaces/cases-create-casefile-order-terms-select-form.interface';
import type { CasesCreateCasefileOrderTermsLoadService } from './services/cases-create-casefile-order-terms-load.service';

@Component({
  selector: 'app-cases-create-casefile-order-terms-select',
  imports: [GovukBackLinkComponent, CasesCreateCasefileOrderTermsSelectFormComponent],
  templateUrl: './cases-create-casefile-order-terms-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermsSelectComponent extends AbstractFormParentBaseComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  public readonly owner = this.route.snapshot.data['orderTerms'] as CasesCreateCasefileOrderTermsLoadService;
  public readonly initialFormData: ICasesCreateCasefileOrderTermsSelectFormData = {
    create_casefile_order_terms_select_result_id: this.store.pendingOrderTermResultId(),
  };

  public constructor() {
    super();
    effect(() => {
      const state = this.owner.state();
      untracked(() => {
        const saved = this.store.pendingOrderTermResultId();
        if (
          (state.status === 'ready' || state.status === 'empty') &&
          saved &&
          !state.records.some((record) => record.result_id === saved)
        ) {
          this.store.setPendingOrderTermResultId(null);
        }
      });
    });
  }

  public handleFormSubmit(form: ICasesCreateCasefileOrderTermsSelectForm): void {
    const state = this.owner.state();
    const id = form.formData.create_casefile_order_terms_select_result_id;
    if (state.status !== 'ready' || !id || !state.records.some((record) => record.result_id === id)) return;
    this.store.setPendingOrderTermResultId(id);
    this.handleUnsavedChanges(false);
    this.routerNavigate(
      '/' + this.paths.root + '/' + this.paths.children.orderTermsInput + '/' + encodeURIComponent(id),
      true,
    );
  }

  public handleUnsavedChanges(changed: boolean): void {
    this.stateUnsavedChanges = changed;
    this.store.setUnsavedChanges(changed);
  }

  public handleCancel(): void {
    this.routerNavigate('/' + this.paths.root + '/' + this.paths.children.orderTermsSummary, true);
  }

  public ngOnDestroy(): void {
    this.owner.dispose();
    this.store.setUnsavedChanges(false);
  }
}
