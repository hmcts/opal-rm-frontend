import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { setupCreateCasefileCaseType } from './setup/create-case-type.setup';

const buildStoryTags = () => ['@JIRA-STORY:PO-9799', '@JIRA-EPIC:PO-6506'];

describe('Create Casefile Case Type', { tags: buildStoryTags() }, () => {
  it('renders the exact case type content with no default values', () => {
    setupCreateCasefileCaseType();

    cy.get(Page.heading).should('have.text', 'Create a case');
    cy.get(Page.caseTypeLegend)
      .invoke('text')
      .then((text) => expect(text.trim()).to.equal('Select a case type'));
    cy.get(Page.applicantTypeLabel).should('have.text', 'Select applicant type');
    cy.get(Page.continueButton).should('have.text', 'Continue');
    cy.get(Page.cancelLink).should('have.text', 'Cancel');
    cy.get(Page.caseTypeRadios)
      .should('have.length', 3)
      .then(($radios) => {
        expect([...$radios].map((radio) => (radio as HTMLInputElement).value)).to.deep.equal([
          CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
          CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT,
          CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS,
        ]);
      });
    cy.get(Page.caseTypeLabels)
      .should('have.length', 3)
      .then(($labels) => {
        expect([...$labels].map((label) => label.textContent?.trim())).to.deep.equal([
          'REMO In',
          'REMO Out',
          'REMO Out (CMS)',
        ]);
      });
    cy.get(`${Page.caseTypeRadios}:checked`).should('not.exist');
    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN))
      .should('have.attr', 'aria-controls', 'applicantTypeConditional')
      .and('have.attr', 'aria-describedby', 'caseType-remo-in-description')
      .and('not.have.attr', 'aria-expanded');
    cy.get(Page.remoInDescription)
      .invoke('text')
      .then((text) => expect(text.trim()).to.equal('Selecting REMO In reveals the required applicant type field.'));
    cy.get(Page.applicantConditional).should('have.class', 'govuk-radios__conditional--hidden');
  });

  it('requires explicit Case Type and Applicant Type choices', () => {
    setupCreateCasefileCaseType();

    cy.get(Page.continueButton).click();
    cy.get(Page.caseTypeError).should('contain.text', 'Select a case type');
    cy.get(Page.errorSummary).should('be.focused').and('contain.text', 'Select a case type');

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(Page.applicantConditional).should('not.have.class', 'govuk-radios__conditional--hidden');
    cy.get(Page.applicantTypeSelectedOption).should('have.text', 'Select');
    cy.get(Page.continueButton).click();
    cy.get(Page.applicantTypeError).should('contain.text', 'Select applicant type');
    cy.get(Page.errorSummary).should('be.focused').and('contain.text', 'Select applicant type');
  });

  it('links summary errors to the correct fields', () => {
    setupCreateCasefileCaseType();

    cy.get(Page.continueButton).click();
    cy.get(Page.errorSummaryLinks).contains('Select a case type').click();
    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).should('be.focused');

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(Page.continueButton).click();
    cy.get(Page.errorSummaryLinks).contains('Select applicant type').click();
    cy.get(Page.applicantType).should('be.focused');
  });

  it('saves REMO In and requests Task List navigation', () => {
    setupCreateCasefileCaseType();

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(Page.applicantType).select(CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION);
    cy.get(Page.continueButton).click();
    cy.get('@routerNavigate').should('have.been.calledWith', ['/cases/create-casefile/task-list'], {});
  });

  it('clears Applicant Type after switching outbound', () => {
    setupCreateCasefileCaseType();

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(Page.applicantType).select(CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL);
    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT)).check();
    cy.get(Page.applicantConditional).should('have.class', 'govuk-radios__conditional--hidden');
    cy.get(Page.applicantType).should('be.disabled');
    cy.get(Page.applicantTypeSelectedOption).should('have.text', 'Select');
    cy.get(Page.continueButton).click();
    cy.get('@routerNavigate').should('have.been.calledWith', ['/cases/create-casefile/task-list'], {});
  });

  it('saves REMO Out (CMS) and requests Task List navigation', () => {
    setupCreateCasefileCaseType();

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS)).check();
    cy.get(Page.continueButton).click();
    cy.get('@routerNavigate').should('have.been.calledWith', ['/cases/create-casefile/task-list'], {});
  });

  it('rehydrates a saved valid selection', () => {
    setupCreateCasefileCaseType({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    });

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).should('be.checked');
    cy.get(Page.applicantTypeSelectedOption).should('have.text', CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL);
  });

  it('supports keyboard focus and has no detected Axe violations', () => {
    setupCreateCasefileCaseType();

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).focus().should('be.focused');
    cy.get(Page.continueButton).focus().should('be.focused');
    cy.get(Page.cancelLink).focus().should('be.focused');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  for (const width of [1280, 320]) {
    it(`reflows without horizontal page overflow at ${width}px`, () => {
      cy.viewport(width, 900);
      setupCreateCasefileCaseType();

      if (width === 320) {
        cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
        cy.get(Page.continueButton).click();
        cy.get(Page.errorSummary).should('contain.text', 'Select applicant type');
      }

      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
      });
    });
  }
});
