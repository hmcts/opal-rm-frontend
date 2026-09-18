import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { CasesCreateCasefileComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile.component';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { IOpalMaintenanceResultDetail } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-result-detail.interface';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { ERROR_SUMMARY_TITLE, UNSAVED_CHANGES_WARNING } from '../constants/create-casefile-test-copy.constant';
import { setupOrderTerms, type OrderTermsStore } from '../orderTerms/setup/order-terms.setup';
import { ORDER_TERMS_INPUT_MOCK as M } from './mocks/order-terms-input.mock';
import { ORDER_TERMS_INPUT_COPY } from './constants/order-terms-input-copy.constant';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9807', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const inputPath = (id = 'MAT') => PATHS.children.orderTermsInput + '/' + id;
const openInput = (id = 'MAT') => setupOrderTerms({ savedId: id, initialChild: inputPath(id) });
const openControls = () =>
  setupOrderTerms({
    shell: true,
    savedId: 'MAT',
    initialChild: inputPath(),
    detailSource: of(structuredClone(M.allControls)),
  });
const assertTerms = (parameters: Record<string, string | number | boolean>) =>
  cy
    .get<OrderTermsStore>('@casesCreateCasefileStore')
    .then((store) =>
      expect(store.orderTerms()).to.deep.equal([{ termId: 1, resultId: 'MAT', parameters, creditor: null }]),
    );
const dateText = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
const fillControls = () => {
  cy.get(S.orderTermsInput.shortText).type('Valid');
  cy.get(S.orderTermsInput.longText).type('Synthetic long text');
  cy.get(S.orderTermsInput.integer).type('3');
  cy.get(S.orderTermsInput.radioOption).check();
  cy.get(S.orderTermsInput.select).select('x');
  cy.get(S.orderTermsInput.checkbox).focus();
  cy.press(Cypress.Keyboard.Keys.SPACE);
};

describe('Order term input', () => {
  beforeEach(() => cy.viewport(1280, 900));
  it('AC1, AC2, AC3, AC4. should accept a metadata term locally and go to Creditor', { tags: buildTags() }, () => {
    setupOrderTerms({
      shell: true,
      savedId: 'MAT',
      initialChild: PATHS.children.orderTermsInput + '/MAT',
      draftValues: structuredClone(M.valid),
    });
    cy.get(S.orderTermsInput.frequency).should('contain.text', 'Weekly').find('input, select').should('not.exist');
    cy.screenshot('po-9807-mat');
    cy.get(S.orderTermsInput.amount).clear().type('25.1');
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get<Router>('@angularRouter').its('url').should('eq', '/cases/create-casefile/order-terms/creditor');
    cy.screenshot('po-9807-creditor');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.deep.equal([
        { termId: 1, resultId: 'MAT', parameters: { amount: '25.10' }, creditor: null },
      ]);
      expect(store.orderTermDraft()).to.eq(null);
      expect(store.pendingOrderTermResultId()).to.eq(null);
    });
  });
  it(
    'AC3. should preserve valid inputs and focus the first erroneous field from summary',
    { tags: buildTags() },
    () => {
      setupOrderTerms({
        shell: true,
        savedId: 'MAT',
        initialChild: PATHS.children.orderTermsInput + '/MAT',
        draftValues: structuredClone(M.invalid),
      });
      cy.get(S.orderTermsInput.continueButton).click();
      cy.get(S.errorSummary).should('be.focused').and('contain.text', ERROR_SUMMARY_TITLE);
      cy.get(S.errorSummary).should('contain.text', ORDER_TERMS_INPUT_COPY.expiryInvalid);
      cy.screenshot('po-9807-mat-errors');
      cy.get(S.errorSummaryLinks).first().should('have.text', ORDER_TERMS_INPUT_COPY.numeric).click();
      cy.get(S.orderTermsInput.amount).should('be.focused').and('have.value', 'abc');
      cy.get(S.orderTermsInput.arrears).should('have.value', '12.30');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTerms()).to.deep.equal([]),
      );
    },
  );
  for (const confirmed of [false, true]) {
    it(`AC4. should ${confirmed ? 'discard' : 'retain'} a cancelled draft`, { tags: buildTags() }, () => {
      setupOrderTerms({ savedId: 'MAT', initialChild: PATHS.children.orderTermsInput + '/MAT' });
      cy.get(S.orderTermsInput.amount).type('10');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
      cy.on('window:confirm', (message) => {
        expect(message).to.eq(UNSAVED_CHANGES_WARNING);
        return confirmed;
      });
      cy.get(S.orderTermsInput.cancel).click();
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()).to.deep.equal([]);
        expect(store.orderTermDraft() === null).to.eq(confirmed);
      });
      if (!confirmed) cy.get(S.orderTermsInput.amount).should('have.value', '10');
      else cy.get(S.orderTerms.select).should('have.value', 'MAT');
    });
  }
  it('AC2. should keep Selection and its title until usable detail arrives', { tags: buildTags() }, () => {
    const detail = new Subject<IOpalMaintenanceResultDetail | null>();
    setupOrderTerms({ detailSource: detail });
    cy.get(S.orderTerms.select).select('MAT');
    cy.get(S.orderTerms.continueButton).click();
    cy.get(S.orderTermsInput.amount).should('not.exist');
    cy.title().should('eq', 'OPAL - What type of order are you adding?');
    cy.then(() => detail.next(structuredClone(M.mat)));
    cy.get(S.orderTermsInput.amount).should('be.visible');
    cy.title().should('eq', 'OPAL - Maintenance');
  });
  it('AC5. should follow metadata keyboard order and skip read-only frequency', { tags: buildTags() }, () => {
    setupOrderTerms({ savedId: 'MAT', initialChild: PATHS.children.orderTermsInput + '/MAT' });
    cy.get(S.orderTermsInput.amount).focus();
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTermsInput.expiry).should('be.focused');
    cy.get(S.orderTermsInput.frequency).find('input, select, button').should('not.exist');
  });
  for (const validation of [false, true]) {
    it(`AC5. should detect no Axe violations with validation=${validation}`, { tags: buildTags() }, () => {
      setupOrderTerms({ shell: true, savedId: 'MCHILD', initialChild: PATHS.children.orderTermsInput + '/MCHILD' });
      if (validation) cy.get(S.orderTermsInput.continueButton).click();
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot(validation ? 'po-9807-mchild-errors' : 'po-9807-mchild');
    });
  }
});

describe('Order term input regressions', () => {
  beforeEach(() => cy.viewport(1280, 900));
  it('AC3. should omit optional expiry and arrears and accept zero amount', { tags: buildTags() }, () => {
    openInput();
    cy.get(S.orderTermsInput.amount).type('0');
    cy.get(S.orderTermsInput.continueButton).click();
    assertTerms({ amount: '0.00' });
  });

  it(
    'AC3. should require child fields in metadata order and accept only a past birth date',
    { tags: buildTags() },
    () => {
      openInput('MCHILD');
      cy.get(S.orderTermsInput.continueButton).click();
      cy.get(S.errorSummaryLinks).then((links) =>
        expect([...links].map((link) => link.textContent?.trim())).to.deep.equal([
          'Enter child’s name',
          'Enter child’s date of birth',
          ORDER_TERMS_INPUT_COPY.amountRequired,
        ]),
      );
      cy.get(S.orderTermsInput.childName).type(M.childValid.child_name);
      cy.get(S.orderTermsInput.childBirth).type(dateText(new Date()));
      cy.get(S.orderTermsInput.amount).type(M.childValid.amount);
      cy.get(S.orderTermsInput.continueButton).click();
      cy.get(S.errorSummaryLinks).should('have.text', ORDER_TERMS_INPUT_COPY.birthPast);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      cy.get(S.orderTermsInput.childBirth).clear().type(dateText(yesterday));
      cy.get(S.orderTermsInput.continueButton).click();
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTerms()).to.deep.equal([
          {
            resultId: 'MCHILD',
            parameters: {
              child_name: M.childValid.child_name,
              child_date_of_birth: `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`,
              amount: '20.00',
            },
          },
        ]),
      );
    },
  );

  it('AC4. should accept a duplicate submit only once', { tags: buildTags() }, () => {
    openInput();
    cy.get(S.orderTermsInput.amount).type('10');
    cy.get(S.orderTermsInput.form).then((form) => {
      form[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    assertTerms({ amount: '10.00' });
  });

  it('AC4. should preserve an accepted term when cancelling a second draft', { tags: buildTags() }, () => {
    openInput();
    cy.get(S.orderTermsInput.amount).type('10');
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.orderTermsInput.creditorReturn).click();
    cy.get(S.orderTerms.add).click();
    cy.get(S.orderTerms.select).select('MAT');
    cy.get(S.orderTerms.continueButton).click();
    cy.get(S.orderTermsInput.amount).type('20');
    cy.on('window:confirm', () => true);
    cy.get(S.orderTermsInput.cancel).click();
    assertTerms({ amount: '10.00' });
  });

  it('AC2. should announce failed detail in the real shell and allow keyboard retry', { tags: buildTags() }, () => {
    setupOrderTerms({ shell: true, savedId: 'MAT', detailSource: of(null) });
    cy.get('@getResult').then((aliased) =>
      (aliased as unknown as sinon.SinonStub).onSecondCall().returns(of(structuredClone(M.mat))),
    );
    cy.get(S.orderTerms.continueButton).click();
    cy.get('@getResult').should('have.been.calledOnce');
    cy.get(S.globalErrorBanner).should('have.length', 1).and('be.visible');
    cy.get(S.liveAnnouncement).should('contain.text', 'You can try again.').and('have.attr', 'aria-atomic', 'true');
    cy.get(S.orderTerms.continueButton).should('be.focused').and('not.be.disabled');
    cy.get(S.orderTerms.select).should('have.value', 'MAT');
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.pendingOrderTermResultId()).to.eq('MAT');
      expect(store.orderTermDraft()).to.eq(null);
    });
    const keydown = cy.spy().as('retryKeydown');
    const activation = cy.spy().as('retryActivation');
    cy.get(S.orderTerms.continueButton).then((button) => {
      button[0].addEventListener('keydown', keydown);
      button[0].addEventListener('click', activation);
    });
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get('@retryKeydown').should('have.been.calledWithMatch', { key: ' ', isTrusted: true });
    cy.get('@retryActivation').should('have.been.calledOnce').and('have.been.calledWithMatch', { isTrusted: true });
    cy.get(S.orderTermsInput.amount).should('be.visible');
  });

  it('AC2. should render the shared HTTP problem literally with correlation and retry', { tags: buildTags() }, () => {
    let attempts = 0;
    cy.intercept('GET', '**/opal-maintenance-service/results/MAT', (request) =>
      request.reply(++attempts === 1 ? { statusCode: 503, body: M.problem } : { body: M.mat }),
    ).as('detail');
    setupOrderTerms({ shell: true, savedId: 'MAT', detailHttp: true });
    cy.get(S.orderTerms.continueButton).click();
    cy.get('@getResult').should('have.been.calledOnce');
    cy.wait('@detail');
    cy.get(S.globalErrorBanner)
      .should('have.length', 1)
      .and('contain.text', M.problem.title)
      .and('contain.text', M.problem.detail)
      .and('contain.text', M.problem.operation_id)
      .find('strong, img')
      .should('not.exist');
    cy.get(S.liveAnnouncement).should('contain.text', M.problem.operation_id).and('have.attr', 'aria-atomic', 'true');
    cy.get(S.orderTerms.continueButton).should('be.focused');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
    cy.get(S.orderTerms.continueButton).click();
    cy.wait('@detail');
    cy.get(S.orderTermsInput.amount).should('be.visible');
    cy.get('@getResult').should('have.been.calledTwice');
    cy.get('@detail.all').should('have.length', 2);
  });

  it(
    'AC1, AC3, AC5. should validate every required control and accept canonical keyboard selections',
    { tags: buildTags() },
    () => {
      openControls();
      cy.get(S.orderTermsInput.continueButton).click();
      cy.get(S.errorSummaryLinks).then((links) =>
        expect([...links].map((link) => link.textContent?.trim())).to.deep.equal(M.controlErrors),
      );
      cy.get(S.orderTermsInput.inlineErrors).should('have.length', 6);
      fillControls();
      cy.get(S.orderTermsInput.autocomplete).type('Example');
      cy.get(S.orderTermsInput.autocompleteOptions).should('have.length', 2);
      cy.get(S.orderTermsInput.autocomplete).type('{downarrow}{enter}');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').should((store) =>
        expect(store.orderTermDraft()?.values['lookup']).to.eq('example_a'),
      );
      cy.get(S.orderTermsInput.continueButton).click();
      assertTerms({
        short_text: 'Valid',
        long_text: 'Synthetic long text',
        count: 3,
        choice: 'a',
        menu: 'x',
        lookup: 'example_a',
        confirm: true,
      });
    },
  );

  it('AC3. should accept a matching autocomplete label on blur and store its option ID', { tags: buildTags() }, () => {
    openControls();
    fillControls();
    cy.get(S.orderTermsInput.autocomplete).type('Example A').blur();
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').should((store) =>
      expect(store.orderTermDraft()?.values['lookup']).to.eq('example_a'),
    );
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
      expect(store.orderTerms()[0].parameters['lookup']).to.eq('example_a'),
    );
  });

  it('AC5. should focus the first radio from a keyboard activated summary link', { tags: buildTags() }, () => {
    openControls();
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.errorSummaryLinks).contains('Select choice').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.orderTermsInput.radioOption).should('be.focused');
  });

  it('AC5. should link checkbox errors and hints to existing IDs and toggle with Space', { tags: buildTags() }, () => {
    const detail = structuredClone(M.allControls);
    const parameters = JSON.parse(detail.result_parameters);
    parameters.at(-1).hint = 'Confirm the synthetic entry';
    detail.result_parameters = JSON.stringify(parameters);
    setupOrderTerms({ shell: true, savedId: 'MAT', initialChild: inputPath(), detailSource: of(detail) });
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.errorSummaryLinks).contains('Select confirm').click();
    cy.get(S.orderTermsInput.checkbox).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.orderTermsInput.checkbox).should('be.checked');
    cy.get(S.orderTermsInput.checkboxFieldset)
      .invoke('attr', 'aria-describedby')
      .then((ids) => {
        expect(ids).to.be.a('string').and.not.be.empty;
        cy.document().then((document) =>
          ids!.split(' ').forEach((id) => expect(document.getElementById(id), id).not.to.eq(null)),
        );
      });
  });

  it('AC1. should render metadata text and preserve plain autocomplete labels', { tags: buildTags() }, () => {
    cy.window().then((window) => cy.stub(window, 'alert').as('metadataAlert'));
    setupOrderTerms({
      shell: true,
      savedId: 'MAT',
      initialChild: inputPath(),
      detailSource: of(structuredClone(M.literal)),
    });
    cy.get(S.orderTerms.heading).should('have.text', M.literal.result_title);
    cy.get(S.orderTermsInput.shortText).should('be.visible');
    cy.get(S.orderTermsInput.shortTextLabel)
      .invoke('text')
      .should((text) => expect(text.trim()).to.eq(M.literal.result_title));
    cy.get(S.orderTermsInput.shortTextHint)
      .invoke('text')
      .should((text) => expect(text.trim()).to.eq(M.literal.result_title));
    cy.get(S.orderTermsInput.autocomplete).type('synthetic');
    cy.get(S.orderTermsInput.autocompleteOptions).should('contain.text', M.autocompleteLabels[0]);
    cy.get(S.orderTermsInput.autocompleteOptions).contains(M.autocompleteLabels[0]).click();
    cy.get(S.orderTermsInput.autocomplete).should('have.value', M.autocompleteLabels[0]);
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').should((store) =>
      expect(store.orderTermDraft()?.values['lookup']).to.eq('literal'),
    );
    cy.get(S.orderTermsInput.autocomplete).clear().type(M.autocompleteLabels[1]).blur();
    cy.get(S.orderTermsInput.autocomplete).should('have.value', M.autocompleteLabels[1]);
    cy.get<OrderTermsStore>('@casesCreateCasefileStore').should((store) =>
      expect(store.orderTermDraft()?.values['lookup']).to.eq('event'),
    );
    cy.get(S.orderTermsInput.metadataMarkup).should('not.exist');
    cy.get('@metadataAlert').should('not.have.been.called');
  });

  it(
    'AC1. should display the latest frequency without copying it to draft or accepted parameters',
    { tags: buildTags() },
    () => {
      openInput();
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
        store.setOrderDetails({ ...store.orderDetails()!, paymentFrequency: 'Monthly' }),
      );
      cy.get(S.orderTermsInput.frequency).should('contain.text', 'Monthly');
      cy.get(S.orderTermsInput.amount).type('5');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTermDraft()?.values).not.to.have.property('frequency'),
      );
      cy.get(S.orderTermsInput.continueButton).click();
      assertTerms({ amount: '5.00' });
    },
  );

  for (const confirmed of [false, true]) {
    it(`AC4. should ${confirmed ? 'clear' : 'retain'} input state on external departure`, { tags: buildTags() }, () => {
      openInput();
      cy.get(S.orderTermsInput.amount).type('10');
      cy.get<CasesCreateCasefileComponent>('@journeyComponent').then((component) =>
        expect(component.handleBeforeUnload()).to.eq(false),
      );
      cy.on('window:confirm', () => confirmed);
      cy.get<Router>('@angularRouter').then((router) => router.navigateByUrl('/order-terms-test-external'));
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTermDraft() === null).to.eq(confirmed),
      );
      if (!confirmed) cy.get(S.orderTermsInput.amount).should('have.value', '10');
    });
  }

  it('AC4. should protect accepted terms from reload', { tags: buildTags() }, () => {
    openInput();
    cy.get(S.orderTermsInput.amount).type('10');
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get<CasesCreateCasefileComponent>('@journeyComponent').then((component) =>
      expect(component.handleBeforeUnload()).to.eq(false),
    );
  });

  it('AC5. should reflow Creditor at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupOrderTerms({ shell: true, savedId: 'MAT', initialChild: inputPath() });
    cy.get(S.orderTermsInput.amount).type('10');
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.orderTermsInput.creditorReturn).should('be.visible');
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
    cy.screenshot('po-9807-creditor-320');
  });

  for (const id of ['MAT', 'MCHILD']) {
    it(`AC5. should reflow ${id} validation at 320 CSS pixels`, { tags: buildTags() }, () => {
      cy.viewport(320, 900);
      setupOrderTerms({ shell: true, savedId: id, initialChild: inputPath(id) });
      cy.get(S.orderTermsInput.continueButton).click();
      cy.document().should((document) =>
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
      );
      cy.screenshot('po-9807-' + id.toLowerCase() + '-320-errors');
    });
  }

  for (const validation of [false, true]) {
    it(
      `AC5. should detect no Axe violations for all controls with validation=${validation}`,
      { tags: buildTags() },
      () => {
        openControls();
        if (validation) cy.get(S.orderTermsInput.continueButton).click();
        cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
        cy.checkA11y();
        cy.screenshot(validation ? 'po-9807-all-controls-errors' : 'po-9807-all-controls');
      },
    );
  }
});
