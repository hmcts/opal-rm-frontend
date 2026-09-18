import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import type { CasesCreateCasefileApplicantDetails } from '../types/cases-create-casefile-applicant-details.type';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermCreditorFormComponent } from './cases-create-casefile-order-term-creditor-form/cases-create-casefile-order-term-creditor-form.component';
import type { ICasesCreateCasefileMajorCreditorsLoadState } from './interfaces/cases-create-casefile-major-creditors-load-state.interface';
import type { CasesCreateCasefileMajorCreditorsLoadService } from './services/cases-create-casefile-major-creditors-load.service';
import { creditorFormValue } from './utils/cases-create-casefile-creditor-form-value';

const LOADING_STATE: ICasesCreateCasefileMajorCreditorsLoadState = {
  status: 'loading',
  records: [],
  correlationReference: null,
};

function applicantLabel(details: CasesCreateCasefileApplicantDetails | null): string {
  if (!details) return 'Applicant (Applicant)';
  const name =
    'organisationName' in details
      ? details.organisationName
      : [details.title, details.firstNames, details.lastName]
          .map((part) => part?.trim())
          .filter(Boolean)
          .join(' ');
  return `${name} (Applicant)`;
}

@Component({
  selector: 'app-cases-create-casefile-order-term-creditor',
  imports: [CasesCreateCasefileOrderTermCreditorFormComponent],
  templateUrl: './cases-create-casefile-order-term-creditor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermCreditorComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CasesCreateCasefileStore);
  public readonly owner = signal<CasesCreateCasefileMajorCreditorsLoadService | null>(null);
  public readonly loadState = computed(() => this.owner()?.state() ?? LOADING_STATE);
  public readonly applicantLabel = computed(() => applicantLabel(this.store.applicantDetails()));
  public readonly minorCreditors = this.store.minorCreditors;
  public readonly initialFormData = computed(() => {
    const termId = this.store.currentOrderTermId();
    const term = this.store.orderTerms().find((candidate) => candidate.termId === termId);
    return creditorFormValue(term?.creditor ?? null, this.store.creditorDraft()?.termId === termId);
  });

  public constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      const nextOwner = data['majorCreditors'] as CasesCreateCasefileMajorCreditorsLoadService | undefined;
      if (!nextOwner || nextOwner === this.owner()) return;
      this.owner()?.dispose();
      this.owner.set(nextOwner);
    });
  }

  public handleRetry(): void {
    this.owner()?.load();
  }

  public ngOnDestroy(): void {
    this.owner()?.dispose();
  }
}
