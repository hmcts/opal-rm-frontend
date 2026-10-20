import {
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
} from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';

export function interceptAmendmentReferences(): void {
  cy.intercept('GET', '**/opal-maintenance-service/countries*', {
    body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.countries) },
  });
  cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', {
    body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.applications) },
  });
  cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', { body: { refData: [] } });
  cy.intercept('GET', /\/opal-maintenance-service\/results(?:\?|$)/, {
    body: {
      refData: [{ result_id: 'TEST01', result_title: PERSISTED_CASEFILE_RESULT_DETAIL.result_title }],
    },
  });
  cy.intercept('GET', '**/opal-maintenance-service/results/TEST01', {
    body: structuredClone(PERSISTED_CASEFILE_RESULT_DETAIL),
  });
}
