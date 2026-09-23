import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
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
    expect(links.map((link) => link.textContent?.trim())).toEqual(['Create a new case']);
    const inReview = element.querySelector('#create_casefile_confirmation_in_review');
    expect(inReview?.textContent?.trim()).toBe('See your cases in review');
    expect(inReview?.tagName).toBe('SPAN');
    expect(inReview?.getAttribute('tabindex')).toBeNull();
    expect(inReview?.getAttribute('role')).toBeNull();
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/cases/create-casefile/case-type']);
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('.govuk-back-link')).toBeNull();
    expect(element.textContent).not.toContain('This is a simulated submission');
  });

  it('retains the draft and review context on activation without submitting again', async () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    const review = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    review.setContext({ origin: 'review', section: 'respondent' });
    const submit = vi.spyOn(TestBed.inject(OpalMaintenanceService), 'submitCasefile');
    const before = structuredClone(getState(store));
    const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
    expect(getState(store)).toEqual(before);
    expect(review.context()).toEqual({ origin: 'review', section: 'respondent' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(submit).not.toHaveBeenCalled();
  });
  it.each(['success', 'false', 'rejected'])(
    'preserves submitted data during %s new-case navigation',
    async (outcome) => {
      const store = TestBed.inject(CasesCreateCasefileStore);
      patchState(
        store as unknown as WritableStateSource<ICasesCreateCasefileState>,
        createCasesCreateCasefileReviewState(),
      );
      const review = TestBed.inject(CasesCreateCasefileReviewNavigationService);
      review.setContext({ origin: 'review', section: 'respondent' });
      const before = structuredClone(getState(store));
      const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
      if (outcome === 'rejected') navigate.mockRejectedValue(new Error('Synthetic navigation failure'));
      else navigate.mockResolvedValue(outcome === 'success');
      fixture.nativeElement.querySelector('#create_casefile_confirmation_create_new').click();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(navigate).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledWith('/cases/create-casefile/case-type', { state: { startNewCase: true } });
      expect(getState(store)).toEqual(before);
      expect(review.context()).toEqual({ origin: 'review', section: 'respondent' });
      if (outcome !== 'success') {
        const error = fixture.nativeElement.querySelector('.govuk-error-summary');
        expect(error?.textContent).toContain('The page could not be opened');
        expect(document.activeElement).toBe(error);
      }
    },
  );

  it('prevents duplicate new-case navigation while the router is pending', async () => {
    const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    let finish!: (value: boolean) => void;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockReturnValue(
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
    );
    const link = fixture.nativeElement.querySelector('#create_casefile_confirmation_create_new');
    link.click();
    link.click();
    expect(navigate).toHaveBeenCalledOnce();
    finish(true);
    await fixture.whenStable();
  });
});
