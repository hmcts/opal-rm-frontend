import { describe, expect, it } from 'vitest';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { resolveCasesDraftIdentity, sameCasesDraftIdentity } from './cases-draft-identity';

const permittedUser = (): IOpalUserState => ({
  ...structuredClone(OPAL_USER_STATE_MOCK),
  status: 'active',
  business_unit_users: [
    {
      business_unit_id: 44,
      business_unit_user_id: 'BUU-SYNTHETIC',
      permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
    },
  ],
});

describe('resolveCasesDraftIdentity', () => {
  it('uses the authorised BU string identity', () => {
    const user = permittedUser();
    expect(resolveCasesDraftIdentity(user, true)).toEqual({
      userId: user.user_id,
      businessUnitId: 44,
      submittedBy: 'BUU-SYNTHETIC',
    });
  });
  it.each([null, undefined])('denies unavailable identity %s', (user) =>
    expect(resolveCasesDraftIdentity(user, true)).toBeNull(),
  );
  it.each(['created', 'suspended', 'deactivated', null] as const)('denies non-active status %s', (status) => {
    expect(resolveCasesDraftIdentity({ ...permittedUser(), status }, true)).toBeNull();
  });
  it('denies a disabled release', () => expect(resolveCasesDraftIdentity(permittedUser(), false)).toBeNull());
  it('denies absent business units', () =>
    expect(resolveCasesDraftIdentity({ ...permittedUser(), business_unit_users: [] }, true)).toBeNull());
  it('denies permission 21 held only in another BU', () => {
    const user = permittedUser();
    user.business_unit_users[0].business_unit_id = 45;
    user.business_unit_users.push({ business_unit_id: 44, business_unit_user_id: 'BUU-OTHER', permissions: [] });
    expect(resolveCasesDraftIdentity(user, true)).toBeNull();
  });
  it.each(['', '  '])('denies blank BU user ID %j', (business_unit_user_id) => {
    const user = permittedUser();
    user.business_unit_users[0].business_unit_user_id = business_unit_user_id;
    expect(resolveCasesDraftIdentity(user, true)).toBeNull();
  });
});

describe('sameCasesDraftIdentity', () => {
  const scope = { userId: 100, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' };
  it('compares equivalent scopes and absent scopes', () => {
    expect(sameCasesDraftIdentity(scope, { ...scope })).toBe(true);
    expect(sameCasesDraftIdentity(null, null)).toBe(true);
    expect(sameCasesDraftIdentity(scope, null)).toBe(false);
    expect(sameCasesDraftIdentity(null, scope)).toBe(false);
  });
  it.each([{ userId: 101 }, { submittedBy: 'BUU-NEW' }])('detects changed scope %j', (change) => {
    expect(sameCasesDraftIdentity(scope, { ...scope, ...change })).toBe(false);
  });
});
