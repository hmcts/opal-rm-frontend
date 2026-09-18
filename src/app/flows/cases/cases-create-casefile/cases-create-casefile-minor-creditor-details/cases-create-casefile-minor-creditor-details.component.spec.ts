import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileMinorCreditorDetailsComponent } from './cases-create-casefile-minor-creditor-details.component';

describe('CasesCreateCasefileMinorCreditorDetailsComponent', () => {
  it('renders the read-only details boundary and returns to creditor selection', async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileMinorCreditorDetailsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CasesCreateCasefileMinorCreditorDetailsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Minor creditor details');
    expect(fixture.nativeElement.querySelector('.govuk-body').textContent.trim()).toBe(
      'Minor creditor details cannot be added yet.',
    );
    expect(fixture.nativeElement.querySelector('#returnToCreditor').getAttribute('href')).toBe(
      '/' +
        CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
        '/' +
        CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermCreditor,
    );
  });
});
