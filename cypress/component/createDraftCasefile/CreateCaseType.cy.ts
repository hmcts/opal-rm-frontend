import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-case-type/constants/cases-create-casefile-case-type-field-names.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { DASHBOARD_ROUTING_PATHS } from 'src/app/pages/dashboard/constants/dashboard-routing-paths.constant';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { setupCreateCasefileCaseType } from './setup/create-case-type.setup';
import type { CasesCreateCasefileStoreInstance } from './setup/create-case-type.setup';

const CREATE_CASEFILE_STORY_TAG = '@JIRA-STORY:PO-9799';
const CREATE_CASEFILE_EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (...tags: string[]): string[] => [...tags, CREATE_CASEFILE_STORY_TAG, CREATE_CASEFILE_EPIC_TAG];
const taskListPath = `/${CASES_CREATE_CASEFILE_ROUTING_PATHS.root}/${CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList}`;
const casesDashboardPath = `/${DASHBOARD_ROUTING_PATHS.root}/${DASHBOARD_ROUTING_PATHS.children.cases}`;

const assertStoredSelection = (
  expectedSelection: ReturnType<CasesCreateCasefileStoreInstance['caseTypeSelection']>,
) => {
  cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
    expect(store.caseTypeSelection()).to.deep.equal(expectedSelection);
    expect(store.stateChanges()).to.equal(true);
    expect(store.unsavedChanges()).to.equal(false);
  });
};

const assertCanonicalIdentifierContract = (
  prefix: string,
  expectedControlNames: readonly string[],
  submitSelector: string,
  errorLinksSelector: string,
): void => {
  cy.get('form input, form select, form textarea').then(($controls) => {
    const controls = [...$controls] as HTMLElement[];
    const ids = controls.map((control) => control.id);
    const names = controls.map((control) => control.getAttribute('name') ?? '');

    expect(ids.every((id) => id.startsWith(prefix))).to.equal(true);
    expect(names.every((name) => name.startsWith(prefix))).to.equal(true);
    expect(new Set(ids).size).to.equal(ids.length);
    expect(expectedControlNames.every((name) => names.includes(name))).to.equal(true);
  });
  cy.get(submitSelector).click();
  cy.get(errorLinksSelector).each(($link) => {
    cy.wrap($link).click();
    cy.focused().should(($focused) => {
      const targetId = $focused.attr('id') ?? '';
      expect(targetId.startsWith(prefix)).to.equal(true);
      expect(Cypress.$(`#${targetId}`)).to.have.length(1);
    });
  });
};

describe('Create Casefile Case Type', () => {
  it(
    'AC1, AC2. should use canonical unique control identifiers with exact error targets',
    { tags: buildTags() },
    () => {
      setupCreateCasefileCaseType();

      assertCanonicalIdentifierContract(
        'create_casefile_case_type_',
        Object.values(CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES),
        Page.continueButton,
        Page.errorSummaryLinks,
      );
    },
  );

  it('AC1. should render the exact case type content with no default values', { tags: buildTags() }, () => {
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
      .and(
        'have.attr',
        'aria-describedby',
        `${CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES.caseType}-remo-in-description`,
      )
      .and('not.have.attr', 'aria-expanded');
    cy.get(Page.remoInDescription)
      .invoke('text')
      .then((text) => expect(text.trim()).to.equal('Selecting REMO In reveals the required applicant type field.'));
    cy.get(Page.applicantConditional).should('have.class', 'govuk-radios__conditional--hidden');
  });

  it('AC2. should require explicit Case Type and Applicant Type choices', { tags: buildTags() }, () => {
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

  it('AC2. should link summary errors to the correct fields', { tags: buildTags() }, () => {
    setupCreateCasefileCaseType();

    cy.get(Page.continueButton).click();
    cy.get(Page.errorSummaryLinks).contains('Select a case type').click();
    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).should('be.focused');

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(Page.continueButton).click();
    cy.get(Page.errorSummaryLinks).contains('Select applicant type').click();
    cy.get(Page.applicantType).should('be.focused');
  });

  it('AC3. should save REMO In and request Task List navigation', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('postRequest');
    cy.intercept({ method: 'POST', url: '**/draft-casefiles**' }, (request) => {
      postRequestSpy(request);
      request.continue();
    });
    setupCreateCasefileCaseType();

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(Page.applicantType).select(CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION);
    cy.get(Page.continueButton).click();
    assertStoredSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    });
    cy.get('@routerNavigate').should('have.been.calledWith', [taskListPath], {});
    cy.get('@postRequest').should('not.have.been.called');
  });

  it('AC1, AC3. should clear Applicant Type after switching outbound', { tags: buildTags() }, () => {
    setupCreateCasefileCaseType();

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(Page.applicantType).select(CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL);
    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT)).check();
    cy.get(Page.applicantConditional).should('have.class', 'govuk-radios__conditional--hidden');
    cy.get(Page.applicantType).should('be.disabled');
    cy.get(Page.applicantTypeSelectedOption).should('have.text', 'Select');
    cy.get(Page.continueButton).click();
    assertStoredSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    cy.get('@routerNavigate').should('have.been.calledWith', [taskListPath], {});
  });

  it('AC3. should save REMO Out (CMS) and request Task List navigation', { tags: buildTags() }, () => {
    setupCreateCasefileCaseType();

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS)).check();
    cy.get(Page.continueButton).click();
    assertStoredSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });
    cy.get('@routerNavigate').should('have.been.calledWith', [taskListPath], {});
  });

  it('AC3. should rehydrate a saved valid selection', { tags: buildTags() }, () => {
    setupCreateCasefileCaseType({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    });

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).should('be.checked');
    cy.get(Page.applicantTypeSelectedOption).should('have.text', CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL);
  });

  it('AC4. should support keyboard focus order for Continue and Cancel', { tags: buildTags() }, () => {
    setupCreateCasefileCaseType();

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT)).check().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.continueButton).should('have.focus');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.cancelLink).should('have.focus');
  });

  it('AC3. should request Cases dashboard navigation on Cancel', { tags: buildTags() }, () => {
    setupCreateCasefileCaseType();

    cy.get(Page.cancelLink).click();
    cy.get('@routerNavigate').should('have.been.calledWith', [casesDashboardPath], {});
  });

  it('AC4. should have no detected Axe violations with a valid conditional selection', { tags: buildTags() }, () => {
    setupCreateCasefileCaseType();

    cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(Page.applicantType).select(CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL);
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  for (const width of [1280, 320]) {
    it(`AC4. should reflow without horizontal page overflow at ${width}px`, { tags: buildTags() }, () => {
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
