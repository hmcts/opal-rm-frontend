import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import {
  VALID_NON_UK_BIC_APPLICANT_INDIVIDUAL,
  VALID_UK_APPLICANT_INDIVIDUAL,
} from '../mocks/applicant-individual.mock';
import {
  VALID_NON_UK_BIC_APPLICANT_ORGANISATION,
  VALID_UK_APPLICANT_ORGANISATION,
} from '../mocks/applicant-organisation.mock';
import { setupApplicantIndividual } from './applicant-individual.setup';
import { setupApplicantOrganisation } from './applicant-organisation.setup';

type BankType = 'uk' | 'non-uk';

const individual = { uk: VALID_UK_APPLICANT_INDIVIDUAL, 'non-uk': VALID_NON_UK_BIC_APPLICANT_INDIVIDUAL };
const organisation = { uk: VALID_UK_APPLICANT_ORGANISATION, 'non-uk': VALID_NON_UK_BIC_APPLICANT_ORGANISATION };

export const APPLICANT_BANK_SCENARIOS = [
  {
    name: 'Individual',
    storyTag: '@JIRA-STORY:PO-9802',
    childPath: PATHS.children.applicantIndividual,
    selectors: Page.applicantIndividual,
    savedApplicant: individual,
    mount: (bank: BankType) => setupApplicantIndividual({ savedApplicant: individual[bank] }),
  },
  {
    name: 'Organisation',
    storyTag: '@JIRA-STORY:PO-9803',
    childPath: PATHS.children.applicantOrganisation,
    selectors: Page.applicantOrganisation,
    savedApplicant: organisation,
    mount: (bank: BankType) => setupApplicantOrganisation({ savedApplicant: organisation[bank] }),
  },
];

export const watchDraftCasefileWrites = (): void => {
  cy.intercept(
    { method: '+(POST|PUT|PATCH|DELETE)', url: /\/draft-casefiles(?:[/?#]|$)/ },
    cy.spy().as('draftCasefileWrite'),
  );
};
