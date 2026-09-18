import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../cases-create-casefile-applicant-individual/mocks/cases-create-casefile-applicant-individual.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../cases-create-casefile-applicant-organisation/mocks/cases-create-casefile-applicant-organisation.mock';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermCreditorFormComponent } from './cases-create-casefile-order-term-creditor-form/cases-create-casefile-order-term-creditor-form.component';
import type { CasesCreateCasefileMajorCreditorsLoadService } from './services/cases-create-casefile-major-creditors-load.service';
import { CasesCreateCasefileOrderTermCreditorComponent } from './cases-create-casefile-order-term-creditor.component';

function owner(status: 'loading' | 'empty' = 'loading') {
  return {
    state: signal({ status, records: [], correlationReference: null }),
    load: vi.fn(),
    dispose: vi.fn(),
  } as unknown as CasesCreateCasefileMajorCreditorsLoadService;
}

async function setup(firstOwner = owner()) {
  const data = new BehaviorSubject({ majorCreditors: firstOwner });
  await TestBed.configureTestingModule({
    imports: [CasesCreateCasefileOrderTermCreditorComponent],
    providers: [CasesCreateCasefileStore, provideRouter([]), { provide: ActivatedRoute, useValue: { data } }],
  }).compileComponents();
  const store = TestBed.inject(CasesCreateCasefileStore);
  const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermCreditorComponent);
  return { fixture, component: fixture.componentInstance, data, firstOwner, store };
}

describe('CasesCreateCasefileOrderTermCreditorComponent', () => {
  it('renders the creditor form with reactive owner state', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Creditor');
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileOrderTermCreditorFormComponent))
      .componentInstance as CasesCreateCasefileOrderTermCreditorFormComponent;
    expect(child.loadState.status).toBe('loading');
  });

  it('disposes the previous load owner when resolved route data changes', async () => {
    const { fixture, component, data, firstOwner } = await setup();
    const secondOwner = owner('empty');
    data.next({ majorCreditors: secondOwner });
    expect(firstOwner.dispose).toHaveBeenCalledTimes(1);
    expect(component.owner()).toBe(secondOwner);
    fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileOrderTermCreditorFormComponent))
      .componentInstance as CasesCreateCasefileOrderTermCreditorFormComponent;
    expect(child.loadState.status).toBe('empty');
  });

  it.each([
    [CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved, 'Mr Test Applicant (Applicant)'],
    [
      {
        ...CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved,
        title: ' Ms ',
        firstNames: ' Synthetic ',
        lastName: ' Person ',
      },
      'Ms Synthetic Person (Applicant)',
    ],
    [CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk, 'Example Organisation (Applicant)'],
  ])('derives the applicant radio label from saved party details', async (details, expected) => {
    const { fixture, store } = await setup();
    store.setApplicantDetails(details);
    fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileOrderTermCreditorFormComponent))
      .componentInstance as CasesCreateCasefileOrderTermCreditorFormComponent;

    expect(child.applicantLabel).toBe(expected);
  });

  it('routes retry through the current load owner', async () => {
    const firstOwner = owner('empty');
    const { component } = await setup(firstOwner);
    component.handleRetry();
    expect(firstOwner.load).toHaveBeenCalledTimes(1);
  });

  it('disposes the current load owner when the routed component is destroyed', async () => {
    const { fixture, firstOwner } = await setup();
    fixture.destroy();
    expect(firstOwner.dispose).toHaveBeenCalledTimes(1);
  });
});
