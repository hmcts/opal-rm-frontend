import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CasesCreateCasefileSubmissionConfirmationComponent } from './cases-create-casefile-submission-confirmation.component';

describe('Submission confirmation placeholder', () => {
  it('renders the existing destination for the PO-9819 screen', () => {
    const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Submission confirmation');
    expect(fixture.nativeElement.textContent).not.toContain('simulated');
  });
});
