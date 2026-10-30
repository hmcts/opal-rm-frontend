type TestActorRole = 'inputter' | 'checker' | 'deniedUser' | 'secondInputter' | 'foreignBuInputter';

const defaultActors: Partial<Record<TestActorRole, string>> = {
  inputter: 'opal-test@dev.platform.hmcts.net',
  checker: 'opal-test-10@dev.platform.hmcts.net',
  deniedUser: 'opal-test-4@dev.platform.hmcts.net',
};

/**
 * Selects an existing test username; callers must still verify its live permissions and independent identity.
 * @param role Reusable actor role, independent of the ticket or scenario.
 * @returns The provisioned default or optional RM_TEST_ACTORS override; unavailable roles fail explicitly.
 */
export function getTestActor(role: TestActorRole): string {
  const configured: unknown = Cypress.env('RM_TEST_ACTORS');
  if (
    configured !== undefined &&
    (configured === null || typeof configured !== 'object' || Array.isArray(configured))
  ) {
    throw new Error('RM_TEST_ACTORS must be an object of existing test usernames');
  }
  const override = (configured as Partial<Record<TestActorRole, unknown>> | undefined)?.[role];
  const username = override === undefined ? defaultActors[role] : override;
  if (typeof username !== 'string' || !username.trim()) {
    throw new Error(`RM test actor '${role}' must identify an existing provisioned user`);
  }
  return username.trim();
}
