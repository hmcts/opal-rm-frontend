import { getTestActor } from '../../../../../support/test-actors';
import { decodeDraftCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-detail';
import { decodeDraftCasefileList } from 'src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-response';
import { performAuthentication } from '../../../../actions/login.actions';
import { readDraftSnapshot } from './draft-casefile-evidence.actions';
import {
  createOwnedSubmittedDraft,
  rejectOwnedDraft,
  requestDraftChange,
  requireMembership,
} from './draft-casefile-fixture.actions';
import type { IDraftCasefileFixtureOptions } from './interfaces/draft-casefile-fixture-options.interface';
import type { IOwnedDraftCasefile } from './interfaces/draft-casefile-owned.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';
import type { IInputterMonitoringState } from './interfaces/inputter-monitoring-state.interface';

type MonitoringStatus = 'SUBMITTED' | 'REJECTED' | 'DELETED' | 'PUBLISHING_PENDING' | 'PUBLISHED';

/** Real lifecycle setup only. The existing required owner/marker cleanup hook owns teardown even after setup fails. */
export class InputterMonitoringFixtureActions {
  public readonly state: IInputterMonitoringState = { ownedByKey: new Map(), ownedById: new Map() };

  /** Requires a caller-provisioned actor instead of guessing an available identity.
   * @returns The configured independent inputter identity, validated against BU membership before creation.
   */
  public secondInputter(): string {
    return getTestActor('secondInputter');
  }

  /** Fails on conflicting personal data without deleting or mutating any unrelated record. */
  public requireEmptyRejected(): void {
    requireMembership(21).then(({ id }) =>
      cy
        .request<unknown>({
          method: 'GET',
          url: '/opal-maintenance-service/draft-casefiles',
          qs: { business_unit_id: 44, submitted_by: id, casefile_status: 'REJECTED' },
          failOnStatusCode: false,
          retryOnNetworkFailure: false,
          retryOnStatusCodeFailure: false,
          log: false,
        })
        .then(({ status, body }) => {
          expect(status, 'real own rejected preflight').to.equal(200);
          const list = decodeDraftCasefileList(body);
          expect(list.count, 'personal rejected collection must be genuinely empty').to.equal(0);
          expect(list.summaries, 'personal rejected rows must be genuinely empty').to.have.length(0);
        }),
    );
  }

  /** Retains each observed receipt before performing fresh-version lifecycle changes.
   * @param status Required persisted lifecycle state.
   * @param options Provisioned actor overrides and synthetic payload variations.
   * @returns The observed owned fixture after authoritative lifecycle/account assertions succeed.
   */
  public create(
    status: MonitoringStatus,
    options: IDraftCasefileFixtureOptions = {},
  ): Cypress.Chainable<IOwnedDraftCasefile> {
    const approval = status === 'PUBLISHED' || status === 'PUBLISHING_PENDING';
    const seed = approval ? { ...options, minorCreditorCount: 2 as const } : options;
    return createOwnedSubmittedDraft(seed).then((owned) => {
      this.state.ownedById.set(owned.id, owned);
      this.state.ownedByKey.set(`${status}:${owned.id}`, owned);
      if (status === 'SUBMITTED') return cy.wrap(owned, { log: false });
      if (status === 'REJECTED') {
        rejectOwnedDraft(owned);
      } else {
        performAuthentication(owned.checker);
        readDraftSnapshot(owned.id).then((snapshot) => {
          return requestDraftChange(snapshot, 'PATCH', {
            business_unit_id: snapshot.draft.business_unit_id,
            casefile_status: approval ? 'PUBLISHING_PENDING' : 'DELETED',
            ...(approval ? {} : { status_message: 'Synthetic monitoring deletion' }),
          });
        });
        cy.then(() => performAuthentication(owned.inputter));
      }
      return this.readLifecycle(owned, status).then(() => owned);
    });
  }

  /**
   * Reads publication without creating or approving a draft.
   * @param owned Exact created draft identity and marker.
   * @returns The independently read complete Published snapshot.
   */
  public readPublished(owned: IOwnedDraftCasefile): Cypress.Chainable<IDraftCasefileSnapshot> {
    return this.readLifecycle(owned, 'PUBLISHED');
  }

  /** Reads persisted setup results with bounded polling only for asynchronous publication.
   * @param owned Exact created draft identity and marker.
   * @param status Required lifecycle state.
   * @param remaining Maximum remaining authenticated reads.
   * @returns The authoritative snapshot once the required state is verified.
   */
  private readLifecycle(
    owned: IOwnedDraftCasefile,
    status: MonitoringStatus,
    remaining = 30,
  ): Cypress.Chainable<IDraftCasefileSnapshot> {
    return readDraftSnapshot(owned.id).then((snapshot) => {
      expect(snapshot.draft.submitted_by, 'same owned inputter').to.equal(owned.inputterId);
      expect(snapshot.draft.casefile.respondent_account.remo_reference, 'same owned marker').to.equal(owned.marker);
      if (status === 'PUBLISHED') {
        if (snapshot.draft.casefile_status === 'PUBLISHING_FAILED')
          throw new Error('Owned publication reached PUBLISHING_FAILED');
        if (snapshot.draft.casefile_status === 'PUBLISHING_PENDING' && remaining > 1) {
          return cy.wait(1000, { log: false }).then(() => this.readLifecycle(owned, status, remaining - 1));
        }
      }
      expect(snapshot.draft.casefile_status, `real ${status} fixture lifecycle`).to.equal(status);
      if (status === 'PUBLISHED' || status === 'PUBLISHING_PENDING') this.assertAccounts(snapshot, status);
      return cy.wrap(snapshot, { log: false });
    });
  }

  /** Uses the application detail contract before checking real generated identifiers and numbers.
   * @param snapshot Authoritative detail and original ETag.
   * @param status Expected publication state; pending must retain null IDs and numbers.
   */
  private assertAccounts(snapshot: IDraftCasefileSnapshot, status: 'PUBLISHED' | 'PUBLISHING_PENDING'): void {
    const { draft } = decodeDraftCasefileDetail(snapshot.draft, snapshot.etag, snapshot.draft.draft_casefile_id);
    const saved = draft.casefile_snapshot;
    expect(
      saved.minor_creditor_accounts.map((account) => account.creditor_sequence).sort(),
      'both generated creditor sequences',
    ).to.deep.equal([1, 2]);
    const accounts = [saved.respondent_account, saved.applicant_account, ...saved.minor_creditor_accounts];
    for (const account of accounts) {
      if (status === 'PUBLISHING_PENDING') {
        expect(account.account_id, 'pending account ID').to.equal(null);
        expect(account.account_number, 'pending account number').to.equal(null);
      } else {
        expect(
          Number.isSafeInteger(account.account_id) && Number(account.account_id) > 0,
          'generated account ID',
        ).to.equal(true);
        expect(account.account_number, 'generated account number').to.be.a('string').and.match(/\S/);
      }
    }
  }
}
