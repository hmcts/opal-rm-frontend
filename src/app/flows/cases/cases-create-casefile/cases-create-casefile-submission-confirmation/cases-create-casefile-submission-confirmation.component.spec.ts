import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { CasesCreateCasefileCompletionService } from '../services/cases-create-casefile-completion.service';
import { CasesCreateCasefileSubmissionConfirmationComponent } from './cases-create-casefile-submission-confirmation.component';

describe('Submission confirmation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CasesCreateCasefileSubmissionConfirmationComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('renders the confirmation panel and next steps without form or back navigation', async () => {
    const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('You’ve submitted this case for review');
    expect(element.querySelector('h1')?.getAttribute('tabindex')).toBe('-1');
    expect(element.querySelector('.govuk-panel--confirmation')).not.toBeNull();
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Next steps');
    const links = Array.from(element.querySelectorAll('a'));
    expect(links.map((link) => link.textContent?.trim())).toEqual(['Create a new case', 'See your cases in review']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/cases/create-casefile/case-type',
      '/cases/create-casefile/case-type',
    ]);
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('.govuk-back-link')).toBeNull();
    expect(element.textContent).not.toContain('This is a simulated submission');
  });

  it('never displays the receipt or submits during creation and subsequent rendering', async () => {
    TestBed.inject(CasesCreateCasefileCompletionService).record({ draft_casefile_id: 'synthetic-completion' });
    const submit = vi.spyOn(TestBed.inject(OpalMaintenanceService), 'submitCasefile');
    const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).not.toContain('synthetic-completion');
    expect(element.innerHTML).not.toContain('synthetic-completion');
    expect(
      Array.from(element.querySelectorAll('a'))
        .map((link) => link.href)
        .join(' '),
    ).not.toContain('synthetic-completion');
    expect(submit).not.toHaveBeenCalled();
  });
});
