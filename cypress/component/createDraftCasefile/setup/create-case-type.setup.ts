import { EMPTY } from 'rxjs';
import { CasesDraftNavigationService } from 'src/app/flows/cases/cases-draft/services/cases-draft-navigation.service';
import { CASES_DRAFT_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { ActivatedRoute, Router } from '@angular/router';
import { mount } from 'cypress/angular';
import { CasesCreateCasefileCaseTypeComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-case-type/cases-create-casefile-case-type.component';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import { CasesCreateCasefileCaseTypeSelection } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-case-type-selection.type';

export type CasesCreateCasefileStoreInstance = InstanceType<typeof CasesCreateCasefileStore>;

export const setupCreateCasefileCaseType = (
  initialSelection: CasesCreateCasefileCaseTypeSelection | null = null,
  navigationFailure?: 'false' | 'throw',
) => {
  const store = new CasesCreateCasefileStore();
  const returnPath =
    '/' +
    CASES_DRAFT_ROUTING_PATHS.root +
    '/' +
    CASES_DRAFT_ROUTING_PATHS.children.tabs +
    '?page=1&sort=created&direction=ascending#in-review';
  const navigateByUrl = cy.stub().as('cancelRouterNavigate').resolves(true);
  if (navigationFailure === 'false') navigateByUrl.resolves(false);
  if (navigationFailure === 'throw') navigateByUrl.rejects(new Error('Synthetic router failure'));
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
        { provide: CasesDraftNavigationService, useValue: { creationReturnUrl: () => returnPath } },
        { provide: Router, useValue: { navigate, navigateByUrl, events: EMPTY, currentNavigation: () => null } },
        { provide: ActivatedRoute, useValue: { parent: null } },
      ],
    }).then(() => {
      cy.wrap(store).as('casesCreateCasefileStore');
    });
  });
};
