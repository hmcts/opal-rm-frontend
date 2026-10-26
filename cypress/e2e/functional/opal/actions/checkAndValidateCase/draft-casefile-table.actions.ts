import { CasesDraftSelectors as D } from '../../../../../shared/selectors/cases-draft.selectors';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';

/**
 * Find the exact owned row without opening it, starting at page one of an already-ready list.
 * @param id Positive safe-integer Draft Casefile ID.
 * @param keyboard Whether pagination uses native keyboard activation.
 * @returns The visible owned row; fails if it is absent or pagination does not advance.
 */
export function locateDraftCasefileRow(id: number, keyboard: boolean): Cypress.Chainable<JQuery<HTMLElement>> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Owned Draft Casefile ID must be positive');
  const visited = new Set<string>();
  const activate = (selector: string): void => {
    if (keyboard) {
      cy.get(selector).should('be.visible').focus().should('be.focused');
      pressDashboardEnter();
    } else cy.get(selector).should('be.visible').click();
  };
  const seek = (): Cypress.Chainable<JQuery<HTMLElement>> =>
    cy.get('body').then((body) => {
      if (body.find(D.row(id)).length) return cy.get(D.row(id)).should('be.visible');
      const current = body.find(`${D.pagination} a[aria-current="page"]`).attr('aria-label') ?? 'Page 1';
      if (visited.has(current)) throw new Error(`Repeated Draft Casefile page: ${current}`);
      visited.add(current);
      if (!body.find(D.allRejectedNext).length) throw new Error(`Owned Draft Casefile ${id} is absent`);
      const match = /^Page ([1-9]\d*)$/.exec(current);
      if (!match) throw new Error('Draft Casefile page label is invalid');
      const next = Number(match[1]) + 1;
      activate(D.allRejectedNext);
      cy.get(D.allRejectedPage(next)).should('have.attr', 'aria-current', 'page');
      return cy.then(() => seek());
    });
  return cy.get('body').then((body) => {
    const current = body.find(`${D.pagination} a[aria-current="page"]`).attr('aria-label');
    if (current && current !== 'Page 1') {
      activate(D.allRejectedPage(1));
      cy.get(D.allRejectedPage(1)).should('have.attr', 'aria-current', 'page');
    }
    return cy.then(() => seek());
  });
}
