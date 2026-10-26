import {
  setCasefileReason,
  activateCasefileControl,
  chooseCasefileDecision,
} from '../createDraftCasefile/casefile-review-controls.actions';
import { locateDraftCasefileRow } from './draft-casefile-table.actions';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { CasesDraftSelectors as D } from '../../../../../shared/selectors/cases-draft.selectors';
import { PrimaryNavigationLocators as P } from '../../../../../shared/selectors/primary-navigation.locators';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS as CHECKER } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as CREATE } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CheckAndValidateCaseSelectors as S } from '../../../../../shared/selectors/check-and-validate-case.selectors';
import { CreateCasefileSelectors as C } from '../../../../../shared/selectors/create-casefile.selectors';
import type { DraftCasefileJourney } from './types/draft-casefile-journey.type';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';

/**
 * Assert the retained checker choice against the actual radio control.
 * @param input Rendered checker radio.
 * @param journey Chosen checker decision.
 */
export function assertRetainedCheckerDecision(input: HTMLInputElement, journey: 'approve' | 'reject'): void {
  expect(input.checked, `${journey} decision remains selected`).to.equal(true);
}

/**
 * Compare every rendered review section with the saved aggregate's pre-edit rendering.
 * @param actual Current rendered section texts.
 * @param expected Captured saved section texts.
 */
export function assertRecoveredReviewSections(actual: string[], expected: string[]): void {
  expect(expected.length, 'captured saved review sections').to.be.greaterThan(0);
  expect(actual, 'all recovered review sections match the saved aggregate rendering').to.deep.equal(expected);
}

/**
 * Map the persisted status to the maintained review label for its actor context.
 * @param status Persisted casefile status.
 * @param inputter Whether recovery is rendered in the inputter context.
 * @returns Review status label.
 */
export function savedStatusLabel(status: string, inputter = false): string {
  const labels: Record<string, string> = {
    SUBMITTED: 'To review',
    RESUBMITTED: 'To review',
    PUBLISHING_PENDING: 'Approved',
    PUBLISHED: 'Approved',
    REJECTED: 'Rejected',
    DELETED: 'Deleted',
    PUBLISHING_FAILED: 'Failed',
  };
  const label = inputter && (status === 'SUBMITTED' || status === 'RESUBMITTED') ? 'In review' : labels[status];
  if (!label) throw new Error(`Unknown saved casefile status: ${status}`);
  return label;
}

/**
 * Require the owned retry's destination and exact success message.
 * @param pathname Browser destination after retry.
 * @param notice Rendered success notice text.
 * @param journey Retried decision or amendment.
 * @param respondent Saved owned respondent name.
 */
export function assertRetryDestination(
  pathname: string,
  notice: string,
  journey: DraftCasefileJourney,
  respondent: string,
): void {
  if (journey === 'resubmit') {
    expect(pathname, 'resubmission destination').to.be.oneOf([
      '/cases/draft/create-and-manage/tabs',
      '/cases/draft/create-and-manage/rejections',
    ]);
    expect(notice.trim(), 'owned resubmission notice').to.equal(`You have submitted ${respondent}'s case for review.`);
  } else {
    expect(pathname, 'checker decision destination').to.equal('/cases/draft/check-and-validate/tabs');
    const outcome = { approve: 'approved', reject: 'rejected', delete: 'deleted' }[journey];
    expect(notice.trim(), 'owned checker decision notice').to.equal(`You have ${outcome} ${respondent}’s case.`);
  }
}

/** Interacts only with rendered foundation journeys; no stores or lifecycle state are injected. */
export class DraftCasefileRecoveryActions {
  private visibleReview: string[] = [];
  private savedReview: string[] = [];
  private originalReview: string[] = [];
  private reason = '';

  /**
   * Exclude edit actions, which change between editable and read-only review routes.
   * @param sections Rendered review section roots.
   * @returns Semantic section contents in DOM order.
   */
  private reviewData(sections: JQuery<HTMLElement>): string[] {
    return Array.from(sections, (node) => {
      const copy = node.cloneNode(true) as HTMLElement;
      copy
        .querySelectorAll('.govuk-summary-card__action, .govuk-summary-list__actions')
        .forEach((action) => action.remove());
      return copy.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    });
  }

  /**
   * Loads the persisted review or rejected amendment through the real router.
   * @param id Positive identifier of the independently owned draft.
   * @param journey Business action whose rendered controls or outcome are being exercised.
   */
  public open(id: number, journey: DraftCasefileJourney): void {
    this.visibleReview = [];
    this.savedReview = [];
    this.originalReview = [];
    if (journey === 'resubmit') {
      cy.visit(`/${CREATE.root}/${CREATE.children.taskList}/${id}`);
      cy.get(C.caseDetails.checkCaseButton).should('be.enabled').click();
    } else {
      cy.visit(`/${CHECKER.root}/${CHECKER.children.review}/${id}`);
    }
    cy.get(C.review.heading).should('be.visible');
    if (journey === 'resubmit') {
      cy.location('pathname').should('equal', `/${CREATE.root}/${CREATE.children.checkCaseDetails}`);
      cy.get(C.review.heading).should('have.text', 'Check case details');
      cy.get(C.review.submit).should('contain.text', 'Submit for review');
    } else {
      cy.location('pathname').should('equal', `/${CHECKER.root}/${CHECKER.children.review}/${id}`);
      cy.get(C.review.decisionContinue).should('have.text', 'Continue');
    }
  }

  /**
   * Selects the decision and supplies only its conditional synthetic reason.
   * @param journey Business action whose rendered controls or outcome are being exercised.
   * @param keyboard Whether checker selection uses native Space and conditional Tab.
   */
  public choose(journey: DraftCasefileJourney, keyboard = false): void {
    this.reason = 'Synthetic concurrency decision';
    if (journey === 'delete') {
      cy.get(C.review.delete).should('have.text', 'Delete case').click();
      cy.get(C.deletion.heading).should('contain.text', 'Are you sure you want to delete this case?');
      setCasefileReason(C.deletion.reason, this.reason);
    } else if (journey === 'approve' || journey === 'reject') {
      chooseCasefileDecision(journey, this.reason, keyboard);
    }
  }

  /**
   * Makes an explicit reason correction before a user-requested retry.
   */
  public reviseReason(): void {
    this.reason = 'Synthetic corrected concurrency decision';
    setCasefileReason(C.review.rejectionReason, this.reason);
  }

  /**
   * Returns the reason last entered through the rendered form.
   * @returns Current synthetic decision reason.
   */
  public expectedReason(): string {
    return this.reason;
  }

  /**
   * Saves a respondent correction through its contextual review action.
   * @param value Explicit synthetic correction or validated journey value.
   * @param keyboard Use native activation and Tab from the corrected field.
   * @param onEditor Optional strict scan while the corrected editor remains rendered.
   */
  public correctRespondent(value: string, keyboard = false, onEditor?: () => void): void {
    this.activate(C.review.change('respondent'), keyboard);
    if (keyboard) cy.get(C.respondentDetails.firstNames).focus().should('be.focused');
    cy.get(C.respondentDetails.firstNames).should('be.enabled').clear().type(value);
    if (onEditor) cy.then(() => onEditor());
    if (keyboard) {
      cy.get(C.respondentDetails.firstNames).should('be.focused');
      // The actual editor includes other fields before Return; traverse them without pointer/focus shortcuts.
      const tabToReturn = (remaining: number): void => {
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.focused().then((focused) => {
          expect(focused[0].matches('a[href], button, input, select, textarea'), 'semantic editor focus').to.equal(
            true,
          );
          cy.wrap(focused).should('not.be.disabled');
          if (focused.is('input[type="checkbox"], input[type="radio"]'))
            cy.get(`label[for="${focused[0].id}"]`).should('be.visible');
          if (focused.is(C.respondentDetails.returnToCaseDetails)) return;
          expect(remaining, 'Return is reachable in native tab order').to.be.greaterThan(0);
          tabToReturn(remaining - 1);
        });
      };
      cy.document().then((document) =>
        tabToReturn(document.querySelectorAll('a[href], button, input, select, textarea').length),
      );
      cy.get(C.respondentDetails.returnToCaseDetails).should('be.enabled').and('be.focused');
      pressDashboardEnter();
    } else this.activate(C.respondentDetails.returnToCaseDetails, false);
    cy.get(C.review.heading).should('be.visible');
    cy.get(C.review.section('respondent')).should('contain.text', value);
  }

  /**
   * Retains the complete visible review before sending a mutation.
   * @param journey Business action whose rendered controls or outcome are being exercised.
   */
  public capture(journey: DraftCasefileJourney): void {
    const selector = journey === 'delete' ? C.deletion.identity : S.reviewSections;
    cy.get(selector)
      .should('be.visible')
      .then(($sections) => {
        this.visibleReview = Array.from($sections, (node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '');
        if (journey !== 'delete') this.savedReview = this.reviewData($sections);
        expect(this.visibleReview.length, 'nonempty review captured before mutation').to.be.greaterThan(0);
        expect(this.visibleReview.every(Boolean), 'all captured sections have content').to.equal(true);
      });
  }

  /** Captures the authoritative pre-edit rendering for a rejected amendment that may lose a conflict. */
  public captureOriginalReview(): void {
    cy.get(S.reviewSections)
      .should('be.visible')
      .then(($sections) => {
        this.originalReview = this.reviewData($sections);
        expect(this.originalReview.length, 'original review sections').to.be.greaterThan(0);
        expect(this.originalReview.every(Boolean), 'original sections have content').to.equal(true);
      });
  }

  /**
   * Compares all captured review sections and any entered decision reason.
   * @param journey Business action whose rendered controls or outcome are being exercised.
   */
  public assertRetained(journey: DraftCasefileJourney): void {
    const selector = journey === 'delete' ? C.deletion.identity : S.reviewSections;
    cy.get(selector)
      .should('be.visible')
      .should(($sections) => {
        const current = Array.from($sections, (node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '');
        expect(Cypress._.isEqual(current, this.visibleReview), 'the complete visible review is retained').to.equal(
          true,
        );
      });
    if (journey === 'delete' || journey === 'reject') {
      cy.get(journey === 'delete' ? C.deletion.reason : C.review.rejectionReason).should('have.value', this.reason);
    }
    if (journey === 'approve' || journey === 'reject') {
      cy.get(journey === 'approve' ? C.review.decisionApprove : C.review.decisionReject).should(($input) =>
        assertRetainedCheckerDecision($input[0] as HTMLInputElement, journey),
      );
    }
  }

  /**
   * Requires an actionable error with retained context and no success confirmation.
   * @param journey Business action whose rendered controls or outcome are being exercised.
   */
  public assertFailure(journey: DraftCasefileJourney): void {
    cy.get(C.globalErrorBanner).should('be.visible').invoke('text').should('not.be.empty');
    cy.get(C.review.confirmationHeading).should('not.exist');
    this.assertRetained(journey);
  }

  /**
   * Submits the chosen change through the UI and observes its HTTP boundary.
   * @param journey Business action whose rendered controls or outcome are being exercised.
   * @param keyboard Whether to use native keyboard activation instead of a pointer click.
   */
  public submit(journey: DraftCasefileJourney, keyboard = false): void {
    let selector: string = C.review.decisionContinue;
    if (journey === 'resubmit') selector = C.review.submit;
    if (journey === 'delete') selector = C.deletion.submit;
    if (keyboard && journey === 'reject') {
      cy.get(C.review.rejectionReason).focus().should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(selector).should('be.enabled').and('be.focused');
      pressDashboardEnter();
    } else activateCasefileControl(selector, keyboard);
  }

  /**
   * Checks that an uncertain or stale outcome cannot dispatch again before reloading.
   * @param journey Business action whose reload protection is being exercised.
   */
  public assertReloadRequired(journey: DraftCasefileJourney): void {
    if (journey === 'delete') {
      cy.get(C.deletion.recovery).should('be.visible');
      cy.get(C.deletion.submit).should('be.disabled');
      return;
    }
    if (journey === 'approve' || journey === 'reject') {
      cy.get(journey === 'approve' ? C.review.decisionApprove : C.review.decisionReject).should(($input) =>
        assertRetainedCheckerDecision($input[0] as HTMLInputElement, journey),
      );
    }
    this.submit(journey);
    if (journey === 'resubmit') {
      cy.get(C.globalErrorBanner).should('contain.text', 'Select Back to reload the saved case');
    }
    this.assertRetained(journey);
  }

  /** Requires the actual shared safe-conflict outcome without claiming that an editor remains rendered. */
  public assertSafeConflict(): void {
    cy.location('pathname').should('equal', '/error/concurrency-failure');
    cy.get(S.conflictPage)
      .should('be.visible')
      .and('contain.text', 'Something else was changed while you were doing this.')
      .and('contain.text', 'Your changes have not been saved. You will need to start again.');
    cy.get(C.review.decisionContinue).should('not.exist');
    cy.get(C.review.submit).should('not.exist');
  }

  /**
   * Re-enters the owned saved case through actual Cases, dashboard, tab and row controls.
   * @param id Identifier of the independently owned saved case.
   * @param journey Actor journey determining the dashboard and saved-status tab.
   * @param keyboard Whether recovery uses native keyboard activation.
   */
  public recoverConflict(id: number, journey: DraftCasefileJourney, keyboard: boolean): void {
    cy.intercept('GET', `/opal-maintenance-service/draft-casefiles/${id}`).as('recoveredDraft');
    const targetStatus = journey === 'resubmit' ? 'SUBMITTED,RESUBMITTED' : 'REJECTED';
    cy.intercept('GET', /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/, (request) => {
      if (!request.query['restrict'] && request.query['casefile_status'] === targetStatus)
        request.alias = 'recoveryCollection';
    });
    const cases = cy.contains(P.items, P.labels.cases).should('be.visible');
    if (keyboard) {
      cases.focus().should('be.focused');
      cy.press(Cypress.Keyboard.Keys.ENTER);
    } else cases.click();
    cy.location('pathname').should('equal', '/dashboard/cases');
    this.activate(journey === 'resubmit' ? D.inputterEntry : D.checkerEntry, keyboard);
    cy.get(D.heading).should('have.text', journey === 'resubmit' ? 'Create cases' : 'Review cases');
    this.activate(D.tab(journey === 'resubmit' ? 'in-review' : 'rejected'), keyboard);
    cy.wait('@recoveryCollection').its('response.statusCode').should('equal', 200);
    cy.get(`${D.table}, ${D.empty}`).should('be.visible');
    locateDraftCasefileRow(id, keyboard).within(() => {
      const link = cy.get(D.column('respondent')).find('a').should('be.visible');
      if (keyboard) {
        link.focus().should('be.focused');
        pressDashboardEnter();
      } else link.click();
    });
    cy.wait('@recoveredDraft').its('response.statusCode').should('equal', 200);
    cy.get(C.review.heading).should('be.visible');
    cy.get(C.review.decisionContinue).should('not.exist');
    cy.get(C.review.submit).should('not.exist');
  }

  /**
   * Requires the recovered page to present the saved case and history, rather than an empty or denied route.
   * @param snapshot Independently read authoritative state after recovery.
   * @param original Whether the competing winner retained the original pre-edit aggregate.
   * @param inputter Whether the recovered review is rendered for the inputter.
   */
  public assertSavedPresentation(snapshot: IDraftCasefileSnapshot, original = false, inputter = false): void {
    const draft = snapshot.draft;
    const individual = draft.casefile.respondent_account.respondent.party_details.individual_details;
    if (!individual?.forenames) throw new Error('Synthetic recovery presentation requires an individual');
    cy.get(C.review.heading).should('be.visible');
    cy.get(C.review.section('respondent'))
      .should('contain.text', individual.forenames)
      .and('contain.text', individual.surname);
    cy.get(C.review.status).should('have.text', savedStatusLabel(draft.casefile_status, inputter));
    const expected = original ? this.originalReview : this.savedReview;
    cy.get(S.reviewSections)
      .should('be.visible')
      .should(($sections) => {
        const actual = this.reviewData($sections);
        assertRecoveredReviewSections(actual, expected);
      });
    cy.get(S.history).within(() => {
      cy.get(S.timelineItem).should('have.length', draft.timeline_data.length);
      for (const event of draft.timeline_data) {
        cy.root().should('contain.text', event.status).and('contain.text', event.username);
        if (event.reason_text) cy.root().should('contain.text', event.reason_text);
      }
    });
    cy.get(C.globalErrorBanner).should('not.exist');
  }

  /**
   * Requires the concrete owned success notice and destination after an acknowledged retry.
   * @param journey The retried mutation.
   * @param snapshot Its independent saved outcome.
   */
  public assertRetrySuccess(journey: DraftCasefileJourney, snapshot: IDraftCasefileSnapshot): void {
    const draft = snapshot.draft;
    const respondent: unknown = Cypress._.get(draft.casefile_snapshot, 'respondent_account.respondent_name');
    if (typeof respondent !== 'string' || !respondent.trim()) throw new Error('Owned respondent name is missing');
    if (journey === 'resubmit') {
      cy.get(`${D.heading}, ${D.allRejectedHeading}`).should('be.visible');
      cy.get(`${D.success}, ${D.allRejectedSuccess}`).should('be.visible');
      cy.get(`${D.successText}, ${D.allRejectedSuccessText}`)
        .should('be.visible')
        .then(($notice) =>
          cy
            .location('pathname')
            .then((pathname) => assertRetryDestination(pathname, $notice.text(), journey, respondent)),
        );
    } else {
      cy.get(D.heading).should('have.text', 'Review cases');
      cy.get(D.success).should('be.visible');
      cy.get(D.successText)
        .should('be.visible')
        .then(($notice) =>
          cy
            .location('pathname')
            .then((pathname) => assertRetryDestination(pathname, $notice.text(), journey, respondent)),
        );
    }
    cy.get(C.globalErrorBanner).should('not.exist');
    cy.get(C.review.decisionContinue).should('not.exist');
    cy.get(C.review.submit).should('not.exist');
  }

  /**
   * Uses the application discard guard; global E2E unload suppression is not evidence of a native warning.
   * @param discard Whether the user explicitly accepts losing local corrections.
   * @param keyboard Whether to use native keyboard activation instead of a pointer click.
   */
  private amendmentBack(discard: boolean, keyboard: boolean): void {
    let confirmed = false;
    cy.then(() => {
      cy.once('window:confirm', (message) => {
        confirmed = true;
        expect(message, 'explicit correction discard warning').to.be.a('string').and.not.be.empty;
        return discard;
      });
    });
    this.activate(S.back, keyboard);
    cy.then(() => expect(confirmed, 'correction discard confirmation was presented').to.equal(true));
  }

  /**
   * Activates a visible recovery link using the selected input method.
   * @param selector Centralized selector identifying the recovery control.
   * @param keyboard Whether to use native keyboard activation instead of a pointer click.
   */
  private activate(selector: string, keyboard: boolean): void {
    if (keyboard) {
      cy.get(selector).should('be.visible').focus().should('be.focused');
      pressDashboardEnter();
    } else {
      cy.get(selector).should('be.visible').click();
    }
  }

  /**
   * Completes the supported reload/return journey without submitting another mutation.
   * @param id Positive identifier of the independently owned draft.
   * @param journey Business action whose rendered controls or outcome are being exercised.
   * @param keyboard Whether to use native keyboard activation instead of a pointer click.
   */
  public recover(id: number, journey: DraftCasefileJourney, keyboard = false): void {
    cy.intercept('GET', `/opal-maintenance-service/draft-casefiles/${id}`).as('recoveredDraft');
    if (journey === 'resubmit') {
      this.amendmentBack(false, keyboard);
      this.assertRetained(journey);
      this.amendmentBack(true, keyboard);
    } else if (journey === 'delete') {
      cy.get(C.deletion.recovery).should('be.visible');
      cy.get(C.deletion.submit).should('be.disabled');
      const cancel = cy.contains(C.deletion.cancel, 'No - cancel').should('be.visible');
      if (keyboard) {
        cy.get(C.deletion.reason).focus().should('be.focused');
        cy.press(Cypress.Keyboard.Keys.TAB);
        cancel.should('be.focused');
        cy.press(Cypress.Keyboard.Keys.ENTER);
      } else cancel.click();
    } else {
      this.activate(S.back, keyboard);
      // Back returns to the queue; reopen the owned persisted resource rather than submitting again.
      cy.location('pathname').should('not.contain', `/review/${id}`);
      cy.visit(`/${CHECKER.root}/${CHECKER.children.view}/${id}`);
    }
    cy.wait('@recoveredDraft').then(({ response }) =>
      expect(response?.statusCode, 'recovery reloaded persisted state').to.equal(200),
    );
    cy.get(C.review.decisionContinue).should('not.exist');
    cy.get(C.review.submit).should('not.exist');
  }
}
