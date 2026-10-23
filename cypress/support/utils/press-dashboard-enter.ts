// Chrome's native character event is required for button activation; cy.press Enter omits it in this runtime.
export const pressDashboardEnter = () =>
  cy.then(async () => {
    if (Cypress.browser.family !== 'chromium')
      throw new Error(
        'Dashboard native Enter proof requires Chromium; Cypress cy.press does not support Firefox. Run the repository-supported --browser chrome command.',
      );
    await Cypress.automation('remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: {
        type: 'keyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        nativeVirtualKeyCode: 13,
        text: '\r',
        unmodifiedText: '\r',
      },
    });
    await Cypress.automation('remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 },
    });
  });
