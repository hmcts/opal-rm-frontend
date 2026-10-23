import { describe, expect, it } from 'vitest';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { createPersistedCasefileDetail } from '../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { resolveCasesDraftReadIdentity, canReviewDraftCasefile } from './cases-draft-casefile-permissions';

const userWith = (permissions: number[]): IOpalUserState => ({
  ...structuredClone(OPAL_USER_STATE_MOCK),
  user_id: 10606,
  status: 'active',
  business_unit_users: [
    {
      business_unit_id: 44,
      business_unit_user_id: 'BUU-CHECKER',
      permissions: permissions.map((permission_id) => ({ permission_id, permission_name: 'Synthetic' })),
    },
  ],
});
describe('persisted casefile permissions', () => {
  it.each([[21], [22], [21, 22]].map((permissions) => ({ permissions })))(
    'allows read for released permission $permissions',
    ({ permissions }) => {
      expect(resolveCasesDraftReadIdentity(userWith(permissions), true)).toEqual({
        userId: 10606,
        businessUnitId: 44,
        submittedBy: 'BUU-CHECKER',
      });
      expect(canReviewDraftCasefile(createPersistedCasefileDetail(), userWith(permissions), true)).toBe(
        permissions.includes(22),
      );
    },
  );
  it.each([
    'SUBMITTED',
    'RESUBMITTED',
    'REJECTED',
    'DELETED',
    'PUBLISHED',
    'PUBLISHING_PENDING',
    'PUBLISHING_FAILED',
  ] as const)('reviews only eligible status %s', (casefile_status) => {
    expect(canReviewDraftCasefile({ ...createPersistedCasefileDetail(), casefile_status }, userWith([22]), true)).toBe(
      ['SUBMITTED', 'RESUBMITTED'].includes(casefile_status),
    );
  });
  it('compares BU-user ID rather than global-user ID for self submission', () => {
    expect(
      canReviewDraftCasefile({ ...createPersistedCasefileDetail(), submitted_by: 'BUU-CHECKER' }, userWith([22]), true),
    ).toBe(false);
  });
  it.each([null, undefined])('denies absent actor %s', (user) =>
    expect(resolveCasesDraftReadIdentity(user, true)).toBeNull(),
  );
  it('denies inactive, revoked, other-BU and unreleased identities', () => {
    const user = userWith([21, 22]);
    expect(resolveCasesDraftReadIdentity({ ...user, status: 'suspended' }, true)).toBeNull();
    expect(resolveCasesDraftReadIdentity(userWith([]), true)).toBeNull();
    expect(resolveCasesDraftReadIdentity(user, false)).toBeNull();
    user.business_unit_users[0].business_unit_id = 45;
    expect(resolveCasesDraftReadIdentity(user, true)).toBeNull();
    expect(
      canReviewDraftCasefile({ ...createPersistedCasefileDetail(), business_unit_id: 45 }, userWith([22]), true),
    ).toBe(false);
  });
});
