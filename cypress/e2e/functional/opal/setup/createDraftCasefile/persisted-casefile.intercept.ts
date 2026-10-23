import {
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
} from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';

/** Complete historical references used by the real resolver and mapper in every persisted journey. */
export function stubPersistedCasefileReferences(): void {
  cy.intercept('GET', '**/opal-maintenance-service/countries*', (request) => {
    expect(request.query).not.to.have.property('active');
    request.reply({ body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.countries) } });
  });
  cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', (request) => {
    expect(request.query).to.deep.equal({ application_group: 'Create Casefile' });
    request.reply({ body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.applications) } });
  });
  cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', (request) => {
    expect(request.query).to.deep.equal({ business_unit_id: '44' });
    request.reply({ body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.majorCreditors) } });
  });
  cy.intercept('GET', '**/opal-maintenance-service/results/TEST01', {
    body: structuredClone(PERSISTED_CASEFILE_RESULT_DETAIL),
  });
}
