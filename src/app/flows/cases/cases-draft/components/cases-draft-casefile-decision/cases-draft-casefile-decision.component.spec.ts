import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CasesDraftCasefileDecisionComponent } from './cases-draft-casefile-decision.component';

const decisionId = 'create_casefile_review_decision';
const reasonId = 'create_casefile_review_rejection_reason';

describe('CasesDraftCasefileDecisionComponent', () => {
  let fixture: ComponentFixture<CasesDraftCasefileDecisionComponent>;
  let component: CasesDraftCasefileDecisionComponent;
  const query = <T extends HTMLElement>(selector: string): T => fixture.nativeElement.querySelector(selector) as T;
  const reject = (reason: string): void => {
    component.form.setValue({
      create_casefile_review_decision: 'reject',
      create_casefile_review_rejection_reason: reason,
    });
  };
  const submit = async (): Promise<void> => {
    component.handleContinue();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
    await TestBed.configureTestingModule({
      imports: [CasesDraftCasefileDecisionComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CasesDraftCasefileDecisionComponent);
    component = fixture.componentInstance;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('does not preselect or emit a missing decision and marks controls touched', async () => {
    const emit = vi.spyOn(component.decisionEvent, 'emit');
    expect(component.form.controls.create_casefile_review_decision.value).toBeNull();
    expect(component.form.controls.create_casefile_review_rejection_reason.value).toBe('');
    await submit();
    expect(emit).not.toHaveBeenCalled();
    expect(component.form.controls.create_casefile_review_decision.errors).toEqual({ required: true });
    expect(component.form.touched).toBe(true);
    expect(component.formErrorSummaryMessage).toEqual([{ fieldId: decisionId, message: 'Select a review decision' }]);
    expect(query<HTMLElement>('.govuk-error-summary__list a').textContent?.trim()).toBe('Select a review decision');
    expect(query<HTMLElement>(`#${decisionId}`).textContent).toContain('Select a review decision');
    expect(document.activeElement).toBe(query('.govuk-error-summary'));
    query<HTMLAnchorElement>('.govuk-error-summary__list a').click();
    expect(document.activeElement).toBe(query(`#${decisionId}-approve`));
  });

  it.each(['', '   ', '\n\t'])('requires a meaningful rejection reason: %j', async (reason) => {
    const emit = vi.spyOn(component.decisionEvent, 'emit');
    reject(reason);
    await submit();
    expect(emit).not.toHaveBeenCalled();
    expect(component.form.controls.create_casefile_review_rejection_reason.hasError('required')).toBe(true);
    expect(component.formControlErrorMessages[reasonId]).toBe('Enter reason for rejection');
    expect(component.formErrorSummaryMessage).toEqual([{ fieldId: reasonId, message: 'Enter reason for rejection' }]);
    expect(query(`#${reasonId}-error-message`).textContent).toContain('Enter reason for rejection');
    expect(query<HTMLTextAreaElement>(`#${reasonId}`).value).toBe(reason);
  });

  it.each(['a'.repeat(250), ` ${'a'.repeat(248)} `])('emits the raw valid 250-character reason', async (reason) => {
    const emit = vi.spyOn(component.decisionEvent, 'emit');
    reject(reason);
    await submit();
    expect(emit).toHaveBeenCalledExactlyOnceWith({ decision: 'reject', targetStatus: 'REJECTED', reason });
    expect(query('.govuk-error-summary')).toBeNull();
  });

  it.each(['a'.repeat(251), ` ${'a'.repeat(249)} `])(
    'rejects the raw 251-character reason and focuses the real error link',
    async (reason) => {
      const emit = vi.spyOn(component.decisionEvent, 'emit');
      reject(reason);
      await submit();
      const message = 'Reason for rejection must be 250 characters or fewer';
      expect(emit).not.toHaveBeenCalled();
      expect(component.form.controls.create_casefile_review_rejection_reason.hasError('maxlength')).toBe(true);
      expect(component.formControlErrorMessages[reasonId]).toBe(message);
      expect(component.formErrorSummaryMessage).toEqual([{ fieldId: reasonId, message }]);
      expect(query(`#${reasonId}-error-message`).textContent).toContain(message);
      expect(query<HTMLTextAreaElement>(`#${reasonId}`).value).toBe(reason);
      expect(query(`#${reasonId}-count`).textContent?.trim()).toBe('You have 1 character too many');
      expect(document.activeElement).toBe(query('.govuk-error-summary'));
      const link = query<HTMLAnchorElement>('.govuk-error-summary__list a');
      expect(link.getAttribute('href')).toBe('#');
      link.click();
      expect(document.activeElement).toBe(query(`#${reasonId}`));
      expect(query(`#${reasonId}`).getAttribute('aria-describedby')).toBe(
        `${reasonId}-hint ${reasonId}-count ${reasonId}-error-message`,
      );
      expect(query(`#${reasonId}`).getAttribute('aria-invalid')).toBe('true');
    },
  );

  it('clears the reason, validators, inline and summary errors, and signals on switching to Approve', async () => {
    const emit = vi.spyOn(component.decisionEvent, 'emit');
    reject('a'.repeat(251));
    await submit();
    component.form.controls.create_casefile_review_decision.setValue('approve');
    fixture.detectChanges();
    expect(component.form.controls.create_casefile_review_rejection_reason.value).toBe('');
    expect(component.form.controls.create_casefile_review_rejection_reason.errors).toBeNull();
    expect(component.reasonValue()).toBe('');
    expect(component.reasonError()).toBe(false);
    expect(component.formControlErrorMessages[reasonId]).toBeUndefined();
    expect(component.formErrorSummaryMessage).toEqual([]);
    expect(query(`#${reasonId}`)).toBeNull();
    await submit();
    expect(emit).toHaveBeenCalledExactlyOnceWith({ decision: 'approve', targetStatus: 'PUBLISHING_PENDING' });
    component.form.controls.create_casefile_review_decision.setValue('reject');
    await submit();
    expect(component.form.controls.create_casefile_review_rejection_reason.hasError('required')).toBe(true);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('renders canonical radios and reveals an unrestricted accessible textarea through a real radio click', () => {
    fixture.detectChanges();
    const approve = query<HTMLInputElement>(`#${decisionId}-approve`);
    const rejectRadio = query<HTMLInputElement>(`#${decisionId}-reject`);
    expect(approve.checked).toBe(false);
    expect(rejectRadio.checked).toBe(false);
    expect(approve.name).toBe(decisionId);
    expect(rejectRadio.name).toBe(decisionId);
    expect(query(`#${decisionId} legend`).textContent?.trim()).toBe('Review decision');
    expect(query(`label[for="${decisionId}-approve"]`).textContent?.trim()).toBe('Approve');
    expect(query(`label[for="${decisionId}-reject"]`).textContent?.trim()).toBe('Reject');
    expect(rejectRadio.getAttribute('aria-controls')).toBe('create_casefile_review_rejection');
    expect(query(`#${reasonId}`)).toBeNull();
    rejectRadio.click();
    fixture.detectChanges();
    const textarea = query<HTMLTextAreaElement>(`#${reasonId}`);
    expect(textarea.name).toBe(reasonId);
    expect(textarea.hasAttribute('maxlength')).toBe(false);
    expect(textarea.getAttribute('aria-describedby')).toBe(`${reasonId}-hint ${reasonId}-count`);
    expect(textarea.hasAttribute('aria-invalid')).toBe(false);
    expect(query(`label[for="${reasonId}"]`).textContent?.trim()).toBe('Reason for rejection');
    expect(query(`#${reasonId}-hint`).textContent?.trim()).toBe('You can enter up to 250 characters');
    expect(query(`#${reasonId}-count`).getAttribute('aria-live')).toBe('polite');
    textarea.value = 'a'.repeat(251);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(component.form.controls.create_casefile_review_rejection_reason.value).toHaveLength(251);
    expect(query(`#${reasonId}-count`).textContent?.trim()).toBe('You have 1 character too many');
  });

  it.each([
    [0, '250 characters remaining'],
    [249, '1 character remaining'],
    [250, '0 characters remaining'],
    [252, '2 characters too many'],
  ])('announces the live raw character count for %i characters', (length, text) => {
    reject('a'.repeat(length as number));
    fixture.detectChanges();
    expect(query(`#${reasonId}-count`).textContent?.trim()).toBe(`You have ${text}`);
  });

  it('prevents native form navigation and emits Approve through the rendered submit event', () => {
    const emit = vi.spyOn(component.decisionEvent, 'emit');
    component.form.controls.create_casefile_review_decision.setValue('approve');
    fixture.detectChanges();
    const button = query<HTMLButtonElement>('#create_casefile_review_continue');
    expect(button.type).toBe('submit');
    expect(button.textContent?.trim()).toBe('Continue');
    const event = new SubmitEvent('submit', { bubbles: true, cancelable: true });
    query<HTMLFormElement>('form').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(emit).toHaveBeenCalledExactlyOnceWith({ decision: 'approve', targetStatus: 'PUBLISHING_PENDING' });
  });

  it('clears rendered rejection errors and described-by after correcting and resubmitting', async () => {
    reject('');
    await submit();
    component.form.controls.create_casefile_review_rejection_reason.setValue('Valid reason');
    await submit();
    expect(component.reasonError()).toBe(false);
    expect(query('.govuk-error-summary')).toBeNull();
    expect(query(`#${reasonId}-error-message`)).toBeNull();
    expect(query(`#${reasonId}`).getAttribute('aria-describedby')).toBe(`${reasonId}-hint ${reasonId}-count`);
    expect(query(`#${reasonId}`).hasAttribute('aria-invalid')).toBe(false);
  });
});
