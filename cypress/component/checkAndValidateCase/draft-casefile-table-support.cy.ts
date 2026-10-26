import { locateDraftCasefileRow } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-table.actions';
import { CasesDraftSelectors as D } from '../../shared/selectors/cases-draft.selectors';

const buildTags = (): string[] => ['@JIRA-STORY:PO-10626', '@JIRA-EPIC:PO-10817'];

function renderPage(document: Document, page: number): void {
  const ids = page === 1 ? [101, 102] : [126];
  document.body.innerHTML = `
    <app-cases-draft-table><table><tbody>${ids
      .map((id) => `<tr data-draft-id="${id}"><td>${id}</td></tr>`)
      .join('')}</tbody></table></app-cases-draft-table>
    <nav id="cases-draft-pagination">
      <a href="#1" aria-label="Page 1" ${page === 1 ? 'aria-current="page"' : ''}>1</a>
      <a href="#2" aria-label="Page 2" ${page === 2 ? 'aria-current="page"' : ''}>2</a>
      ${page === 1 ? '<a href="#2" rel="next">Next</a>' : ''}
    </nav>`;
  document.querySelectorAll<HTMLAnchorElement>(`${D.pagination} a`).forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      renderPage(document, Number(link.hash.slice(1)));
    });
  });
}

describe('PO-10626 owned Draft Casefile table support', () => {
  let expectedFailure = false;
  let observedFailure = false;
  beforeEach(() => {
    expectedFailure = false;
    observedFailure = false;
  });
  afterEach(() => {
    if (expectedFailure) expect(observedFailure, 'required failure observed').to.equal(true);
  });

  function mustFail(message: string): void {
    expectedFailure = true;
    cy.once('fail', (error) => {
      if (!error.message.includes(message)) throw error;
      observedFailure = true;
      return false;
    });
  }

  it('AC4. should find the exact owned row on a later page', { tags: buildTags() }, () => {
    cy.document().then((document) => renderPage(document, 1));
    locateDraftCasefileRow(126, false).should('have.attr', 'data-draft-id', '126');
  });
  it('AC4. should restart from page one before searching', { tags: buildTags() }, () => {
    cy.document().then((document) => renderPage(document, 2));
    locateDraftCasefileRow(101, false).should('have.attr', 'data-draft-id', '101');
  });
  it('AC5. should find a later row with native keyboard activation', { tags: buildTags() }, () => {
    cy.document().then((document) => renderPage(document, 1));
    locateDraftCasefileRow(126, true).should('have.attr', 'data-draft-id', '126');
  });
  it('AC4. should fail when the owned row is absent from every page', { tags: buildTags() }, () => {
    cy.document().then((document) => renderPage(document, 1));
    mustFail('Owned Draft Casefile 999 is absent');
    locateDraftCasefileRow(999, false);
  });
  it('AC4. should fail when Next leaves the current page unchanged', { tags: buildTags() }, () => {
    cy.document().then((document) => {
      renderPage(document, 1);
      const next = document.querySelector<HTMLAnchorElement>(D.allRejectedNext)!;
      const unchanged = next.cloneNode(true);
      next.replaceWith(unchanged);
      unchanged.addEventListener('click', (event) => event.preventDefault());
    });
    mustFail('aria-current');
    locateDraftCasefileRow(126, false);
  });
  it('AC4. should reject invalid owned IDs before querying the table', { tags: buildTags() }, () => {
    for (const id of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => locateDraftCasefileRow(id, false)).to.throw('Owned Draft Casefile ID must be positive');
    }
  });
});
