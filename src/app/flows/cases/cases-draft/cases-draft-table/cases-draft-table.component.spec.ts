import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CasesDraftTableComponent } from './cases-draft-table.component';
import { defaultCasesDraftNavigation } from '../utils/cases-draft-navigation';
import { mapCasesDraftRows } from '../utils/cases-draft-summary';
import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import type { CasesDraftTab, CasesDraftCheckerTab } from '../types/cases-draft-tab.type';

describe('CasesDraftTableComponent rendered table', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CasesDraftTableComponent],
      providers: [
        provideRouter([]),
        {
          provide: GlobalStore,
          useValue: { authenticated: signal(false), userState: signal(null), featureFlags: signal({}) },
        },
      ],
    }),
  );
  function render(tab: CasesDraftTab = 'in-review', count = 1, page = 1) {
    const fixture = TestBed.createComponent(CasesDraftTableComponent);
    fixture.componentRef.setInput('selection', { ...defaultCasesDraftNavigation(tab), page });
    fixture.componentRef.setInput(
      'rows',
      mapCasesDraftRows(
        Array.from({ length: count }, (_, i) =>
          createCasesDraftSummary({
            draft_casefile_id: i + 1,
            casefile_status:
              tab === 'approved'
                ? 'PUBLISHED'
                : tab === 'rejected'
                  ? 'REJECTED'
                  : tab === 'deleted'
                    ? 'DELETED'
                    : 'RESUBMITTED',
            validated_date: '2026-10-01T10:00:00Z',
            casefile_snapshot: {
              respondent_account: { respondent_name: `Synthetic ${i}`, account_number: '000123A' },
              applicant_account: { account_number: null },
              minor_creditor_accounts: [{ account_number: 'M10' }, { account_number: 'M2' }],
            },
          }),
        ),
        tab,
      ),
    );
    fixture.detectChanges();
    return fixture;
  }
  it.each([
    ['in-review', ['Respondent', 'Applicant', 'Case type', 'Created']],
    ['rejected', ['Respondent', 'Applicant', 'Case type', 'Created', 'Rejected']],
    ['deleted', ['Respondent', 'Applicant', 'Case type', 'Created', 'Deleted']],
    ['approved', ['Respondent Account', 'Applicant Account', 'Minor Creditor Account', 'Case type', 'Approved']],
  ] as const)('renders exact %s columns', (tab, columns) => {
    expect(
      Array.from(render(tab).nativeElement.querySelectorAll('th')).map((el: unknown) =>
        (el as HTMLElement).textContent?.trim(),
      ),
    ).toEqual(columns);
  });
  it('names each native table region and leaves keyboard focus on its sort controls', () => {
    const element: HTMLElement = render().nativeElement;
    const region = element.querySelector('#cases-draft-table-scroll');
    expect(region?.tagName).toBe('SECTION');
    expect(region?.getAttribute('aria-label')).toBe('In review cases');
    expect(region?.hasAttribute('role')).toBe(false);
    expect(region?.hasAttribute('tabindex')).toBe(false);
    expect(region?.querySelectorAll('th button')).toHaveLength(4);
  });
  it('renders published accounts as text in snapshot order', () => {
    const element: HTMLElement = render('approved').nativeElement;
    expect(element.querySelector('[data-column="respondentAccount"]')?.textContent?.trim()).toBe('000123A');
    expect(element.querySelector('[data-column="applicantAccount"]')?.textContent?.trim()).toBe('—');
    expect(Array.from(element.querySelectorAll('li')).map((el) => el.textContent?.trim())).toEqual(['M10', 'M2']);
    expect(element.querySelectorAll('tbody a, tbody button')).toHaveLength(0);
  });
  it('uses shared sort buttons and emits both directions without mutating rows', () => {
    const fixture = render();
    const emit = vi.spyOn(fixture.componentInstance.sortChanged, 'emit');
    const button = fixture.nativeElement.querySelector('th button') as HTMLButtonElement;
    button.click();
    expect(emit).toHaveBeenCalledWith({ key: 'respondent', direction: 'ascending' });
    fixture.componentRef.setInput('selection', {
      ...defaultCasesDraftNavigation(),
      sort: 'respondent',
      direction: 'ascending',
    });
    fixture.detectChanges();
    expect(button.closest('th')?.getAttribute('aria-sort')).toBe('ascending');
    button.click();
    expect(emit).toHaveBeenLastCalledWith({ key: 'respondent', direction: 'descending' });
    fixture.componentInstance.onSortChange({ key: 'approved', sortType: 'ascending' });
    expect(emit).toHaveBeenCalledTimes(2);
  });
  it('keeps inactive column state as none and allows an entirely unsorted table', () => {
    const fixture = render();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('th[columnKey="created"]')?.getAttribute('aria-sort')).toBe('ascending');
    expect(element.querySelector('th[columnKey="respondent"]')?.getAttribute('aria-sort')).toBe('none');
    expect(element.querySelectorAll('th[aria-sort="ascending"], th[aria-sort="descending"]')).toHaveLength(1);
    fixture.componentRef.setInput('selection', { ...defaultCasesDraftNavigation(), direction: 'none' });
    fixture.detectChanges();
    expect(element.querySelectorAll('th[aria-sort="none"]')).toHaveLength(4);
    expect(fixture.componentInstance.sortedColumnDirectionSignal()).toBe('none');
  });

  it('retains numeric, missing-last and stable-ID ordering through shared table sorting', () => {
    const fixture = render('approved', 0);
    fixture.componentRef.setInput(
      'rows',
      mapCasesDraftRows(
        [
          createCasesDraftSummary({
            draft_casefile_id: 3,
            casefile_status: 'PUBLISHED',
            casefile_snapshot: { respondent_account: { account_number: 'A10' } },
          }),
          createCasesDraftSummary({
            draft_casefile_id: 2,
            casefile_status: 'PUBLISHED',
            casefile_snapshot: { respondent_account: { account_number: 'A2' } },
          }),
          createCasesDraftSummary({
            draft_casefile_id: 1,
            casefile_status: 'PUBLISHED',
            casefile_snapshot: { respondent_account: { account_number: 'A2' } },
          }),
          createCasesDraftSummary({
            draft_casefile_id: 4,
            casefile_status: 'PUBLISHED',
            casefile_snapshot: { respondent_account: { account_number: null } },
          }),
        ],
        'approved',
      ),
    );
    fixture.componentRef.setInput('selection', {
      ...defaultCasesDraftNavigation('approved'),
      sort: 'respondentAccount',
      direction: 'descending',
    });
    fixture.detectChanges();
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('tbody tr')).map(
        (element) => (element as HTMLElement).dataset['draftId'],
      ),
    ).toEqual(['3', '1', '2', '4']);
  });

  it('paginates 26 rows and clamps shrinking results', () => {
    const fixture = render('in-review', 26, 2);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(el.querySelector('output')?.textContent).toContain('Page 2 of 2, showing cases 26 to 26 of 26');
    fixture.componentRef.setInput('rows', mapCasesDraftRows([createCasesDraftSummary()], 'in-review'));
    fixture.detectChanges();
    expect(el.querySelector('output')?.textContent).toContain('Page 1 of 1');
    expect(el.querySelector('opal-lib-moj-pagination')).toBeNull();
  });
  it('ignores an unsorted event from the shared table', () => {
    const fixture = render();
    const emit = vi.spyOn(fixture.componentInstance.sortChanged, 'emit');
    fixture.componentInstance.onSortChange({ key: 'respondent', sortType: 'none' });
    expect(emit).not.toHaveBeenCalled();
  });
  it('omits pagination at 25 rows and opens only respondent links', () => {
    const fixture = render('in-review', 25);
    const emit = vi.spyOn(fixture.componentInstance.rowOpened, 'emit');
    expect(fixture.nativeElement.querySelector('opal-lib-moj-pagination')).toBeNull();
    const link = fixture.nativeElement.querySelector('tbody a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toContain('/cases/create-casefile/check-case-details/');
    link.click();
    expect(emit).toHaveBeenCalled();
  });
  it('renders missing approved dates as an em dash', () => {
    const fixture = render('approved');
    fixture.componentRef.setInput(
      'rows',
      mapCasesDraftRows([createCasesDraftSummary({ casefile_status: 'PUBLISHED' })], 'approved'),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-column="approved"]').textContent.trim()).toBe('—');
  });
  it('preserves native modified respondent activation', () => {
    const f = render();
    const emit = vi.spyOn(f.componentInstance.rowOpened, 'emit');
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const event = new MouseEvent('click', { ...options, cancelable: true });
      f.componentInstance.openRespondent(event, 1);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(emit).not.toHaveBeenCalled();
  });
  it('keeps original Created and uses validated Approved dates', () => {
    const f = render();
    expect(f.nativeElement.querySelector('[data-column="created"]').textContent).toContain('ago');
    const created = f.componentInstance.dates.getDaysAgo('2026-09-01T10:00:00Z');
    expect(f.nativeElement.querySelector('[data-column="created"]').textContent).toContain(String(created));
    f.componentRef.setInput('selection', defaultCasesDraftNavigation('approved'));
    f.componentRef.setInput(
      'rows',
      mapCasesDraftRows(
        [createCasesDraftSummary({ casefile_status: 'PUBLISHED', validated_date: '2026-10-01T10:00:00Z' })],
        'approved',
      ),
    );
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-column="approved"]').textContent).toContain(
      String(f.componentInstance.dates.getDaysAgo('2026-10-01T10:00:00Z')),
    );
  });
  it('announces zero results without a phantom row or page', () => {
    const f = render('in-review', 0, 4);
    expect(f.nativeElement.querySelectorAll('tbody tr')).toHaveLength(0);
    expect(f.nativeElement.querySelector('output').textContent).toContain('Page 1 of 1, showing cases 0 to 0 of 0');
  });
  it('announces paging and focuses the first read-only account cell through shared pagination', async () => {
    const f = render('approved', 26);
    f.componentInstance.onPageChange(2);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.currentPageSignal()).toBe(2);
    expect(f.componentInstance.pageChangeAnnouncement()).toBe('Create cases, page 2 of 2');
    expect(f.nativeElement.querySelector('[data-draft-id="26"]')).not.toBeNull();
    expect(document.activeElement).toBe(f.nativeElement.querySelector('[data-column="respondentAccount"]'));
  });
  it('does not navigate again when shared pagination keeps the current page', () => {
    const fixture = render('in-review', 26);
    const emit = vi.spyOn(fixture.componentInstance.pageChanged, 'emit');
    fixture.componentInstance.onPageChange(1);
    expect(fixture.componentInstance.currentPageSignal()).toBe(1);
    expect(emit).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(25);
  });
});

describe('checker rendered table', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CasesDraftTableComponent],
      providers: [
        provideRouter([]),
        { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
        {
          provide: GlobalStore,
          useValue: { authenticated: signal(false), userState: signal(null), featureFlags: signal({}) },
        },
      ],
    }),
  );
  function render(tab: CasesDraftCheckerTab = 'to-review', count = 1) {
    const fixture = TestBed.createComponent(CasesDraftTableComponent);
    fixture.componentRef.setInput('selection', defaultCasesDraftNavigation(tab, 'checker'));
    fixture.componentRef.setInput(
      'rows',
      mapCasesDraftRows(
        Array.from({ length: count }, (_, i) =>
          createCasesDraftSummary({
            draft_casefile_id: i + 1,
            submitted_by: 'BUU-OTHER',
            submitted_by_name: i === 0 ? 'Synthetic submitter' : null,
            casefile_status:
              tab === 'failed'
                ? 'PUBLISHING_FAILED'
                : tab === 'deleted'
                  ? 'DELETED'
                  : tab === 'rejected'
                    ? 'REJECTED'
                    : 'SUBMITTED',
          }),
        ),
        tab,
        'checker',
      ),
    );
    fixture.detectChanges();
    return fixture;
  }
  it.each(['to-review', 'rejected', 'deleted', 'failed'] as const)(
    'renders exact checker %s columns and destination',
    (tab) => {
      const element: HTMLElement = render(tab).nativeElement;
      expect(Array.from(element.querySelectorAll('th')).map((cell) => cell.textContent?.trim())).toEqual([
        'Respondent',
        'Applicant',
        'Case type',
        'Submitted by',
        'Created',
        ...(tab === 'to-review' ? [] : [tab[0].toUpperCase() + tab.slice(1)]),
      ]);
      expect(element.querySelector('[data-column="submittedByName"]')?.textContent?.trim()).toBe('Synthetic submitter');
      expect(element.querySelector('tbody a')?.getAttribute('href')).toContain(
        '/check-and-validate/' + (tab === 'to-review' ? 'review' : 'view') + '/1',
      );
    },
  );
  it('displays missing submitter fallback and sorts names with missing last', () => {
    const fixture = render('to-review', 2);
    expect(fixture.nativeElement.querySelectorAll('[data-column="submittedByName"]')[1].textContent.trim()).toBe('—');
    const emit = vi.spyOn(fixture.componentInstance.sortChanged, 'emit');
    fixture.nativeElement.querySelector('th[columnKey="submittedByName"] button').click();
    expect(emit).toHaveBeenCalledWith({ key: 'submittedByName', direction: 'ascending' });
    expect(fixture.nativeElement.querySelector('tbody tr').getAttribute('data-draft-id')).toBe('1');
  });
  it('paginates checker rows and announces Review cases', () => {
    const fixture = render('to-review', 26);
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(25);
    fixture.componentInstance.onPageChange(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('output').textContent).toContain('Review cases, page 2 of 2');
  });
  it('orders original creation oldest first with deterministic ID ties', () => {
    const fixture = TestBed.createComponent(CasesDraftTableComponent);
    fixture.componentRef.setInput('selection', defaultCasesDraftNavigation('to-review', 'checker'));
    fixture.componentRef.setInput(
      'rows',
      mapCasesDraftRows(
        [
          createCasesDraftSummary({ draft_casefile_id: 3, created_date: '2026-10-03T10:00:00Z' }),
          createCasesDraftSummary({ draft_casefile_id: 2, created_date: '2026-10-01T10:00:00Z' }),
          createCasesDraftSummary({ draft_casefile_id: 1, created_date: '2026-10-01T10:00:00Z' }),
        ],
        'to-review',
        'checker',
      ),
    );
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(Array.from(element.querySelectorAll('tbody tr')).map((row) => row.getAttribute('data-draft-id'))).toEqual([
      '1',
      '2',
      '3',
    ]);
  });
  it('announces page one and the selected sort after sorting from checker page two', () => {
    const fixture = render('to-review', 26);
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentInstance.onPageChange(2);
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.querySelector('output')?.textContent).toContain('Review cases, page 2 of 2');

    (element.querySelector('th[columnKey="respondent"] button') as HTMLButtonElement).click();
    fixture.componentRef.setInput('selection', {
      ...defaultCasesDraftNavigation('to-review', 'checker'),
      sort: 'respondent',
      direction: 'ascending',
    });
    fixture.detectChanges();

    expect(element.querySelectorAll('tbody tr')).toHaveLength(25);
    expect(element.querySelector('th[columnKey="respondent"]')?.getAttribute('aria-sort')).toBe('ascending');
    expect(element.querySelector('output')?.textContent).toContain('Page 1 of 2, showing cases 1 to 25 of 26');
    expect(element.querySelector('opal-lib-moj-sortable-table-status')?.textContent).toContain(
      'Sorted by Respondent (ascending)',
    );
  });
  it('keeps 25 rows on one page, and name sorting resets a later page', () => {
    expect(render('to-review', 25).nativeElement.querySelector('#cases-draft-pagination')).toBeNull();
    const fixture = render('to-review', 26);
    fixture.componentInstance.onPageChange(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('th[columnKey="submittedByName"] button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(25);
    expect(fixture.componentInstance.currentPageSignal()).toBe(1);
  });
  it.each([{ button: 1 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])(
    'keeps native checker review links for %j',
    (options) => {
      const fixture = render();
      const emit = vi.spyOn(fixture.componentInstance.rowOpened, 'emit');
      const event = new MouseEvent('click', { ...options, bubbles: true, cancelable: true });
      fixture.nativeElement.querySelector('tbody a').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(emit).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('tbody a').getAttribute('href')).toContain(
        '/check-and-validate/review/1',
      );
    },
  );
});

describe.each(['inputter', 'checker'] as const)('%s controlled page announcements', (mode) => {
  const tab = mode === 'checker' ? 'to-review' : 'in-review';
  const title = mode === 'checker' ? 'Review cases' : 'Create cases';
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CasesDraftTableComponent],
      providers: [
        provideRouter([]),
        { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: mode },
        {
          provide: GlobalStore,
          useValue: { authenticated: signal(false), userState: signal(null), featureFlags: signal({}) },
        },
      ],
    }),
  );

  function render() {
    const fixture = TestBed.createComponent(CasesDraftTableComponent);
    fixture.componentRef.setInput('selection', defaultCasesDraftNavigation(tab, mode));
    fixture.componentRef.setInput(
      'rows',
      mapCasesDraftRows(
        Array.from({ length: 26 }, (_, index) =>
          createCasesDraftSummary({
            draft_casefile_id: index + 1,
            casefile_snapshot: { respondent_account: { respondent_name: `Synthetic ${index}` } },
          }),
        ),
        tab,
        mode,
      ),
    );
    fixture.detectChanges();
    return fixture;
  }

  it('preserves the titled page announcement when the parent commits page two with the same sort', () => {
    const fixture = render();
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentInstance.onPageChange(2);
    fixture.detectChanges();
    expect(element.querySelector('output')?.textContent).toBe(`${title}, page 2 of 2`);

    fixture.componentRef.setInput('selection', { ...defaultCasesDraftNavigation(tab, mode), page: 2 });
    fixture.detectChanges();

    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.querySelector('tbody tr')?.getAttribute('data-draft-id')).toBe('26');
    expect(element.querySelector('output')?.textContent).toBe(`${title}, page 2 of 2`);
  });

  it('announces page one and Respondent sort after sorting a committed second page', () => {
    const fixture = render();
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentInstance.onPageChange(2);
    fixture.componentRef.setInput('selection', { ...defaultCasesDraftNavigation(tab, mode), page: 2 });
    fixture.detectChanges();

    (element.querySelector('th[columnKey="respondent"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(25);
    expect(element.querySelector('output')?.textContent).toBe('Page 1 of 2, showing cases 1 to 25 of 26');

    fixture.componentRef.setInput('selection', {
      ...defaultCasesDraftNavigation(tab, mode),
      sort: 'respondent',
      direction: 'ascending',
    });
    fixture.detectChanges();
    expect(element.querySelector('output')?.textContent).toBe('Page 1 of 2, showing cases 1 to 25 of 26');
    expect(element.querySelector('th[columnKey="respondent"]')?.getAttribute('aria-sort')).toBe('ascending');
    expect(element.querySelector('opal-lib-moj-sortable-table-status')?.textContent).toContain(
      'Sorted by Respondent (ascending)',
    );
  });

  it('updates page status when a committed second page is clamped by shrinking rows', () => {
    const fixture = render();
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentInstance.onPageChange(2);
    fixture.componentRef.setInput('selection', { ...defaultCasesDraftNavigation(tab, mode), page: 2 });
    fixture.detectChanges();

    fixture.componentRef.setInput('rows', mapCasesDraftRows([createCasesDraftSummary()], tab, mode));
    fixture.detectChanges();

    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.querySelector('output')?.textContent).toBe('Page 1 of 1, showing cases 1 to 1 of 1');
  });
});
