import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import type { CasesCreateCasefileMajorCreditorsLoadService } from './services/cases-create-casefile-major-creditors-load.service';

@Component({
  selector: 'app-cases-create-casefile-order-term-creditor',
  imports: [RouterLink],
  templateUrl: './cases-create-casefile-order-term-creditor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermCreditorComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  public owner!: CasesCreateCasefileMajorCreditorsLoadService;
  public readonly summaryPath =
    '/' +
    CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
    '/' +
    CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSummary;

  public constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      const nextOwner = data['majorCreditors'] as CasesCreateCasefileMajorCreditorsLoadService | undefined;
      if (!nextOwner || nextOwner === this.owner) return;
      this.owner?.dispose();
      this.owner = nextOwner;
    });
  }

  public ngOnDestroy(): void {
    this.owner?.dispose();
  }
}
