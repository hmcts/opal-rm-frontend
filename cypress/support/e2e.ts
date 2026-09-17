import './commands';
import 'cypress-axe';

// Native leave-site dialogs block reloads and test isolation. Keep route confirm() dialogs enabled.
Cypress.on('window:before:load', (window) => {
  window.addEventListener('beforeunload', (event) => event.stopImmediatePropagation(), { capture: true });
});

Cypress.on('uncaught:exception', (err) => {
  const message = String((err as { message?: string })?.message || err || '');

  if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
    return false;
  }

  return true;
});
