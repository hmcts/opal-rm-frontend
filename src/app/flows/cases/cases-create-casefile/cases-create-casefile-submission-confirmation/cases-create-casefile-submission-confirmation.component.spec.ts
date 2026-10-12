import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { getState } from '@ngrx/signals';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
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
    TestBed.inject(CasesCreateCasefileStore).completeSubmission();
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
    const createNew = element.querySelector('#create_casefile_confirmation_create_new');
    expect(createNew?.textContent?.trim()).toBe('Create a new case');
    expect(createNew?.getAttribute('href')).toBe('/cases/create-casefile/case-type');
    const inReview = element.querySelector('#create_casefile_confirmation_in_review');
    expect(inReview?.textContent?.trim()).toBe('See your cases in review');
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('.govuk-back-link')).toBeNull();
    expect(element.textContent).not.toContain('This is a simulated submission');
  });

  it('retains the confirmation marker and empty draft on activation without submitting again', async () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.completeSubmission();
    const review = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    const submit = vi.spyOn(TestBed.inject(OpalMaintenanceService), 'createDraftCasefile');
    const before = structuredClone(getState(store));
    const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
    expect(getState(store)).toEqual(before);
    expect(review.context()).toBeNull();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(submit).not.toHaveBeenCalled();
  });
  it('retains successful submission on departure to prevent another POST', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.completeSubmission();
    const before = structuredClone(getState(store));
    const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
    fixture.destroy();
    expect(getState(store)).toEqual(before);
  });

  it.each(['success', 'false', 'rejected'])(
    'preserves the confirmation marker and empty draft during %s new-case navigation',
    async (outcome) => {
      const store = TestBed.inject(CasesCreateCasefileStore);
      store.completeSubmission();
      const review = TestBed.inject(CasesCreateCasefileReviewNavigationService);
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
      expect(navigate).toHaveBeenCalledWith('/cases/create-casefile/case-type', {
        state: { startNewCase: true, focusCaseTypeHeading: true },
      });
      expect(getState(store)).toEqual(before);
      expect(review.context()).toBeNull();
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
