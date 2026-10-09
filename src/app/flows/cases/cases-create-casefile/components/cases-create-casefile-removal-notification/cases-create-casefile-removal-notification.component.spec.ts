import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileRemovalNotificationComponent } from './cases-create-casefile-removal-notification.component';

describe('CasesCreateCasefileRemovalNotificationComponent', () => {
  it('announces success, focuses its host and emits dismissal', () => {
    TestBed.configureTestingModule({ imports: [CasesCreateCasefileRemovalNotificationComponent] });
    const fixture = TestBed.createComponent(CasesCreateCasefileRemovalNotificationComponent);
    fixture.detectChanges();
    const dismissed = vi.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);
    const host = fixture.nativeElement.querySelector('#create_casefile_order_terms_removal_notice') as HTMLElement;

    expect(host.textContent).toContain('Order terms removed.');
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    fixture.componentInstance.focus();
    expect(document.activeElement).toBe(host);
    const dismiss = host.querySelector<HTMLButtonElement>('#create_casefile_order_terms_removal_dismiss');
    expect(dismiss?.classList.contains('govuk-button')).toBe(true);
    expect(dismiss?.classList.contains('govuk-button--secondary')).toBe(true);
    dismiss?.click();
    expect(dismissed).toHaveBeenCalledOnce();
  });
});
