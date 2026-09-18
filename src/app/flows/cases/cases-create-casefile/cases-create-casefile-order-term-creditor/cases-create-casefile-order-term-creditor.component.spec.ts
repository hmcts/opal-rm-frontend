import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { CasesCreateCasefileMajorCreditorsLoadService } from './services/cases-create-casefile-major-creditors-load.service';
import { CasesCreateCasefileOrderTermCreditorComponent } from './cases-create-casefile-order-term-creditor.component';

function owner() {
  return { dispose: vi.fn() } as unknown as CasesCreateCasefileMajorCreditorsLoadService;
}

async function setup(firstOwner = owner()) {
  const data = new BehaviorSubject({ majorCreditors: firstOwner });
  await TestBed.configureTestingModule({
    imports: [CasesCreateCasefileOrderTermCreditorComponent],
    providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { data } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermCreditorComponent);
  return { fixture, component: fixture.componentInstance, data, firstOwner };
}

describe('CasesCreateCasefileOrderTermCreditorComponent', () => {
  it('renders the minimum placeholder and return link', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Creditor');
    expect(fixture.nativeElement.querySelector('p').textContent.trim()).toBe(
      'Creditor details will be available in a later update.',
    );
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe(
      '/cases/create-casefile/order-terms/summary',
    );
  });

  it('disposes the previous load owner when resolved route data changes', async () => {
    const { component, data, firstOwner } = await setup();
    const secondOwner = owner();
    data.next({ majorCreditors: secondOwner });
    expect(firstOwner.dispose).toHaveBeenCalledTimes(1);
    expect(component.owner).toBe(secondOwner);
  });

  it('disposes the current load owner when the routed component is destroyed', async () => {
    const { fixture, firstOwner } = await setup();
    fixture.destroy();
    expect(firstOwner.dispose).toHaveBeenCalledTimes(1);
  });
});
