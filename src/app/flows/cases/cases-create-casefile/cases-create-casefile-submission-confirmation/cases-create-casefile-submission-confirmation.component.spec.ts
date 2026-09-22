import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileSubmissionService } from '../services/cases-create-casefile-submission.service';
import { CasesCreateCasefileSubmissionConfirmationComponent } from './cases-create-casefile-submission-confirmation.component';

describe('Local mock receipt', () => {
  it('labels the receipt as simulated and starts a new journey without submission', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const service = TestBed.inject(CasesCreateCasefileSubmissionService);
    vi.spyOn(service, 'receipt').mockReturnValue('MOCK-9817-1');
    const submit = vi.spyOn(service, 'submit');
    const reset = vi.spyOn(service, 'reset');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CasesCreateCasefileSubmissionConfirmationComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('MOCK-9817-1');
    expect(fixture.nativeElement.textContent).toContain('No case has been saved or submitted');
    await fixture.componentInstance.startNewCase();
    expect(navigate).toHaveBeenCalledWith('/cases/create-casefile/case-type');
    expect(reset).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  });
});
