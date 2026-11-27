import type { Router } from '@angular/router';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import type { ICasesCreateCasefileApplicantIndividual } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-applicant-individual.interface';
import type { ICasesCreateCasefileApplicantOrganisation } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-applicant-organisation.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { CasesCreateCasefileStoreInstance } from '../setup/applicant-individual.setup';

type ApplicantDetails = ICasesCreateCasefileApplicantIndividual | ICasesCreateCasefileApplicantOrganisation;
type BankField = 'bankName' | 'nameOnAccount' | 'paymentReference';

export const assertBankFieldError = (field: string, message: string): void => {
  const error = field + '-error-message';
  cy.get(Page.errorSummary).should('be.focused');
  cy.get(error)
    .should('be.visible')
    .and(($error) => {
      expect($error.text().replace(/\s+/g, ' ').trim()).to.equal('Error: ' + message);
    });
  cy.get(Page.errorSummaryLinks)
    .contains(message)
    .should(($link) => {
      expect($link.text().trim()).to.equal(message);
    })
    .click();
  cy.get(field).should('be.focused').and('have.attr', 'aria-describedby').and('include', error.slice(1));
};

const assertCasefileRoute = (childPath: string): void => {
  cy.get<Router>('@angularRouter').should((router) => {
    expect(router.url).to.equal('/' + PATHS.root + '/' + childPath);
  });
};

export const assertApplicantBankRejected = (childPath: string, savedApplicant: ApplicantDetails): void => {
  assertCasefileRoute(childPath);
  cy.get<CasesCreateCasefileStoreInstance>('@casesCreateCasefileStore').should((store) => {
    expect(store.applicantDetails()).to.deep.equal(savedApplicant);
  });
  cy.get('@draftCasefileWrite').should('not.have.been.called');
};

export const assertApplicantBankSaved = (
  savedApplicant: ApplicantDetails,
  field: BankField,
  value: string | null,
): void => {
  cy.get(Page.errorSummary).should('not.exist');
  assertCasefileRoute(PATHS.children.taskList);
  cy.get<CasesCreateCasefileStoreInstance>('@casesCreateCasefileStore').should((store) => {
    expect(store.applicantDetails()).to.deep.equal({
      ...savedApplicant,
      bankDetails: { ...savedApplicant.bankDetails, [field]: value },
    });
  });
};
