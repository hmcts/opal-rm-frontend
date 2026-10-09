import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileOrderTermCard } from '../../interfaces/cases-create-casefile-order-term-card.interface';
import { CasesCreateCasefileOrderTermCardComponent } from './cases-create-casefile-order-term-card.component';

describe('CasesCreateCasefileOrderTermCardComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileOrderTermCardComponent>;
  const card: ICasesCreateCasefileOrderTermCard = {
    termId: 7,
    title: 'Maintenance',
    rows: [{ id: 'amount', label: 'Amount', value: '£10.00' }],
    bankRows: [
      { id: 'nameOnAccount', label: 'Name on account', value: 'Synthetic creditor' },
      { id: 'sortCode', label: 'Sort code', value: '001122' },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CasesCreateCasefileOrderTermCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(CasesCreateCasefileOrderTermCardComponent);
    fixture.componentRef.setInput('card', card);
  });

  it('renders the term with the shared creditor details initially collapsed', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('opal-lib-govuk-details#order-term-7-bank');
    const details = host?.querySelector('details') as HTMLDetailsElement;
    expect(fixture.nativeElement.querySelector('h2')?.textContent.trim()).toBe('Maintenance');
    expect(fixture.nativeElement.textContent).toContain('£10.00');
    expect(details).toBeTruthy();
    expect(details.open).toBe(false);
    expect(details.querySelector('summary')?.textContent?.trim()).toBe('Creditor details');
    expect(details.textContent).toContain('Synthetic creditor');
    expect(details.textContent).toContain('001122');
  });

  it('opens and closes creditor details through native summary activation', () => {
    fixture.detectChanges();
    const details = fixture.nativeElement.querySelector('#order-term-7-bank details') as HTMLDetailsElement;
    const summary = details?.querySelector('summary');
    expect(summary).toBeTruthy();

    summary!.click();
    expect(details.open).toBe(true);
    expect(summary!.textContent?.trim()).toBe('Creditor details');

    summary!.click();
    expect(details.open).toBe(false);
  });

  it('omits the disclosure when the creditor has no bank rows', () => {
    fixture.componentRef.setInput('card', { ...card, bankRows: [] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('opal-lib-govuk-details')).toBeNull();
  });

  it('renders no actions when none are projected', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.govuk-summary-card__action')).toHaveLength(0);
  });
});
