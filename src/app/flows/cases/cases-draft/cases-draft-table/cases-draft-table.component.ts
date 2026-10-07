import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, untracked } from '@angular/core';
import { Router } from '@angular/router';
import {
  MojSortableTableComponent,
  MojSortableTableHeaderComponent,
  MojSortableTableRowComponent,
  MojSortableTableRowDataComponent,
  MojSortableTableStatusComponent,
} from '@hmcts/opal-frontend-common/components/moj/moj-sortable-table';
import { AbstractSortableTablePaginationComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-sortable-table-pagination';
import type { IAbstractTableData } from '@hmcts/opal-frontend-common/components/abstract/abstract-sortable-table/interfaces';
import type {
  SortableValuesType,
  SortDirectionType,
} from '@hmcts/opal-frontend-common/components/abstract/abstract-sortable-table/types';
import { MojPaginationComponent } from '@hmcts/opal-frontend-common/components/moj/moj-pagination';
import { DaysAgoPipe } from '@hmcts/opal-frontend-common/pipes/days-ago';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { ICasesDraftRow } from '../interfaces/cases-draft-row.interface';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';
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
export class CasesDraftTableComponent extends AbstractSortableTablePaginationComponent {
  private readonly router = inject(Router);
  private readonly navigation = inject(CasesDraftNavigationService);
  private readonly rowsById = computed(() => new Map(this.rows().map((row) => [row.id, row])));
  public readonly dates = inject(DateService);
  public readonly rows = input.required<readonly ICasesDraftRow[]>();
  public readonly selection = input.required<ICasesDraftNavigation>();
  public readonly sortChanged = output<{ key: CasesDraftSortColumn; direction: ICasesDraftNavigation['direction'] }>();
  public readonly pageChanged = output<number>();
  public readonly rowOpened = output<number>();
  public override paginationPageTitle = 'Create cases';
  public readonly displayRows = computed(() =>
    this.paginatedTableDataComputed().map((item) => {
      const row = this.rowsById().get(Number(item['id']))!;
      return { ...row, detailHref: this.router.serializeUrl(this.navigation.placeholderUrl('details', row.id)) };
    }),
  );
  public readonly tableCaption = computed(() => CASES_DRAFT_TABS[this.selection().tab].label + ' cases');
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
  public readonly pageAnnouncement = computed(() => {
    const count = this.sortedTableDataSignal().length;
    return `Page ${this.currentPageSignal()} of ${Math.max(1, Math.ceil(count / this.itemsPerPageSignal()))}, showing cases ${count ? this.startIndexComputed() : 0} to ${this.endIndexComputed()} of ${count}`;
  });

  constructor() {
    super();
    effect(() => {
      const rows = this.rows();
      const selection = this.selection();
      untracked(() => this.applySelection(rows, selection));
    });
  }

  private applySelection(rows: readonly ICasesDraftRow[], selection: ICasesDraftNavigation): void {
    this.itemsPerPageSignal.set(25);
    this.setTableData(this.tableData(rows));
    this.applyFilterState();
    this.sortStateSignal.set(
      Object.fromEntries(CASES_DRAFT_TABS[selection.tab].columns.map((column) => [column, 'none'])),
    );
    if (selection.direction === 'none') {
      this.sortedTableDataSignal.set(this.tableData(rows));
      this.sortedColumnTitleSignal.set('');
      this.sortedColumnDirectionSignal.set('none');
    } else {
      this.applySort(selection.sort, selection.direction);
    }
    this.currentPageSignal.set(Math.max(1, Math.min(selection.page, Math.ceil(rows.length / 25))));
  }

  /** Shared scalar table data keeps the original creditor sequence available for display and RM comparison. */
  private tableData(rows: readonly ICasesDraftRow[]): IAbstractTableData<SortableValuesType>[] {
    return rows.map((row) => ({ ...row, minorCreditorAccounts: row.minorCreditorAccounts.join(', ') }));
  }

  /** The base owns sort state/page reset; RM additionally requires missing-last, numeric and sequence ordering. */
  private applySort(column: CasesDraftSortColumn, direction: 'ascending' | 'descending'): void {
    super.onSortChange({ key: column, sortType: direction });
    this.sortedTableDataSignal.set(this.tableData(sortCasesDraftRows(this.rows(), column, direction)));
  }

  public override onSortChange(event: { key: string; sortType: SortDirectionType }): void {
    const columns: readonly string[] = CASES_DRAFT_TABS[this.selection().tab].columns;
    if (!columns.includes(event.key) || event.sortType === 'none') return;
    const column = event.key as CasesDraftSortColumn;
    this.applySort(column, event.sortType);
    this.sortChanged.emit({ key: column, direction: event.sortType });
  }

  public override onPageChange(page: number): void {
    const previous = this.currentPageSignal();
    super.onPageChange(page);
    if (this.currentPageSignal() !== previous) this.pageChanged.emit(this.currentPageSignal());
  }

  public openRespondent(event: MouseEvent, id: number): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.rowOpened.emit(id);
  }
}
