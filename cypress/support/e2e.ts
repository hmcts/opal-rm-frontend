import './commands';
import 'cypress-axe';

Cypress.on('uncaught:exception', (err) => {
  const message = String((err as { message?: string })?.message || err || '');

  if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
    return false;
  }

  return true;
});
