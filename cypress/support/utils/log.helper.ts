export type LogScope = 'action' | 'assert' | 'done' | 'navigate' | 'step' | 'warn';

/**
 * Logs a message to both the Cypress command log and the browser console with a specified scope and optional details.
 * @param scope The scope of the log message, which can be one of 'action', 'assert', 'done', 'navigate', 'step', or 'warn'.
 * @param message The message to be logged.
 * @param details Optional additional details to be included in the console log as properties.
 */
export function log(scope: LogScope, message: string, details?: Record<string, unknown>): void {
  Cypress.log({
    name: scope,
    message,
    consoleProps: () => details ?? {},
  });

  cy.log(`[${scope.toUpperCase()}] ${message}`);
}

export const createScopedLogger = (scopeName: string) => {
  return (scope: LogScope, message: string, details?: Record<string, unknown>): void => {
    log(scope, message, { scope: scopeName, ...details });
  };
};
