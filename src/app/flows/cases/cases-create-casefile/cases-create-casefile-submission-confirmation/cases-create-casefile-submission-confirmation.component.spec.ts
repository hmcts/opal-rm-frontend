import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CasesCreateCasefileSubmissionConfirmationComponent } from './cases-create-casefile-submission-confirmation.component';

describe('Submission confirmation', () => {
  it('identifies the simulated submission without a fake receipt', () => {
    const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Submission confirmation');
    expect(fixture.nativeElement.textContent).toContain('No case has been saved or submitted for review');
    expect(fixture.nativeElement.textContent).not.toContain('MOCK-9817');
  });
});
