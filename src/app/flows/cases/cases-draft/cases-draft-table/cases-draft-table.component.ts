import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  MojSortableTableComponent,
  MojSortableTableHeaderComponent,
  MojSortableTableRowComponent,
  MojSortableTableRowDataComponent,
  MojSortableTableStatusComponent,
} from '@hmcts/opal-frontend-common/components/moj/moj-sortable-table';
import { MojPaginationComponent } from '@hmcts/opal-frontend-common/components/moj/moj-pagination';
import { DaysAgoPipe } from '@hmcts/opal-frontend-common/pipes/days-ago';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { ICasesDraftRow } from '../interfaces/cases-draft-row.interface';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';
import type { CasesDraftSortDirection } from '../types/cases-draft-sort-direction.type';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { sortCasesDraftRows } from '../utils/cases-draft-sort';

@Component({
  selector: 'app-cases-draft-table',
  imports: [
    MojSortableTableComponent,
    MojSortableTableHeaderComponent,
    MojSortableTableRowComponent,
    MojSortableTableRowDataComponent,
    MojSortableTableStatusComponent,
    MojPaginationComponent,
    DaysAgoPipe,
  ],
  templateUrl: './cases-draft-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftTableComponent {
  private readonly router = inject(Router);
  private readonly navigation = inject(CasesDraftNavigationService);
  private readonly injector = inject(Injector);
  private readonly firstCells = viewChildren('pageFocus', { read: ElementRef<HTMLElement> });
  public readonly dates = inject(DateService);
  public readonly rows = input.required<readonly ICasesDraftRow[]>();
  public readonly selection = input.required<ICasesDraftNavigation>();
  public readonly sortChanged = output<{ key: CasesDraftSortColumn; direction: CasesDraftSortDirection }>();
  public readonly pageChanged = output<number>();
  public readonly rowOpened = output<number>();
  public readonly sortedRows = computed(() =>
    sortCasesDraftRows(this.rows(), this.selection().sort, this.selection().direction),
  );
  public readonly clampedPage = computed(() =>
    Math.max(1, Math.min(this.selection().page, Math.ceil(this.rows().length / 25))),
  );
  public readonly visibleRows = computed(() =>
    this.sortedRows().slice((this.clampedPage() - 1) * 25, this.clampedPage() * 25),
  );
  public readonly displayRows = computed(() =>
    this.visibleRows().map((row) => ({
      ...row,
      detailHref: this.router.serializeUrl(this.navigation.placeholderUrl('details', row.id)),
    })),
  );
  public readonly tableCaption = computed(() => CASES_DRAFT_TABS[this.selection().tab].label + ' cases');
  public readonly sortState = computed(
    () =>
      ({
        respondent: 'none',
        applicant: 'none',
        caseType: 'none',
        created: 'none',
        statusDate: 'none',
        respondentAccount: 'none',
        applicantAccount: 'none',
        minorCreditorAccounts: 'none',
        approved: 'none',
        [this.selection().sort]: this.selection().direction,
      }) as Record<CasesDraftSortColumn, CasesDraftSortDirection | 'none'>,
  );
  public readonly sortTitle = computed(
    () =>
      ({
        respondent: 'Respondent',
        applicant: 'Applicant',
        caseType: 'Case type',
        created: 'Created',
        statusDate: this.selection().tab === 'rejected' ? 'Rejected' : 'Deleted',
        respondentAccount: 'Respondent Account',
        applicantAccount: 'Applicant Account',
        minorCreditorAccounts: 'Minor Creditor Account',
        approved: 'Approved',
      })[this.selection().sort],
  );
  public readonly pageAnnouncement = computed(
    () =>
      `Page ${this.clampedPage()} of ${Math.max(1, Math.ceil(this.rows().length / 25))}, showing cases ${this.rows().length ? (this.clampedPage() - 1) * 25 + 1 : 0} to ${Math.min(this.clampedPage() * 25, this.rows().length)} of ${this.rows().length}`,
  );
  public onSort(event: { key: string; sortType: CasesDraftSortDirection }): void {
    const columns: readonly string[] = CASES_DRAFT_TABS[this.selection().tab].columns;
    if (columns.includes(event.key))
      this.sortChanged.emit({ key: event.key as CasesDraftSortColumn, direction: event.sortType });
  }
  public openRespondent(event: MouseEvent, id: number): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.rowOpened.emit(id);
  }
  /** Called only after accepted user paging; background refreshes never move focus. */
  public focusFirstRow(): void {
    afterNextRender(() => this.firstCells()[0]?.nativeElement.focus(), { injector: this.injector });
  }
}
