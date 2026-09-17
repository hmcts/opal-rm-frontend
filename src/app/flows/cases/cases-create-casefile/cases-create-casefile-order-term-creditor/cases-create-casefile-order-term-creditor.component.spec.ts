import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { CasesCreateCasefileOrderTermCreditorComponent } from './cases-create-casefile-order-term-creditor.component';

describe('CasesCreateCasefileOrderTermCreditorComponent', () => {
  it('renders the minimum placeholder and return link', async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileOrderTermCreditorComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermCreditorComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Creditor');
    expect(fixture.nativeElement.querySelector('p').textContent.trim()).toBe(
      'Creditor details will be available in a later update.',
    );
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe(
      '/cases/create-casefile/order-terms/summary',
    );
  });
});
