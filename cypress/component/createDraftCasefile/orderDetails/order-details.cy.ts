import { Router } from '@angular/router';
import { CasesCreateCasefileComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile.component';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from 'src/app/flows/cases/cases-create-casefile/stores/cases-create-casefile.store';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { setupOrderDetails } from './setup/order-details.setup';
import { ORDER_DETAILS_MOCK as M } from './mocks/order-details.mock';
const buildTags = () => ['@JIRA-STORY:PO-9805', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
type Store = InstanceType<typeof CasesCreateCasefileStore>;

describe('Order Details', () => {
  it('AC1, AC4. should fetch on every entry and save an edited frequency locally', { tags: buildTags() }, () => {
    cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', {
      body: structuredClone(M.response),
    }).as('applications');
    setupOrderDetails(M.saved);
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.wait('@applications')
      .its('request.query')
      .should('deep.equal', { application_group: 'Create Casefile', active: 'true' });
    cy.get(S.orderDetails.paymentFrequency).select('Monthly');
    cy.get(S.orderDetails.returnButton).click();
    cy.get<Store>('@casesCreateCasefileStore').should((store) => {
      expect(store.orderDetails()).to.deep.equal({ ...M.saved, paymentFrequency: 'Monthly' });
      expect(store.unsavedChanges()).to.equal(false);
      expect(store.remainingOrderTasksAvailable()).to.equal(true);
    });
    cy.get(S.caseDetails.orderDetailsStatus).should('contain.text', 'Provided');
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.wait('@applications');
    cy.get('@applications.all').should('have.length', 2);
    cy.get(S.orderDetails.paymentFrequency).should('have.value', 'Monthly');
  });

  it('AC2. should retain saved details after an empty lookup and retry on re-entry', { tags: buildTags() }, () => {
    let attempts = 0;
    cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', (request) => {
      attempts++;
      request.reply({ body: attempts === 1 ? { count: 0, refData: [] } : structuredClone(M.response) });
    }).as('applications');
    setupOrderDetails(M.saved);
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.wait('@applications');
    cy.get(S.orderDetails.application).should('not.exist');
    cy.get<Store>('@casesCreateCasefileStore').should((store) => expect(store.orderDetails()).to.deep.equal(M.saved));
    cy.get(S.caseDetails.orderDetailsLink).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.wait('@applications');
    cy.get(S.orderDetails.application).should('have.value', 'TEST01 - Synthetic application');
    cy.get('@applications.all').should('have.length', 2);
  });

  it('AC3, AC5. should focus the summary and navigate to the application error', { tags: buildTags() }, () => {
    cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', { body: structuredClone(M.response) });
    setupOrderDetails();
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.get(S.orderDetails.returnButton).click();
    cy.get(S.errorSummary).should('be.focused').and('contain.text', 'There is a problem');
    cy.get(S.errorSummaryLinks).should('have.length', 3);
    cy.get(S.errorSummaryLinks).contains('Select an application code').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.orderDetails.application).should('be.focused');
    cy.get(S.errorSummaryLinks).contains('Select a payment frequency').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.orderDetails.paymentFrequency).should('be.focused');
    cy.get(S.errorSummaryLinks).contains('Enter the date arrears last updated').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.orderDetails.dateArrearsLastUpdated).should('be.focused');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC4. should retain edits when Cancel departure is declined', { tags: buildTags() }, () => {
    cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', { body: structuredClone(M.response) });
    setupOrderDetails(M.saved);
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.get(S.orderDetails.court).clear().type('Edited synthetic court');
    cy.get<Store>('@casesCreateCasefileStore').should((store) => expect(store.unsavedChanges()).to.equal(true));
    cy.on('window:confirm', () => false);
    cy.get(S.orderDetails.cancel).click();
    cy.get(S.orderDetails.court).should('have.value', 'Edited synthetic court');
    cy.get<Store>('@casesCreateCasefileStore').should((store) => expect(store.orderDetails()).to.deep.equal(M.saved));
  });
});

const lookup = () =>
  cy
    .intercept('GET', '**/opal-maintenance-service/maintenance-applications*', { body: structuredClone(M.response) })
    .as('applications');
const openSaved = () => {
  lookup();
  setupOrderDetails(M.saved);
  cy.get(S.caseDetails.orderDetailsLink).click();
  cy.wait('@applications');
};
const assertSaved = () =>
  cy.get<Store>('@casesCreateCasefileStore').should((store) => expect(store.orderDetails()).to.deep.equal(M.saved));

describe('Order Details independent browser contracts', () => {
  it('AC1. should keep Case Details while the lookup is pending', { tags: buildTags() }, () => {
    let release: () => void;
    cy.intercept(
      'GET',
      '**/opal-maintenance-service/maintenance-applications*',
      (request) =>
        new Promise<void>((resolve) => {
          release = () => {
            request.reply({ body: structuredClone(M.response) });
            resolve();
          };
        }),
    ).as('applications');
    setupOrderDetails();
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.get('@applications.all').should('have.length', 1);
    cy.get(S.caseDetails.heading).should('have.text', 'Case details');
    cy.get(S.orderDetails.application).should('not.exist');
    cy.then(() => release());
    cy.wait('@applications');
    cy.get(S.orderDetails.application).should('be.visible');
  });

  it(
    'AC2. should announce an empty lookup in the real application shell and allow keyboard retry',
    { tags: buildTags() },
    () => {
      let attempts = 0;
      cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', (request) =>
        request.reply({ body: ++attempts === 1 ? { count: 0, refData: [] } : structuredClone(M.response) }),
      ).as('applications');
      setupOrderDetails(M.saved, { shell: true });
      cy.get(S.caseDetails.orderDetailsLink).click();
      cy.wait('@applications');
      cy.get(S.globalErrorBanner)
        .should('be.visible')
        .and('contain.text', 'There was a problem')
        .and('contain.text', 'You can try again. If the problem persists, contact the service desk.');
      cy.get(S.liveAnnouncement)
        .should('contain.text', 'There was a problem')
        .and('contain.text', 'You can try again.')
        .and('have.attr', 'aria-atomic', 'true');
      cy.get(S.orderDetails.application).should('not.exist');
      assertSaved();
      cy.get(S.caseDetails.orderDetailsLink).focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.wait('@applications');
      cy.get(S.orderDetails.application).should('be.visible');
      cy.get('@applications.all').should('have.length', 2);
    },
  );

  it(
    'AC2. should show safe correlated 503 copy, preserve parties and pass global-error Axe',
    { tags: buildTags() },
    () => {
      let attempts = 0;
      cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', (request) =>
        request.reply(
          ++attempts === 1
            ? { statusCode: 503, body: structuredClone(M.problem) }
            : { body: structuredClone(M.response) },
        ),
      ).as('applications');
      setupOrderDetails(M.saved, { shell: true });
      cy.get(S.caseDetails.orderDetailsLink).click();
      cy.wait('@applications');
      cy.get(S.globalErrorBanner)
        .should('contain.text', 'There was a problem')
        .and('contain.text', M.problem.operation_id)
        .and('not.contain.text', M.problem.title)
        .and('not.contain.text', M.problem.detail);
      cy.get(S.liveAnnouncement)
        .should('contain.text', 'There was a problem')
        .and('contain.text', 'You can try again.')
        .and('have.attr', 'aria-atomic', 'true')
        .and('contain.text', M.problem.operation_id)
        .and('not.contain.text', M.problem.detail)
        .and('not.contain.text', M.problem.title);
      cy.get(S.caseDetails.respondentStatus).should('contain.text', 'Provided');
      cy.get(S.caseDetails.applicantStatus).should('contain.text', 'Provided');
      assertSaved();
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po-9805-global-error');
      cy.get(S.caseDetails.orderDetailsLink).focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.wait('@applications');
      cy.get('@applications.all').should('have.length', 2);
      cy.get(S.orderDetails.application).should('have.value', 'TEST01 - Synthetic application');
    },
  );

  it('AC3. should reject unmatched text after blur and preserve saved details', { tags: buildTags() }, () => {
    openSaved();
    cy.get(S.orderDetails.application).clear().type('Unknown application');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderDetails.returnButton).click();
    cy.get(S.errorSummary).should('contain.text', 'Select an application code from the list');
    assertSaved();
  });

  it('AC3. should reject a stale saved application ID', { tags: buildTags() }, () => {
    lookup();
    setupOrderDetails({ ...M.saved, applicationId: 999 });
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.get(S.orderDetails.returnButton).click();
    cy.get(S.errorSummary).should('contain.text', 'Select an application code from the list');
    cy.get<Store>('@casesCreateCasefileStore').should((store) =>
      expect(store.orderDetails()?.applicationId).to.equal(999),
    );
  });

  it('AC3. should refuse typed label without selecting an option', { tags: buildTags() }, () => {
    lookup();
    setupOrderDetails();
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.get(S.orderDetails.application).type('TEST01 - Synthetic application');
    cy.get(S.orderDetails.paymentFrequency).select('Monthly');
    cy.get(S.orderDetails.dateArrearsLastUpdated).type('01/01/2026');
    cy.get(S.orderDetails.returnButton).click();
    cy.get(S.errorSummary).should('contain.text', 'Select an application code from the list');
    cy.get<Store>('@casesCreateCasefileStore').should((store) => expect(store.orderDetails()).to.equal(null));
  });

  it('AC3. should accept a 40-character court and an empty optional date', { tags: buildTags() }, () => {
    openSaved();
    cy.get(S.orderDetails.court).clear().type('C'.repeat(40));
    cy.get(S.orderDetails.returnButton).click();
    cy.get<Store>('@casesCreateCasefileStore').should((store) => {
      expect(store.orderDetails()?.court).to.equal('C'.repeat(40));
      expect(store.orderDetails()?.dateOrderMade).to.equal(null);
    });
  });

  it('AC3. should reject rather than truncate a 41-character court', { tags: buildTags() }, () => {
    openSaved();
    cy.get(S.orderDetails.court).clear().type('C'.repeat(41)).should('have.value', 'C'.repeat(41));
    cy.get(S.orderDetails.returnButton).click();
    cy.get(S.errorSummary).should('contain.text', 'Court that made the order must be 40 characters or fewer');
    assertSaved();
  });

  for (const field of ['dateOrderMade', 'dateArrearsLastUpdated'] as const) {
    for (const value of ['01/02', '31/02/2026', '01/01/2999']) {
      it(`AC3. should reject ${value} in ${field}`, { tags: buildTags() }, () => {
        openSaved();
        cy.get(S.orderDetails[field]).clear().type(value);
        cy.get(S.orderDetails.returnButton).click();
        cy.get(S.errorSummary).should(
          'contain.text',
          value.endsWith('2999') ? 'Date cannot be in the future' : 'Enter a real date in the format DD/MM/YYYY',
        );
        assertSaved();
      });
    }
  }

  it('AC3. should accept today for both dates as local calendar dates', { tags: buildTags() }, () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    openSaved();
    cy.get(S.orderDetails.dateOrderMade).type(`${day}/${month}/${year}`);
    cy.get(S.orderDetails.dateArrearsLastUpdated).clear().type(`${day}/${month}/${year}`);
    cy.get(S.orderDetails.returnButton).click();
    cy.get<Store>('@casesCreateCasefileStore').should((store) => {
      expect(store.orderDetails()?.dateOrderMade).to.equal(`${year}-${month}-${day}`);
      expect(store.orderDetails()?.dateArrearsLastUpdated).to.equal(`${year}-${month}-${day}`);
    });
  });

  it('AC3. should have only the blank and five specified frequencies with no default', { tags: buildTags() }, () => {
    lookup();
    setupOrderDetails();
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.get<HTMLSelectElement>(S.orderDetails.paymentFrequency).should(($select) =>
      expect($select[0].value).to.equal(''),
    );
    cy.get(S.orderDetails.frequencyOptions).should((options) =>
      expect([...options].map((option) => (option as HTMLOptionElement).value)).to.deep.equal([
        '',
        'Weekly',
        'Fortnightly',
        'Monthly',
        'Quarterly',
        'Yearly',
      ]),
    );
    cy.get(S.orderDetails.returnButton).click();
    cy.get(S.errorSummary)
      .should('contain.text', 'Select a payment frequency')
      .and('contain.text', 'Enter the date arrears last updated');
  });

  for (const action of ['cancel', 'back'] as const) {
    for (const accept of [true, false]) {
      it(
        `AC4. should ${accept ? 'discard' : 'retain'} unsaved edits when ${action} is ${accept ? 'confirmed' : 'declined'}`,
        { tags: buildTags() },
        () => {
          openSaved();
          cy.get(S.orderDetails.court).clear().type('Edited court');
          cy.get<Store>('@casesCreateCasefileStore').should((store) => expect(store.unsavedChanges()).to.equal(true));
          const confirmation = cy.stub().returns(accept);
          cy.on('window:confirm', confirmation);
          cy.get(S.orderDetails[action]).click();
          cy.then(() => expect(confirmation).to.have.been.calledOnce);
          assertSaved();
          if (accept) {
            cy.get(S.caseDetails.orderDetailsLink).click();
            cy.wait('@applications');
            cy.get(S.orderDetails.court).should('have.value', M.saved.court);
          } else cy.get(S.orderDetails.court).should('have.value', 'Edited court');
        },
      );
    }
  }

  it('AC4. should warn on Back after unmatched application blur before submission', { tags: buildTags() }, () => {
    openSaved();
    cy.get(S.orderDetails.application).clear().type('Unknown application');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get<Store>('@casesCreateCasefileStore').should((store) => expect(store.unsavedChanges()).to.equal(true));
    const confirmation = cy.stub().returns(false);
    cy.on('window:confirm', confirmation);
    cy.get(S.orderDetails.back).click();
    cy.then(() => expect(confirmation).to.have.been.calledOnce);
    cy.get(S.orderDetails.application).should('be.visible');
    cy.get<Store>('@casesCreateCasefileStore').should((store) => expect(store.unsavedChanges()).to.equal(true));
    assertSaved();
  });

  it('AC5. should tab through every visible form control in reading order', { tags: buildTags() }, () => {
    openSaved();
    cy.get(S.orderDetails.application).focus();
    for (const selector of [
      S.orderDetails.court,
      S.orderDetails.dateOrderMade,
      S.orderDetails.orderCalendar,
      S.orderDetails.paymentFrequency,
      S.orderDetails.dateArrearsLastUpdated,
      S.orderDetails.arrearsCalendar,
      S.orderDetails.returnButton,
      S.orderDetails.cancel,
    ]) {
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(selector).should('be.focused');
    }
  });

  it('AC5. should pass clean Axe and reflow at 320 CSS pixels', { tags: buildTags() }, () => {
    openSaved();
    cy.viewport(320, 900);
    cy.get(S.orderDetails.application).should('be.visible');
    cy.document().should((document) => expect(document.documentElement.scrollWidth).to.be.at.most(320));
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
    cy.screenshot('po-9805-reflow-320');
  });
});

describe('Order Details routed lifecycle', () => {
  it(
    'AC4. should save all five fields canonically, preserve other sections and never create a draft',
    { tags: buildTags() },
    () => {
      cy.intercept('POST', '**/opal-maintenance-service/draft-casefiles', cy.spy().as('draftCreation'));
      cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', {
        body: {
          count: 2,
          refData: [
            ...M.response.refData,
            {
              ...M.response.refData[0],
              application_id: 902,
              application_code: 'TEST02',
              application_title: 'Second synthetic application',
            },
          ],
        },
      }).as('applications');
      setupOrderDetails(M.saved);
      cy.get<Store>('@casesCreateCasefileStore').then((store) =>
        cy
          .wrap({
            respondent: store.respondentDetails(),
            applicant: store.applicantDetails(),
            authority: store.centralAuthorityDetails(),
            interest: store.interestAndIndexation(),
            payments: store.paymentArrangement(),
          })
          .as('otherSections'),
      );
      cy.get(S.caseDetails.orderDetailsLink).click();
      cy.wait('@applications');
      cy.get(S.orderDetails.application).clear().type('TEST02').type('{downArrow}{enter}');
      cy.get(S.orderDetails.court).clear().type('New synthetic court');
      cy.get(S.orderDetails.dateOrderMade).type('02/01/2026');
      cy.get(S.orderDetails.paymentFrequency).select('Quarterly');
      cy.get(S.orderDetails.dateArrearsLastUpdated).clear().type('03/01/2026');
      const confirmation = cy.stub();
      cy.on('window:confirm', confirmation);
      cy.get(S.orderDetails.returnButton).click();
      cy.get<Store>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderDetails()).to.deep.equal({
          applicationId: 902,
          court: 'New synthetic court',
          dateOrderMade: '2026-01-02',
          paymentFrequency: 'Quarterly',
          dateArrearsLastUpdated: '2026-01-03',
        });
        expect(store.unsavedChanges()).to.equal(false);
        cy.get('@otherSections').should('deep.equal', {
          respondent: store.respondentDetails(),
          applicant: store.applicantDetails(),
          authority: store.centralAuthorityDetails(),
          interest: store.interestAndIndexation(),
          payments: store.paymentArrangement(),
        });
      });
      cy.then(() => expect(confirmation).not.to.have.been.called);
      cy.get('@draftCreation').should('not.have.been.called');
      cy.get(S.caseDetails.orderDetailsLink).click();
      cy.wait('@applications');
      cy.get(S.orderDetails.application).should('have.value', 'TEST02 - Second synthetic application');
      cy.get(S.orderDetails.court).should('have.value', 'New synthetic court');
      cy.get(S.orderDetails.dateOrderMade).should('have.value', '02/01/2026');
      cy.get(S.orderDetails.paymentFrequency).should('have.value', 'Quarterly');
      cy.get(S.orderDetails.dateArrearsLastUpdated).should('have.value', '03/01/2026');
    },
  );

  for (const accept of [true, false]) {
    it(
      `AC4. should ${accept ? 'clear the whole store' : 'retain the journey'} on ${accept ? 'confirmed' : 'declined'} external departure`,
      { tags: buildTags() },
      () => {
        openSaved();
        cy.get(S.orderDetails.court).clear().type('Changed court');
        cy.on('window:confirm', () => accept);
        cy.get<Router>('@angularRouter').then((router) => router.navigateByUrl('/external-test-destination'));
        cy.get<Store>('@casesCreateCasefileStore').should((store) => {
          if (accept) {
            expect(store.caseTypeSelection()).to.equal(null);
            expect(store.respondentDetails()).to.equal(null);
            expect(store.applicantDetails()).to.equal(null);
            expect(store.orderDetails()).to.equal(null);
            expect(store.centralAuthorityDetails()).to.equal(null);
            expect(store.interestAndIndexation()).to.equal(null);
            expect(store.paymentArrangement()).to.equal(null);
            expect(store.stateChanges()).to.equal(false);
            expect(store.unsavedChanges()).to.equal(false);
          } else {
            expect(store.orderDetails()).to.deep.equal(M.saved);
            expect(store.unsavedChanges()).to.equal(true);
          }
        });
        if (accept) cy.get(S.heading).should('have.text', 'External test destination');
        else cy.get(S.orderDetails.court).should('have.value', 'Changed court');
      },
    );
  }

  it(
    'AC4. should warn before unload with saved and dirty data and allow a pristine journey',
    { tags: buildTags() },
    () => {
      openSaved();
      cy.get<CasesCreateCasefileComponent>('@journeyComponent').then((journey) =>
        expect(journey.handleBeforeUnload()).to.equal(false),
      );
      cy.get(S.orderDetails.court).type(' edit');
      cy.get<CasesCreateCasefileComponent>('@journeyComponent').then((journey) =>
        expect(journey.handleBeforeUnload()).to.equal(false),
      );
      cy.get<Store>('@casesCreateCasefileStore').then((store) => store.resetStore());
      cy.get<CasesCreateCasefileComponent>('@journeyComponent').then((journey) =>
        expect(journey.handleBeforeUnload()).to.equal(true),
      );
    },
  );

  it('AC1. should redirect a fresh unseeded direct Order Details URL to Case Type', { tags: buildTags() }, () => {
    lookup();
    setupOrderDetails(null, { seeded: false, initialChildPath: PATHS.children.orderDetails, shell: true });
    cy.get(S.caseTypeGroup).should('be.visible');
    cy.get(S.orderDetails.application).should('not.exist');
    cy.get('@applications.all').should('have.length', 0);
    cy.get(S.primaryNavigation).should('not.exist');
  });

  for (const status of ['empty', 'error'] as const) {
    it(`AC2. should never activate a seeded direct URL after an ${status} lookup`, { tags: buildTags() }, () => {
      cy.intercept(
        'GET',
        '**/opal-maintenance-service/maintenance-applications*',
        status === 'empty'
          ? { body: { count: 0, refData: [] } }
          : { statusCode: 503, body: structuredClone(M.problem) },
      ).as('applications');
      setupOrderDetails(M.saved, { initialChildPath: PATHS.children.orderDetails, shell: true });
      cy.wait('@applications');
      cy.get(S.orderDetails.application).should('not.exist');
      cy.get(S.globalErrorBanner).should('be.visible');
      cy.get(S.primaryNavigation).should('not.exist');
      assertSaved();
    });
  }

  it(
    'AC5. should open the calendar with Space and select a date with native arrow and Space',
    { tags: buildTags() },
    () => {
      openSaved();
      cy.get(S.orderDetails.orderCalendar).focus();
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(S.orderDetails.calendar).should('be.visible');
      cy.press(Cypress.Keyboard.Keys.LEFT);
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(S.orderDetails.dateOrderMade).should('not.have.value', '');
      cy.get(S.orderDetails.returnButton).click();
      cy.get(S.caseDetails.heading).should('have.text', 'Case details');
    },
  );
});

describe('Application explicit selection', () => {
  it('AC3. should accept a clicked application option and save it', { tags: buildTags() }, () => {
    openSaved();
    cy.get(S.orderDetails.application).clear().type('TEST01');
    cy.get(S.orderDetails.applicationOptions).contains('TEST01 - Synthetic application').click();
    cy.get(S.orderDetails.returnButton).click();
    cy.get(S.caseDetails.heading).should('have.text', 'Case details');
    assertSaved();
  });
  it(
    'AC3. should not accept Enter on Return after an exact label was merely typed and blurred',
    { tags: buildTags() },
    () => {
      openSaved();
      cy.get(S.orderDetails.application).clear().type('TEST01 - Synthetic application');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.orderDetails.returnButton).focus().type('{enter}');
      cy.get(S.errorSummary).should('contain.text', 'Select an application code from the list');
      assertSaved();
    },
  );
});

describe('Order Details entry and select integrity', () => {
  it('AC1. should keep a seeded direct URL inactive until its pending lookup returns', { tags: buildTags() }, () => {
    let release: () => void;
    cy.intercept(
      'GET',
      '**/opal-maintenance-service/maintenance-applications*',
      (request) =>
        new Promise<void>((resolve) => {
          release = () => {
            request.reply({ body: structuredClone(M.response) });
            resolve();
          };
        }),
    ).as('applications');
    setupOrderDetails(M.saved, {
      initialChildPath: PATHS.children.orderDetails,
      waitForNavigation: false,
      shell: true,
    });
    cy.get('@applications.all').should('have.length', 1);
    cy.get(S.orderDetails.application).should('not.exist');
    cy.get(S.primaryNavigation).should('not.exist');
    cy.then(() => release());
    cy.wait('@applications');
    cy.get(S.orderDetails.application).should('be.visible');
  });
  it('AC3. should reject a tampered frequency instead of saving an unknown value', { tags: buildTags() }, () => {
    openSaved();
    cy.get<HTMLSelectElement>(S.orderDetails.paymentFrequency).then(($select) => {
      const option = $select[0].ownerDocument.createElement('option');
      option.value = 'Unrecognised';
      option.textContent = 'Unrecognised';
      $select[0].append(option);
    });
    cy.get(S.orderDetails.paymentFrequency).select('Unrecognised');
    cy.get(S.orderDetails.returnButton).click();
    cy.get(S.errorSummary).should('contain.text', 'Select a payment frequency');
    assertSaved();
  });
});
