import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from 'src/app/flows/cases/constants/release-1c-rm-create-case-files-feature-flag.constant';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { mount } from 'cypress/angular';
import { NEVER } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { LoginLocators as Login } from '../../shared/selectors/login.locators';
import { PrimaryNavigationLocators as Nav } from '../../shared/selectors/primary-navigation.locators';
import {
  STARTER_USER_STATE_CASES_ONLY,
  STARTER_USER_STATE_ALL_DASHBOARDS,
} from '../CommonIntercepts/CommonUserState.mocks';

const mountAppShell = ({
  authenticated,
  userState,
  createCaseFilesEnabled = false,
}: {
  authenticated: boolean;
  userState: IOpalUserState;
  createCaseFilesEnabled?: boolean;
}) =>
  mount(AppComponent, {
    providers: [
      provideHttpClient(),
      provideRouter([]),
      {
        provide: GlobalStore,
        useFactory: () => {
          const store = new GlobalStore();
          store.setAuthenticated(authenticated);
          store.setUserState(userState);
          store.setFeatureFlags({ [RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG]: createCaseFilesEnabled });
          return store;
        },
      },
      {
        provide: SessionService,
        useValue: {
          getTokenExpiry: () => NEVER,
        },
      },
      {
        provide: AppInsightsService,
        useValue: {
          logPageView: () => null,
        },
      },
      {
        provide: LaunchDarklyService,
        useValue: {
          initializeLaunchDarklyClient: () => null,
          initializeLaunchDarklyFlags: () => Promise.resolve(),
          initializeLaunchDarklyChangeListener: () => null,
        },
      },
    ],
  });

describe('App shell', () => {
  it('shows only the sign in link when the user is unauthenticated', () => {
    mountAppShell({
      authenticated: false,
      userState: {} as IOpalUserState,
    });

    cy.get(Login.accountNavigationLink).should('contain.text', 'Sign in');
    cy.get(Nav.container).should('not.exist');
  });

  it('shows only Cases when the user only has accounts permissions', () => {
    mountAppShell({
      authenticated: true,
      userState: STARTER_USER_STATE_CASES_ONLY,
      createCaseFilesEnabled: true,
    });

    cy.get(Login.accountNavigationLink).should('contain.text', 'Sign out');
    cy.get(Nav.items).should('have.length', 1);
    cy.get(Nav.items).first().should('contain.text', Nav.labels.cases);
  });

  it('shows only Cases even when the user has all starter permissions', () => {
    mountAppShell({
      authenticated: true,
      userState: STARTER_USER_STATE_ALL_DASHBOARDS,
      createCaseFilesEnabled: true,
    });

    cy.get(Nav.items).should('have.length', 1).and('contain.text', Nav.labels.cases);
  });

  it('hides released navigation when the create-casefile flag changes to false', () => {
    mountAppShell({
      authenticated: true,
      userState: STARTER_USER_STATE_ALL_DASHBOARDS,
      createCaseFilesEnabled: true,
    }).then(({ component }) => {
      cy.get(Nav.items).should('have.length', 1).and('contain.text', Nav.labels.cases);
      cy.then(() => component.globalStore.setFeatureFlags({ [RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG]: false }));
      cy.get(Nav.container).should('not.exist');
      cy.get(Login.accountNavigationLink).should('contain.text', 'Sign out');
    });
  });
});
