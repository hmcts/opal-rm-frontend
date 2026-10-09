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
import { createStarterUserState, STARTER_USER_STATE_CASES_ONLY } from '../CommonIntercepts/CommonUserState.mocks';

const mountAppShell = ({ authenticated, userState }: { authenticated: boolean; userState: IOpalUserState }) =>
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

  it('shows only Cases when the user has the RM casefile permission', () => {
    mountAppShell({
      authenticated: true,
      userState: STARTER_USER_STATE_CASES_ONLY,
    });

    cy.get(Login.accountNavigationLink).should('contain.text', 'Sign out');
    cy.get(Nav.items).should('have.length', 1);
    cy.get(Nav.items).first().should('contain.text', Nav.labels.cases);
  });

  it('keeps sections without RM permissions hidden even when legacy Fines permissions are present', () => {
    mountAppShell({
      authenticated: true,
      userState: createStarterUserState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 21]),
    });

    cy.get(Nav.items).should('have.length', 1);
    cy.get(Nav.items).first().should('contain.text', Nav.labels.cases);
  });
});
