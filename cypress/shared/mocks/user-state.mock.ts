import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { PERMISSIONS } from 'src/app/constants/permissions.constant';

export const createStarterUserState = (permissionIds: readonly number[]): IOpalUserState => {
  const userState = structuredClone(OPAL_USER_STATE_MOCK);
  const [firstBusinessUnit, secondBusinessUnit] = userState.business_unit_users;

  userState.business_unit_users = [
    {
      ...firstBusinessUnit,
      permissions: [],
    },
    {
      ...secondBusinessUnit,
      permissions: permissionIds.map((permissionId) => ({
        permission_id: permissionId,
        permission_name: `Permission ${permissionId}`,
      })),
    },
  ];

  return userState;
};

export const STARTER_USER_STATE_NO_DASHBOARD_PERMISSIONS = createStarterUserState([]);

export const STARTER_USER_STATE_ACCOUNTS_ONLY = createStarterUserState([
  PERMISSIONS['create-and-manage-draft-accounts'],
  PERMISSIONS['check-and-validate-draft-accounts'],
  PERMISSIONS['consolidate'],
]);

export const STARTER_USER_STATE_ALL_DASHBOARDS = createStarterUserState([
  PERMISSIONS['search-and-view-accounts'],
  PERMISSIONS['create-and-manage-draft-accounts'],
  PERMISSIONS['check-and-validate-draft-accounts'],
  PERMISSIONS['consolidate'],
  PERMISSIONS['operational-report-by-enforcement'],
]);
