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

describe('checker identity', () => {
  it.each([
    { permissions: [21], inputter: true, checker: false },
    { permissions: [22], inputter: false, checker: true },
    { permissions: [21, 22], inputter: true, checker: true },
    { permissions: [], inputter: false, checker: false },
  ])('resolves independent BU permissions $permissions', ({ permissions, inputter, checker }) => {
    const user = permittedUser();
    user.user_id = 100;
    user.business_unit_users[0].permissions = permissions.map((permission_id) => ({
      permission_id,
      permission_name: 'Synthetic permission',
    }));
    const identity = { userId: 100, businessUnitId: 44, submittedBy: 'BUU-SYNTHETIC' };
    expect(resolveCasesDraftIdentity(user, true)).toEqual(inputter ? identity : null);
    expect(resolveCasesDraftIdentity(user, true, 'checker')).toEqual(checker ? identity : null);
  });
  it.each([null, undefined])('denies missing checker user %s', (user) => {
    expect(resolveCasesDraftIdentity(user, true, 'checker')).toBeNull();
  });
  it.each(['created', 'suspended', 'deactivated', null] as const)('denies inactive checker %s', (status) => {
    expect(resolveCasesDraftIdentity({ ...permittedUser(), status }, true, 'checker')).toBeNull();
  });
  it.each(['', '  '])('denies blank checker BU identity %j', (id) => {
    const user = permittedUser();
    user.business_unit_users[0].permissions = [
      { permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' },
    ];
    user.business_unit_users[0].business_unit_user_id = id;
    expect(resolveCasesDraftIdentity(user, true, 'checker')).toBeNull();
  });
  it('requires enabled release and permission 22 in BU 44', () => {
    const user = permittedUser();
    user.business_unit_users[0].permissions = [
      { permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' },
    ];
    expect(resolveCasesDraftIdentity(user, false, 'checker')).toBeNull();
    user.business_unit_users[0].business_unit_id = 45;
    user.business_unit_users.push({ business_unit_id: 44, business_unit_user_id: 'BUU-OTHER', permissions: [] });
    expect(resolveCasesDraftIdentity(user, true, 'checker')).toBeNull();
    expect(resolveCasesDraftIdentity({ ...user, business_unit_users: [] }, true, 'checker')).toBeNull();
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
