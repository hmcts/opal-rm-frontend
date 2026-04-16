export function getConfiguredBaseUrl(): string {
  return String(Cypress.config('baseUrl') ?? '');
}

export function isLocalOrPrEnvironment(): boolean {
  const baseUrl = getConfiguredBaseUrl();
  return baseUrl.includes('pr-') || baseUrl.includes('localhost');
}
