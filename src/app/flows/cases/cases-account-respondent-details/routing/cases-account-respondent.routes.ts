import { Routes } from '@angular/router';
import { PRIMARY_NAV_HIDDEN_ROUTE_DATA } from '@app/constants/route-data.constant';
import { accountGuard } from '@hmcts/opal-frontend-common/guards/account';
import { authGuard } from '@hmcts/opal-frontend-common/guards/auth';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { RESPONDENT_ACCOUNT_ROUTE } from './cases-account-respondent-navigation';
import { respondentAccountDetailsGuard } from './respondent-account-details.guard';

const loadPlaceholder = () =>
  import('../components/respondent-account-action-placeholder/respondent-account-action-placeholder.component').then(
    (module) => module.RespondentAccountActionPlaceholderComponent,
  );

export const casesAccountRespondentRoutes: Routes = [
  {
    path: RESPONDENT_ACCOUNT_ROUTE.slice(1) + '/:respondentAccountId',
    canActivate: [authGuard, accountGuard, respondentAccountDetailsGuard],
    canActivateChild: [respondentAccountDetailsGuard],
    data: { ...PRIMARY_NAV_HIDDEN_ROUTE_DATA, sectionKey: 'cases' },
    children: [
      {
        path: 'details',
        loadComponent: () =>
          import('../cases-account-respondent-details.component').then(
            (module) => module.CasesAccountRespondentDetailsComponent,
          ),
        data: { title: 'Respondent account details' },
        resolve: { title: TitleResolver },
      },
      {
        path: 'note/add',
        loadComponent: loadPlaceholder,
        data: { title: 'Add account note', actionHeading: 'Add account note' },
        resolve: { title: TitleResolver },
      },
      {
        path: 'case-type/change',
        loadComponent: loadPlaceholder,
        data: { title: 'Change case type', actionHeading: 'Change case type' },
        resolve: { title: TitleResolver },
      },
      {
        path: 'comment/change',
        loadComponent: loadPlaceholder,
        data: { title: 'Add or change comment', actionHeading: 'Add or change comment', comment: true },
        resolve: { title: TitleResolver },
      },
    ],
  },
];
