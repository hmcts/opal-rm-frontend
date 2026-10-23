import { decodeDraftCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-detail';
import { CasesDraftSelectors as S } from '../../../../../shared/selectors/cases-draft.selectors';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';

/** Checks generated wire accounts and their exact read-only dashboard projection.
 * @param snapshot Independent authenticated persisted GET, never a manufactured publication result.
 * @param pending Whether the operator-verified stable pending state is required.
 */
export function assertMonitoringAccounts(snapshot: IDraftCasefileSnapshot, pending: boolean): void {
  const { draft } = decodeDraftCasefileDetail(snapshot.draft, snapshot.etag, snapshot.draft.draft_casefile_id);
  expect(draft.casefile_status).to.equal(pending ? 'PUBLISHING_PENDING' : 'PUBLISHED');
  const saved = draft.casefile_snapshot;
  const creditors = [...saved.minor_creditor_accounts].sort(
    (left, right) => left.creditor_sequence - right.creditor_sequence,
  );
  expect(
    creditors.map((account) => account.creditor_sequence),
    'both real minor creditor sequences',
  ).to.deep.equal([1, 2]);
  const accounts = [saved.respondent_account, saved.applicant_account, ...creditors];
  for (const account of accounts) {
    if (pending) {
      expect(account.account_id, 'pending ID').to.equal(null);
      expect(account.account_number, 'pending number').to.equal(null);
    } else {
      expect(Number.isSafeInteger(account.account_id) && Number(account.account_id) > 0, 'generated ID').to.equal(true);
      expect(account.account_number, 'real generated number').to.be.a('string').and.match(/\S/);
    }
  }
  const row = S.row(draft.draft_casefile_id);
  cy.get(row).should('be.visible');
  for (const [column, account] of [
    ['respondentAccount', saved.respondent_account],
    ['applicantAccount', saved.applicant_account],
  ] as const) {
    cy.get(row)
      .find(S.column(column))
      .should((cell) => expect(cell.text().trim()).to.equal(pending ? '—' : account.account_number));
  }
  if (pending) {
    cy.get(row)
      .find(S.column('minorCreditorAccounts'))
      .should((cell) => expect(cell.text().trim()).to.equal('—'));
    cy.get(row).find(S.column('minorCreditorAccounts')).find('li').should('not.exist');
  } else {
    cy.get(row)
      .find(S.column('minorCreditorAccounts'))
      .find('li')
      .should((items) => {
        expect(
          [...items].map((item) => item.textContent?.trim()),
          'all saved creditors in sequence',
        ).to.deep.equal(creditors.map((account) => account.account_number));
      });
  }
  for (const column of ['respondentAccount', 'applicantAccount', 'minorCreditorAccounts']) {
    cy.get(row).find(S.column(column)).find('a, button, input').should('not.exist');
  }
}
