/**
 * Forces any `window.open()` calls to stay inside the current Cypress tab.
 */
export function forceSingleTabNavigation(): void {
  cy.window().then((win) => {
    cy.stub(win, 'open').callsFake((url) => {
      win.location.href = url as string;
    });
  });
}
