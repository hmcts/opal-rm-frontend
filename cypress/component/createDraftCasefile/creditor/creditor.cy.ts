import { Router } from '@angular/router';
import { GENERIC_HTTP_ERROR_MESSAGE } from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { Subject } from 'rxjs';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import type { IOpalMaintenanceCountryReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { ERROR_SUMMARY_TITLE, UNSAVED_CHANGES_WARNING } from '../constants/create-casefile-test-copy.constant';
import { CREDITOR_VALIDATION_COPY } from './constants/creditor-copy.constant';
import { CREDITOR_MAJOR_RESPONSE, CREDITOR_MINOR_CREDITORS } from './mocks/creditor.mock';
import { setupCreditor, type CreditorStore } from './setup/creditor.setup';
import { COUNTRIES_RESPONSE, EMPTY_COUNTRIES_RESPONSE } from '../mocks/countries.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9808', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const buildMinorCreditorTags = (): string[] => [
  '@JIRA-STORY:PO-9809',
  '@JIRA-EPIC:PO-6506',
  '@JIRA-LABEL:create-draft-casefile',
];
const route = (child: string): string => '/' + PATHS.root + '/' + child;
const assertRoute = (child: string) => cy.get<Router>('@angularRouter').its('url').should('eq', route(child));
const prohibitPersistence = () => {
  const request = cy.spy().as('prohibitedMaintenanceWrite');
  cy.intercept({ method: '+(POST|PUT|PATCH|DELETE)', url: '**/opal-maintenance-service/**' }, request);
};
const invalidEntryContexts: Array<[string, Partial<ICasesCreateCasefileState>]> = [
  ['missing', { currentOrderTermId: null, orderTerms: [] }],
  ['stale', { currentOrderTermId: 999 }],
];
const openMinorCreditor = (): void => {
  cy.get(S.creditor.addNew).check();
  cy.get(S.creditor.continueButton).click();
};
const selectCountry = (name: string): void => {
  cy.get(S.minorCreditor.countryAutocomplete).click();
  cy.get(S.minorCreditor.countryOptions).contains(name).click();
};
const enterMinimalOrganisation = (): void => {
  cy.get(S.minorCreditor.organisation).check();
  cy.get(S.minorCreditor.organisationName).type('Example creditor');
  cy.get(S.minorCreditor.addressLine1).type('1 Test Street');
  selectCountry('United Kingdom');
  cy.get(S.minorCreditor.bankNone).check();
};
const assertPendingMinorCreditor = (): void => {
  cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
    expect(store.creditorDraft()).to.include({ termId: 1, branch: 'add-new', countryName: 'United Kingdom' });
    expect(store.creditorDraft()?.details?.identity).to.deep.equal({
      type: 'organisation',
      organisationName: 'Example creditor',
    });
    expect(store.creditorDraft()?.details?.address).to.include({ addressLine1: '1 Test Street', countryId: 826 });
    expect(store.minorCreditors()).to.deep.equal([]);
    expect(store.orderTerms()[0].creditor).to.eq(null);
    expect(store.nextMinorCreditorSequence()).to.eq(1);
    expect(store.unsavedChanges()).to.eq(false);
  });
};

describe('Order term creditor', () => {
  it(
    'AC1, AC2. should enter the real routed page and request active non-Central-Authority Majors',
    { tags: buildTags() },
    () => {
      setupCreditor({ shell: true });

      cy.get(S.heading).should('have.text', 'Creditor');
      cy.get(S.creditor.applicant).should('exist').and('be.enabled').and('have.value', 'applicant');
      cy.get(S.creditor.major).should('exist').and('be.enabled').and('have.value', 'major');
      cy.get(S.creditor.addNew).should('exist').and('be.enabled').and('have.value', 'add-new');
      cy.get(S.creditor.minor(1)).should('not.exist');
      cy.get(S.creditor.continueButton).should('not.be.disabled');
      cy.get(S.primaryNavigation).should('not.exist');
      cy.get('@majorCreditorsRequest').should('have.been.calledOnceWithExactly', {
        business_unit_id: 44,
        active: true,
        central_authority: false,
      });
    },
  );

  it('AC1. should list five stable Minor IDs and preserve duplicate display names', { tags: buildTags() }, () => {
    setupCreditor({ seedFiveMinorCreditors: true });

    for (const sequenceNumber of [1, 2, 3, 4, 5]) {
      cy.get(S.creditor.minor(sequenceNumber)).should('have.value', `minor:${sequenceNumber}`);
    }
    cy.get('label').filter(':contains("Duplicate Synthetic Name (Minor creditor)")').should('have.length', 2);
  });

  it('AC3. should focus the exact creditor error and preserve the current term', { tags: buildTags() }, () => {
    setupCreditor();
    cy.get(S.creditor.continueButton).should('not.be.disabled').click();
    cy.get(S.errorSummary).should('be.focused').and('contain.text', ERROR_SUMMARY_TITLE);
    cy.get(S.creditor.choiceError).should('contain.text', CREDITOR_VALIDATION_COPY.choice);
    cy.get(S.errorSummaryLinks).contains(CREDITOR_VALIDATION_COPY.choice).click();
    cy.get(S.creditor.applicant).should('be.focused');
    cy.get(S.creditor.choiceFieldset).find('legend').should('contain.text', 'Select creditor');
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()).to.have.length(1);
      expect(store.orderTerms()[0].creditor).to.eq(null);
    });
  });

  for (const selection of [
    { label: 'Applicant', selector: S.creditor.applicant, expected: { type: 'applicant' } },
    {
      label: 'Major',
      selector: S.creditor.major,
      expected: {
        type: 'major',
        majorCreditorId: CREDITOR_MAJOR_RESPONSE.refData[1].major_creditor_id,
        displayName: CREDITOR_MAJOR_RESPONSE.refData[1].name,
      },
    },
  ]) {
    it(`AC1, AC4. should accept ${selection.label} locally without persistence`, { tags: buildTags() }, () => {
      prohibitPersistence();
      setupCreditor();
      cy.get(selection.selector).check();
      if (selection.label === 'Major') {
        cy.get(S.creditor.majorId).select(String(CREDITOR_MAJOR_RESPONSE.refData[1].major_creditor_id));
      }
      cy.get(S.creditor.continueButton).click();
      assertRoute(PATHS.children.orderTermsSummary);
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()[0].creditor).to.deep.equal(selection.expected);
        expect(store.taskStatuses().orderTerms).to.eq(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
      });
      cy.get('@prohibitedMaintenanceWrite').should('not.have.been.called');
    });
  }

  it(
    'AC1, AC4. should save one duplicate-named Minor by sequence without changing another term',
    { tags: buildTags() },
    () => {
      prohibitPersistence();
      setupCreditor({ seedFiveMinorCreditors: true });
      cy.get(S.creditor.minor(4)).check();
      cy.get(S.creditor.continueButton).click();
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTerms()[5].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 4 });
        expect(store.orderTerms()[1].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 2 });
      });
      cy.get('@prohibitedMaintenanceWrite').should('not.have.been.called');
    },
  );

  it(
    'AC4. should keep edits local, clear stale Major data after switching, and save Applicant',
    { tags: buildTags() },
    () => {
      setupCreditor();
      cy.get(S.creditor.major).check();
      cy.get(S.creditor.majorId).select(String(CREDITOR_MAJOR_RESPONSE.refData[0].major_creditor_id));
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTerms()[0].creditor).to.eq(null),
      );
      cy.get(S.creditor.applicant).check();
      cy.get(S.creditor.majorId).should('not.be.visible').and('have.value', null);
      cy.get(S.creditor.continueButton).click();
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'applicant' }),
      );
    },
  );

  it('AC2. should wait for the unconditional Major request before activating the page', { tags: buildTags() }, () => {
    const source = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    setupCreditor({ awaitNavigation: false, majorSource: source });
    cy.get('@majorCreditorsRequest').should('have.been.calledOnceWithExactly', {
      business_unit_id: 44,
      active: true,
      central_authority: false,
    });
    cy.get(S.creditor.continueButton).should('not.exist');
    cy.then(() => {
      source.next(structuredClone(CREDITOR_MAJOR_RESPONSE));
      source.complete();
    });
    cy.get<{ navigation: Promise<{ value: boolean; error: unknown }> }>('@creditorNavigation')
      .then(({ navigation }) => cy.wrap(navigation))
      .its('value')
      .should('eq', true);
    cy.get(S.heading).should('have.text', 'Creditor');
  });

  it('AC2, AC3. should activate with empty Majors and keep non-Major choices usable', { tags: buildTags() }, () => {
    const source = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    setupCreditor({
      awaitNavigation: false,
      majorSource: source,
    });
    cy.get('@majorCreditorsRequest').should('have.been.calledOnce');
    cy.then(() => {
      source.next({ count: 0, refData: [] });
      source.complete();
    });
    cy.get<{ navigation: Promise<{ value: boolean; error: unknown }> }>('@creditorNavigation')
      .then(({ navigation }) => cy.wrap(navigation))
      .its('value')
      .should('eq', true);
    cy.get(S.creditor.major).check();
    cy.get(S.creditor.majorId).should('be.visible').find('option[value="901"]').should('not.exist');
    cy.get(S.creditor.continueButton).click();
    cy.get(S.errorSummaryLinks).contains(CREDITOR_VALIDATION_COPY.major);
    cy.get(S.creditor.applicant).check();
    cy.get(S.creditor.continueButton).click();
    assertRoute(PATHS.children.orderTermsSummary);
  });

  it('AC2. should prevent activation when the Major request fails', { tags: buildTags() }, () => {
    const source = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    setupCreditor({ awaitNavigation: false, majorSource: source });
    cy.then(() => source.error(new Error('Synthetic Major request failure')));
    cy.get<{ navigation: Promise<{ value: boolean; error: unknown }> }>('@creditorNavigation')
      .then(({ navigation }) => cy.wrap(navigation))
      .its('error')
      .should('be.instanceOf', Error);
    cy.get(S.creditor.continueButton).should('not.exist');
  });

  for (const confirmed of [false, true]) {
    it(
      `AC4. should ${confirmed ? 'discard' : 'retain'} changed creditor edits on Cancel`,
      { tags: buildTags() },
      () => {
        setupCreditor();
        cy.get(S.creditor.applicant).check();
        cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
        cy.on('window:confirm', (message) => {
          expect(message).to.eq(UNSAVED_CHANGES_WARNING);
          return confirmed;
        });
        cy.get(S.creditor.cancel).click();
        assertRoute(confirmed ? PATHS.children.orderTermsSummary : PATHS.children.orderTermCreditor);
        cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
          expect(store.orderTerms()[0].creditor).to.eq(null);
          expect(store.unsavedChanges()).to.eq(!confirmed);
        });
      },
    );
  }

  it(
    'AC4. should open details without allocating a Minor and discard pending state on clean Cancel',
    { tags: buildTags() },
    () => {
      setupCreditor();
      openMinorCreditor();
      assertRoute(PATHS.children.minorCreditorDetails);
      cy.get(S.heading).should('have.text', 'Minor creditor details');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.minorCreditors()).to.deep.equal([]);
        expect(store.nextMinorCreditorSequence()).to.eq(1);
        expect(store.taskStatuses().orderTerms).to.eq(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
      });
      cy.get(S.minorCreditor.cancel).click();
      assertRoute(PATHS.children.orderTermCreditor);
      cy.get(S.creditor.addNew).should('not.be.checked');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.creditorDraft()).to.eq(null);
        expect(store.orderTerms()[0].creditor).to.eq(null);
      });
    },
  );

  it(
    'AC4. should show a safe navigation failure and retry the accepted assignment unchanged',
    { tags: buildTags() },
    () => {
      setupCreditor();
      cy.get<Router>('@angularRouter').then((router) => {
        const navigateByUrl = router.navigateByUrl.bind(router);
        const navigation = cy.stub(router, 'navigateByUrl');
        navigation.onFirstCall().resolves(false);
        navigation.onSecondCall().callsFake(navigateByUrl);
      });
      cy.get(S.creditor.applicant).check();
      cy.get(S.creditor.continueButton).click();
      cy.get(S.errorSummary).should('contain.text', GENERIC_HTTP_ERROR_MESSAGE);
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) =>
        expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'applicant' }),
      );
      cy.get(S.creditor.continueButton).click();
      assertRoute(PATHS.children.orderTermsSummary);
    },
  );

  it(
    'AC1, AC3. should wait for Countries, then enter Details with UK first and the rest alphabetical',
    { tags: buildMinorCreditorTags() },
    () => {
      const countries = new Subject<IOpalMaintenanceCountryReferenceDataResponse>();
      const germany = {
        ...COUNTRIES_RESPONSE.refData[1],
        country_id: 276,
        international_code: 'DE',
        country_name: 'Germany',
      };
      setupCreditor({ countriesSource: countries });
      openMinorCreditor();

      cy.get('@countriesRequest').should('have.been.calledOnceWithExactly', true);
      cy.get(S.minorCreditor.save).should('not.exist');
      assertRoute(PATHS.children.orderTermCreditor);
      cy.then(() => {
        countries.next({ count: 3, refData: [COUNTRIES_RESPONSE.refData[1], germany, COUNTRIES_RESPONSE.refData[0]] });
        countries.complete();
      });

      assertRoute(PATHS.children.minorCreditorDetails);
      cy.get(S.minorCreditor.countryAutocomplete).click();
      cy.get(S.minorCreditor.countryOptions).then(($options) => {
        expect([...$options].map((option) => option.textContent?.trim())).to.deep.equal([
          'United Kingdom',
          'France',
          'Germany',
        ]);
      });
    },
  );

  it(
    'AC3. should retain Creditor and show the safe error when Countries is empty',
    { tags: buildMinorCreditorTags() },
    () => {
      const countries = new Subject<IOpalMaintenanceCountryReferenceDataResponse>();
      setupCreditor({ countriesSource: countries });
      openMinorCreditor();
      cy.then(() => {
        countries.next(EMPTY_COUNTRIES_RESPONSE);
        countries.complete();
      });

      assertRoute(PATHS.children.orderTermCreditor);
      cy.get(S.minorCreditor.save).should('not.exist');
      cy.get(S.errorSummary).should('contain.text', GENERIC_HTTP_ERROR_MESSAGE);
    },
  );

  it(
    'AC3. should retain Creditor and show the safe error when Countries fails',
    { tags: buildMinorCreditorTags() },
    () => {
      const countries = new Subject<IOpalMaintenanceCountryReferenceDataResponse>();
      setupCreditor({ countriesSource: countries });
      openMinorCreditor();
      cy.then(() => countries.error(new Error('Synthetic Countries failure')));

      assertRoute(PATHS.children.orderTermCreditor);
      cy.get(S.minorCreditor.save).should('not.exist');
      cy.get(S.errorSummary).should('contain.text', GENERIC_HTTP_ERROR_MESSAGE);
    },
  );

  it(
    'AC1. should redirect stale direct Details entry before requesting Countries',
    { tags: buildMinorCreditorTags() },
    () => {
      const countries = new Subject<IOpalMaintenanceCountryReferenceDataResponse>();
      setupCreditor({
        initialChild: PATHS.children.minorCreditorDetails,
        countriesSource: countries,
        state: { currentOrderTermId: null, orderTerms: [], creditorDraft: null },
      });

      assertRoute(PATHS.children.orderTermsSelect);
      cy.get('@countriesRequest').should('not.have.been.called');
      cy.get(S.minorCreditor.save).should('not.exist');
    },
  );

  it('AC4. should keep dirty Details data after declining Cancel', { tags: buildMinorCreditorTags() }, () => {
    setupCreditor();
    openMinorCreditor();
    enterMinimalOrganisation();
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
    cy.once('window:confirm', (message) => {
      expect(message).to.eq(UNSAVED_CHANGES_WARNING);
      return false;
    });

    cy.get(S.minorCreditor.cancel).click();

    assertRoute(PATHS.children.minorCreditorDetails);
    cy.get(S.minorCreditor.organisationName).should('have.value', 'Example creditor');
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.creditorDraft()).to.deep.equal({ termId: 1, branch: 'add-new' });
      expect(store.minorCreditors()).to.deep.equal([]);
      expect(store.unsavedChanges()).to.eq(true);
    });
  });

  it(
    'AC4. should discard dirty pending data after accepting Cancel and preserve saved creditors',
    { tags: buildMinorCreditorTags() },
    () => {
      setupCreditor({
        state: {
          orderTerms: [
            {
              termId: 1,
              resultId: 'MAT',
              parameters: { amount: '12.30' },
              creditor: null,
              presentation: {
                title: 'Maintenance',
                fields: [{ name: 'amount', label: 'Amount', kind: 'money', options: [] }],
              },
            },
            {
              termId: 2,
              resultId: 'MAT',
              parameters: { amount: '2.00' },
              creditor: { type: 'minor', sequenceNumber: 1 },
              presentation: {
                title: 'Maintenance',
                fields: [{ name: 'amount', label: 'Amount', kind: 'money', options: [] }],
              },
            },
          ],
          currentOrderTermId: 1,
          minorCreditors: [CREDITOR_MINOR_CREDITORS[0]],
          nextMinorCreditorSequence: 2,
        },
      });
      openMinorCreditor();
      enterMinimalOrganisation();
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => expect(store.unsavedChanges()).to.eq(true));
      cy.once('window:confirm', (message) => {
        expect(message).to.eq(UNSAVED_CHANGES_WARNING);
        return true;
      });

      cy.get(S.minorCreditor.cancel).click();

      assertRoute(PATHS.children.orderTermCreditor);
      cy.get(S.creditor.addNew).should('not.be.checked');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.creditorDraft()).to.eq(null);
        expect(store.orderTerms()[0].creditor).to.eq(null);
        expect(store.minorCreditors()).to.deep.equal([CREDITOR_MINOR_CREDITORS[0]]);
        expect(store.unsavedChanges()).to.eq(false);
      });
    },
  );

  it(
    'AC4. should stage details through the real router without a dirty warning and render Summary',
    { tags: buildMinorCreditorTags() },
    () => {
      setupCreditor();
      const confirmation = cy.spy().as('unexpectedSaveConfirmation');
      cy.on('window:confirm', confirmation);
      openMinorCreditor();
      enterMinimalOrganisation();

      cy.get(S.minorCreditor.save).click();

      assertRoute(PATHS.children.minorCreditorSummary);
      cy.get(S.heading).should('have.text', 'Minor creditor summary');
      cy.get('@unexpectedSaveConfirmation').should('not.have.been.called');
      assertPendingMinorCreditor();
    },
  );

  for (const failure of ['false return', 'rejection'] as const) {
    it(
      `AC4. should retain pending data after Summary navigation ${failure} and retry without acceptance`,
      { tags: buildMinorCreditorTags() },
      () => {
        setupCreditor();
        openMinorCreditor();
        enterMinimalOrganisation();
        cy.get<Router>('@angularRouter').then((router) => {
          const navigateByUrl = router.navigateByUrl.bind(router);
          const navigation = cy.stub(router, 'navigateByUrl');
          if (failure === 'false return') navigation.onFirstCall().resolves(false);
          else navigation.onFirstCall().rejects(new Error('Synthetic Summary navigation failure'));
          navigation.onSecondCall().callsFake(navigateByUrl);
        });

        cy.get(S.minorCreditor.save).click();
        cy.get(S.minorCreditor.save).should('be.visible');
        assertPendingMinorCreditor();
        cy.get(S.minorCreditor.save).click();

        assertRoute(PATHS.children.minorCreditorSummary);
        cy.get(S.heading).should('have.text', 'Minor creditor summary');
        assertPendingMinorCreditor();
      },
    );
  }

  for (const [context, state] of invalidEntryContexts) {
    it(
      `AC4. should reject direct entry with ${context} term context before requesting Majors`,
      { tags: buildTags() },
      () => {
        setupCreditor({ state });
        assertRoute(PATHS.children.orderTermsSelect);
        cy.get('@majorCreditorsRequest').should('not.have.been.called');
      },
    );
  }
});
