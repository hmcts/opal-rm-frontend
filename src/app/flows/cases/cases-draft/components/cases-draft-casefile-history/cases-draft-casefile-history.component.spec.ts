import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createPersistedCasefileDetail } from '../../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { CasesDraftCasefileHistoryComponent } from './cases-draft-casefile-history.component';

describe('CasesDraftCasefileHistoryComponent', () => {
  let fixture: ComponentFixture<CasesDraftCasefileHistoryComponent>;
  let draft: IOpalMaintenanceDraftCasefileDetail;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CasesDraftCasefileHistoryComponent] }).compileComponents();
    fixture = TestBed.createComponent(CasesDraftCasefileHistoryComponent);
    draft = createPersistedCasefileDetail();
    fixture.componentRef.setInput('draft', draft);
    fixture.componentRef.setInput('context', 'inputter');
  });

  it('renders a server lifecycle label separately from the timeline display status and snapshot', () => {
    draft.casefile_status = 'PUBLISHING_FAILED';
    draft.casefile_status_name = 'Untrusted display name';
    draft.casefile_snapshot.respondent_account.respondent_name = 'Snapshot only';
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('#create_casefile_review_status')?.textContent?.trim()).toBe('Failed');
    expect(element.querySelector('.moj-timeline__title')?.textContent?.trim()).toBe('Submitted');
    expect(element.textContent).not.toContain('Untrusted display name');
    expect(element.textContent).not.toContain('Snapshot only');
    expect(element.querySelectorAll('button, input, a')).toHaveLength(0);
  });

  it('renders escaped usernames and optional reasons in chronological order with local dates', () => {
    const iso = '2026-09-15T13:00:00+01:00';
    draft.timeline_data = [
      {
        username: '<img src=x onerror=alert(1)>',
        status: 'Rejected',
        status_date: iso,
        reason_text: '<script>test</script>',
      },
      { username: 'Synthetic Submitter', status: 'Submitted', status_date: '2026-09-15T09:00:00Z' },
    ];
    const original = structuredClone(draft);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const items = element.querySelectorAll('.moj-timeline__item');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('.moj-timeline__title')?.textContent?.trim()).toBe('Submitted');
    expect(items[0].querySelector('[description]')).toBeNull();
    expect(items[1].querySelector('[user]')?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(items[1].querySelector('[description]')?.textContent).toBe('<script>test</script>');
    expect(items[1].querySelector('[date]')?.textContent).toBe(
      new DatePipe('en-US').transform(iso, 'd MMMM yyyy, HH:mm'),
    );
    expect(element.querySelector('img, script')).toBeNull();
    expect(draft).toEqual(original);
  });

  it('renders all five timeline display statuses independently of the current lifecycle', () => {
    const statuses: IOpalMaintenanceDraftCasefileDetail['timeline_data'][number]['status'][] = [
      'Submitted',
      'Rejected',
      'Resubmitted',
      'Approved',
      'Deleted',
    ];
    draft.casefile_status = 'PUBLISHING_PENDING';
    draft.timeline_data = statuses.map((status, index) => ({
      username: 'Synthetic Actor',
      status,
      status_date: `2026-09-${15 + index}T09:00:00Z`,
    }));
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(Array.from(element.querySelectorAll('.moj-timeline__title'), (title) => title.textContent?.trim())).toEqual(
      statuses,
    );
    expect(element.querySelector('#create_casefile_review_status')?.textContent?.trim()).toBe('Approved');
  });

  it('updates the audience and replaces history when inputs change', () => {
    fixture.detectChanges();
    const next = createPersistedCasefileDetail();
    next.casefile_status = 'RESUBMITTED';
    next.timeline_data = [
      { username: 'Synthetic New Submitter', status: 'Resubmitted', status_date: '2026-09-16T09:00:00Z' },
    ];
    fixture.componentRef.setInput('draft', next);
    fixture.componentRef.setInput('context', 'checker');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('#create_casefile_review_status')?.textContent?.trim()).toBe('To review');
    expect(element.querySelectorAll('.moj-timeline__item')).toHaveLength(1);
    expect(element.querySelector('[user]')?.textContent).toBe('Synthetic New Submitter');
    expect(element.querySelector('.moj-timeline__title')?.textContent?.trim()).toBe('Resubmitted');
  });

  it('renders the current status with an empty history', () => {
    draft.timeline_data = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#create_casefile_review_status')?.textContent?.trim()).toBe(
      'In review',
    );
    expect(fixture.nativeElement.querySelectorAll('.moj-timeline__item')).toHaveLength(0);
  });
});
