import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { mount } from 'cypress/angular';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CasesCreateCasefileMinorCreditorDetailsFormComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/cases-create-casefile-minor-creditor-details-form/cases-create-casefile-minor-creditor-details-form.component';
import { CasesCreateCasefileMinorCreditorDetailsComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/cases-create-casefile-minor-creditor-details.component';
import type { ICasesCreateCasefileMinorCreditorDetails } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-minor-creditor-details.interface';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import { toMinorCreditorFormData } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/utils/cases-create-casefile-minor-creditor-mapper';
import { COUNTRIES_RESPONSE } from '../../mocks/countries.mock';

export type MinorCreditorStore = InstanceType<typeof CasesCreateCasefileStore>;

interface MinorCreditorSetupOptions {
  details?: ICasesCreateCasefileMinorCreditorDetails;
  state?: Partial<ICasesCreateCasefileState>;
}

export function setupMinorCreditor({ details, state = {} }: MinorCreditorSetupOptions = {}) {
  const store = new CasesCreateCasefileStore();
  store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    orderTerms: [{ termId: 1, resultId: 'MAT', parameters: { amount: '12.30' }, creditor: null }],
    currentOrderTermId: 1,
    nextOrderTermId: 2,
    creditorDraft: { termId: 1, branch: 'add-new' },
    ...structuredClone(state),
  });

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.title = 'OPAL - Minor creditor details';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');

    return mount(CasesCreateCasefileMinorCreditorDetailsComponent, {
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: CasesCreateCasefileStore, useValue: store },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { countries: structuredClone(COUNTRIES_RESPONSE) } } },
        },
      ],
    }).then(({ fixture }) => {
      const router = TestBed.inject(Router);
      const navigate = cy.stub(router, 'navigateByUrl').resolves(true);
      cy.wrap(navigate).as('routerNavigate');
      cy.wrap(store).as('casesCreateCasefileStore');
      cy.wrap(fixture).as('minorCreditorFixture');
      fixture.detectChanges();

      if (details) {
        const child = fixture.debugElement.query(By.directive(CasesCreateCasefileMinorCreditorDetailsFormComponent))
          .componentInstance as CasesCreateCasefileMinorCreditorDetailsFormComponent;
        child.acceptSavedData(toMinorCreditorFormData(details));
        fixture.detectChanges();
      }
    });
  });
}
