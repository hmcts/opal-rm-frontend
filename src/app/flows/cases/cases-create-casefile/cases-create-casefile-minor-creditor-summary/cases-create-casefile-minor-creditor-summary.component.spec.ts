import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CasesCreateCasefileMinorCreditorSummaryComponent } from './cases-create-casefile-minor-creditor-summary.component';

describe('CasesCreateCasefileMinorCreditorSummaryComponent', () => {
  it('renders the Summary destination at the journey width', () => {
    const fixture = TestBed.createComponent(CasesCreateCasefileMinorCreditorSummaryComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.govuk-grid-row .govuk-grid-column-two-thirds h1').textContent).toBe(
      'Minor creditor summary',
    );
    expect(fixture.nativeElement.querySelector('.govuk-caption-l').textContent).toBe('Order terms');
  });
});
