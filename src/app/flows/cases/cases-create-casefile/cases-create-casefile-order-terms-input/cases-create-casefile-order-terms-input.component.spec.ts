import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermsInputComponent } from './cases-create-casefile-order-terms-input.component';

describe('Order term input destination', () => {
  it('identifies the selected result and returns to selection', async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileOrderTermsInputComponent],
      providers: [provideRouter([]), CasesCreateCasefileStore],
    }).compileComponents();
    TestBed.inject(CasesCreateCasefileStore).setPendingOrderTermResultId('MOCK01');
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Order term MOCK01');
    fixture.nativeElement.querySelector('a').click();
    expect(navigateByUrl).toHaveBeenCalledExactlyOnceWith('/cases/create-casefile/order-terms/select');
  });
});
