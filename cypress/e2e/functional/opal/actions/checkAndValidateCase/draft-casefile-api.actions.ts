import type { IOpalMaintenanceCountryReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';
import type { IOpalMaintenanceApplicationReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-response.interface';
import type { IOpalMaintenanceResultReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-result-reference-data-response.interface';
import type { IOpalMaintenanceResultDetail } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-result-detail.interface';
import {
  createDraftCasefileTestRunReference,
  recordCreatedId,
  configureDraftCasefileCleanup,
  persistDraftCasefileCleanupReceipts,
} from '../../../../../support/draftCasefiles';
import { versionValue } from './draft-casefile-evidence.actions';
import { buildSyntheticDraftRequest } from './draft-casefile-payload';

const requestOptions = {
  method: 'GET' as const,
  failOnStatusCode: false,
  followRedirect: false,
  retryOnNetworkFailure: false,
  retryOnStatusCodeFailure: false,
  log: false,
};

/**
 * Requires live reference data compatible with the bounded synthetic recovery fixture before any POST.
 * @returns The current Create Casefile application and unique active UK CJS code.
 */
export function readDraftFixtureReferenceData(): Cypress.Chainable<{
  applicationCode: string;
  countryCjsCode: number;
}> {
  return cy
    .request<IOpalMaintenanceCountryReferenceDataResponse>({
      ...requestOptions,
      url: '/opal-maintenance-service/countries',
      qs: { active: true },
    })
    .then((countries) => {
      expect(countries.status, 'live countries prerequisite').to.equal(200);
      if (!countries.body || !Array.isArray(countries.body.refData))
        throw new Error('Live countries prerequisite requires a refData array');
      const uk = countries.body.refData.filter(
        (country) => country.active && country.country_name === 'United Kingdom',
      );
      if (
        uk.length !== 1 ||
        countries.body.refData.filter((country) => country.cjs_code === uk[0].cjs_code).length !== 1
      )
        throw new Error('Provision one active United Kingdom country with a unique CJS code');
      const countryCjsCode = uk[0].cjs_code;
      return cy
        .request<IOpalMaintenanceApplicationReferenceDataResponse>({
          ...requestOptions,
          url: '/opal-maintenance-service/maintenance-applications',
          qs: { active: true, application_group: 'Create Casefile' },
        })
        .then((applications) => {
          expect(applications.status, 'live application prerequisite').to.equal(200);
          if (!applications.body || !Array.isArray(applications.body.refData))
            throw new Error('Live application prerequisite requires a refData array');
          const application = applications.body.refData.find(
            (item) => item.active && item.application_group === 'Create Casefile',
          );
          if (!application) throw new Error('Provision an active Create Casefile application');
          return cy
            .request<IOpalMaintenanceResultReferenceDataResponse>({
              ...requestOptions,
              url: '/opal-maintenance-service/results',
              qs: { order_term: true, active: true },
            })
            .then((results) => {
              expect(results.status, 'live order-term prerequisite').to.equal(200);
              if (!results.body || !Array.isArray(results.body.refData))
                throw new Error('Live order-term prerequisite requires a refData array');
              if (!results.body.refData.some((item) => item.result_id === 'MAT'))
                throw new Error('Provision an active MAT Order Term Result');
              return cy
                .request<IOpalMaintenanceResultDetail>({
                  ...requestOptions,
                  url: '/opal-maintenance-service/results/MAT',
                })
                .then((detail) => {
                  expect(detail.status, 'live MAT detail prerequisite').to.equal(200);
                  if (detail.body.result_id !== 'MAT' || typeof detail.body.result_parameters !== 'string')
                    throw new Error('MAT detail requires its parameter JSON');
                  const parameters: unknown = JSON.parse(detail.body.result_parameters);
                  if (!Array.isArray(parameters)) throw new Error('MAT parameters require an array');
                  const responses = buildSyntheticDraftRequest(
                    'E2E-0000000000000000',
                    application.application_code,
                    countryCjsCode,
                  ).casefile.respondent_account.order_details.order_terms[0].result_responses;
                  const names = new Set<string>();
                  for (const parameter of parameters as unknown[]) {
                    if (typeof parameter !== 'object' || parameter === null || Array.isArray(parameter))
                      throw new Error('MAT parameter metadata is invalid');
                    const field = parameter as Record<string, unknown>;
                    const name = field['name'];
                    if (typeof name !== 'string' || typeof field['mandatory'] !== 'boolean')
                      throw new Error('MAT parameter metadata is invalid');
                    const normalized = name.toLowerCase();
                    if (names.has(normalized)) throw new Error('MAT metadata has duplicate parameter names');
                    names.add(normalized);
                    const response = responses.find((value) => value.parameter_name.toLowerCase() === normalized);
                    if (field['mandatory'] && !response) throw new Error(`Unsupported required MAT parameter: ${name}`);
                    const options = field['options'];
                    if (options !== undefined) {
                      if (!Array.isArray(options) || !options.every((option) => typeof option === 'string'))
                        throw new Error(`MAT options require strings: ${name}`);
                      if (response && !options.includes(response.response))
                        throw new Error(`Synthetic MAT value is outside the live options: ${name}`);
                    }
                  }
                  if (!responses.every((response) => names.has(response.parameter_name.toLowerCase())))
                    throw new Error('Provision the six documented MAT fixture parameters');
                  return { applicationCode: application.application_code, countryCjsCode };
                });
            });
        });
    });
}

/**
 * Records and persists an observed ID before validating the remaining creation response.
 * @param response Real creation response, including any usable ID from a malformed response.
 * @param marker Exact run marker sent in the synthetic request.
 * @param inputter Authenticated owner to restore during required cleanup.
 * @returns The owned ID and validated strong ETag once its receipt is persisted.
 */
export function captureCreatedDraft(
  response: Cypress.Response<unknown>,
  marker: string,
  inputter: string,
): Cypress.Chainable<{ id: number; etag: string }> {
  const body = response.body;
  const id = body && typeof body === 'object' && 'draft_casefile_id' in body ? body.draft_casefile_id : undefined;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1)
    throw new Error(
      `Fixture POST returned HTTP ${response.status} without a usable draft ID; run ${marker}. No cleanup ID can be inferred`,
    );
  recordCreatedId(id, marker);
  configureDraftCasefileCleanup(id, marker, { actor: inputter, policy: 'required' });
  return persistDraftCasefileCleanupReceipts().then(() => {
    expect(response.status, 'real API fixture creation').to.equal(201);
    const etag = response.headers['etag'] ?? response.headers['ETag'];
    if (typeof etag !== 'string') throw new Error('Creation response has no ETag');
    versionValue(etag);
    expect(body).to.have.property('casefile_status', 'SUBMITTED');
    return { id, etag };
  });
}

/**
 * Creates once through the current authenticated session; ambiguous transport failures must not retry.
 * @param inputter Existing authenticated staff identity that owns required cleanup.
 * @returns The observed ID, exact run marker and validated creation ETag.
 */
export function postSyntheticDraft(inputter: string): Cypress.Chainable<{ id: number; marker: string; etag: string }> {
  return readDraftFixtureReferenceData().then(({ applicationCode, countryCjsCode }) => {
    const marker = createDraftCasefileTestRunReference();
    cy.log(`Synthetic draft fixture run: ${marker}`);
    return cy
      .request<unknown>({
        method: 'POST',
        url: '/opal-maintenance-service/draft-casefiles',
        body: buildSyntheticDraftRequest(marker, applicationCode, countryCjsCode),
        failOnStatusCode: false,
        followRedirect: false,
        retryOnNetworkFailure: false,
        retryOnStatusCodeFailure: false,
        log: false,
      })
      .then((response) => captureCreatedDraft(response, marker, inputter))
      .then(({ id, etag }) => ({ id, marker, etag }));
  });
}
