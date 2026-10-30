import { accessibilityActions } from '../../e2e/functional/opal/actions/accessibility/accessibility.actions';

const tags = (): string[] => ['@JIRA-STORY:PO-10626', '@JIRA-EPIC:PO-10817'];

describe('Shared E2E accessibility policy', () => {
  let expectedFailure = false;
  let observedFailure = false;
  beforeEach(() => {
    expectedFailure = false;
    observedFailure = false;
    cy.document().then((document) => {
      document.title = 'Accessibility policy';
      document.documentElement.lang = 'en';
      document.body.innerHTML =
        '<main><h1>Accessibility policy</h1><button aria-checked="true">Continue</button></main>';
    });
  });
  afterEach(() => {
    if (expectedFailure) expect(observedFailure, 'non-exempt violation must fail').to.equal(true);
  });

  it('AC1. should omit the same ARIA rule as Fines', { tags: tags() }, () => {
    cy.injectAxe();
    cy.window().then(async (window) => {
      const result = await window.axe.run(window.document, { runOnly: ['aria-allowed-attr'] });
      expect(result.violations.map(({ id }) => id)).to.deep.equal(['aria-allowed-attr']);
    });
    accessibilityActions.checkAccessibilityOnly();
  });

  it('AC1. should still fail for a non-exempt accessibility violation', { tags: tags() }, () => {
    cy.document().then((document) => {
      const image = document.createElement('img');
      image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      document.querySelector('main')!.appendChild(image);
    });
    cy.injectAxe();
    cy.window().then(async (window) => {
      const result = await window.axe.run(window.document, { runOnly: ['image-alt'] });
      expect(result.violations.map(({ id }) => id)).to.deep.equal(['image-alt']);
    });
    cy.then(() => {
      expectedFailure = true;
      cy.once('fail', (error) => {
        if (!error.message.includes('1 accessibility violation was detected')) throw error;
        observedFailure = true;
        return false;
      });
    });
    accessibilityActions.checkAccessibilityOnly();
  });
});
