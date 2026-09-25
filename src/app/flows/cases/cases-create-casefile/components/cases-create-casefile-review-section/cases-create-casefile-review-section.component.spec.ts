import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReviewSection } from '../../interfaces/cases-create-casefile-review-section.interface';
import { CasesCreateCasefileReviewSectionComponent } from './cases-create-casefile-review-section.component';

describe('CasesCreateCasefileReviewSectionComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileReviewSectionComponent>;
  const section: ReviewSection = {
    id: 'applicant',
    title: 'Applicant details',
    rows: [{ id: 'address', label: 'Address', values: ['<img src=x onerror=alert(1)>', 'Test town'] }],
    warning: 'Personal information should not be shared.',
    bankRows: [{ id: 'bankType', label: 'Type of bank account', values: ['UK bank account'] }],
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CasesCreateCasefileReviewSectionComponent] }).compileComponents();
    fixture = TestBed.createComponent(CasesCreateCasefileReviewSectionComponent);
    fixture.componentRef.setInput('section', section);
  });
  it('renders escaped text, warning and a focusable target', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('#review-applicant')?.getAttribute('tabindex')).toBe('-1');
    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(host.querySelector('.govuk-warning-text')?.textContent).toContain(section.warning);
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('Applicant details');
  });
  it('emits the section ID from a contextual change button', () => {
    const changed = vi.fn();
    fixture.componentInstance.changeEvent.subscribe(changed);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent?.replace(/\s+/g, ' ').trim()).toBe('Change Applicant details');
    button.click();
    expect(changed).toHaveBeenCalledExactlyOnceWith('applicant');
  });
  it('prevents change while disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    const changed = vi.fn();
    fixture.componentInstance.changeEvent.subscribe(changed);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.disabled).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  });
  it('omits a change action for a read-only section', () => {
    fixture.componentRef.setInput('actionable', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
  it('supports native bank disclosure activation', () => {
    fixture.detectChanges();
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.textContent).toContain('UK bank account');
    details.querySelector('summary')!.click();
    expect(details.open).toBe(true);
    details.querySelector('summary')!.click();
    expect(details.open).toBe(false);
  });
  it('omits absent warning and bank disclosure', () => {
    fixture.componentRef.setInput('section', { ...section, warning: null, bankRows: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('details')).toBeNull();
    expect(fixture.nativeElement.querySelector('.govuk-warning-text')).toBeNull();
  });
});
