import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileMinorCreditorRemoveComponent } from './cases-create-casefile-minor-creditor-remove.component';

describe('CasesCreateCasefileMinorCreditorRemoveComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('renders the removal placeholder and Back link at the journey width without a confirmation button', () => {
    const fixture = TestBed.createComponent(CasesCreateCasefileMinorCreditorRemoveComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const heading = element.querySelector('.govuk-grid-column-two-thirds h1');
    const backLink = element.querySelector<HTMLAnchorElement>('#minor-creditor-remove-back');

    expect(element.querySelector('.govuk-caption-l')?.textContent).toBe('Order terms');
    expect(heading?.textContent).toBe('Remove minor creditor');
    expect(backLink?.textContent).toBe('Back to minor creditor summary');
    expect(backLink?.getAttribute('href')).toBe(
      '/' +
        CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
        '/' +
        CASES_CREATE_CASEFILE_ROUTING_PATHS.children.minorCreditorSummary,
    );
    expect(element.querySelector('button')).toBeNull();
  });
});
