import { ActivatedRoute, Router } from '@angular/router';
import { mount } from 'cypress/angular';
import { CasesCreateCasefileCaseTypeComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-case-type/cases-create-casefile-case-type.component';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import { CasesCreateCasefileCaseTypeSelection } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-case-type-selection.type';

export type CasesCreateCasefileStoreInstance = InstanceType<typeof CasesCreateCasefileStore>;

export const setupCreateCasefileCaseType = (initialSelection: CasesCreateCasefileCaseTypeSelection | null = null) => {
  const store = new CasesCreateCasefileStore();
  const navigate = cy.stub().as('routerNavigate').resolves(true);

  if (initialSelection) {
    store.setCaseTypeSelection(initialSelection);
  }

  return cy.document().then((document) => {
    document.documentElement.lang = 'en';
    document.body.classList.add('govuk-template__body');
    document.querySelector('[data-cy-root]')?.setAttribute('role', 'main');

    return mount(CasesCreateCasefileCaseTypeComponent, {
      providers: [
        { provide: CasesCreateCasefileStore, useValue: store },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { parent: null } },
      ],
    }).then(() => {
      cy.wrap(store).as('casesCreateCasefileStore');
    });
  });
};
