import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '@app/flows/cases/constants/release-1c-rm-create-case-files-feature-flag.constant';
import { filterCreateCasefileDashboardConfig } from '@app/flows/cases/utils/filter-create-casefile-dashboard-config.utils';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { DashboardPage } from '@hmcts/opal-frontend-common/pages/dashboard-page';
import { map } from 'rxjs';
import { DASHBOARD_PAGE_CONFIGURATION_MAP, isDashboardPageType } from './constants/dashboard-config.constant';
import { IDashboardPageConfiguration } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';
import { DASHBOARD_PAGE_DEFAULT_TAB } from './constants/dashboard-config-default-tab.constant';
import { DASHBOARD_CONFIG_DEFAULT_DASHBOARD } from './constants/dashboard-config-default-dashboard.constant';

@Component({
  selector: 'app-dashboard',
  imports: [DashboardPage],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly globalStore = inject(GlobalStore);
  private readonly activatedRoute = inject(ActivatedRoute);

  /**
   * Creates a signal that tracks the 'dashboardType' route parameter. This signal updates whenever the route parameters change, allowing the component to reactively determine which dashboard configuration to use based on the current URL. The initial value is set to null, indicating that no specific dashboard type has been selected yet.
   */
  private readonly dashboardType = toSignal(
    this.activatedRoute.paramMap.pipe(map((paramMap) => paramMap.get('dashboardType'))),
    { initialValue: null },
  );

  /**
   * Resolves the dashboard configuration based on the current route parameter 'dashboardType'. If the parameter is valid and corresponds to a known dashboard type, it returns the specific configuration for that type. If the parameter is missing or invalid, it falls back to the default dashboard configuration defined in DASHBOARD_CONFIG_DEFAULT_DASHBOARD.
   */
  public readonly resolvedConfig = computed<IDashboardPageConfiguration>(() => {
    const featureFlags: Record<string, unknown> = this.globalStore.featureFlags();
    const dashboardType = this.dashboardType();
    const config =
      dashboardType && isDashboardPageType(dashboardType)
        ? DASHBOARD_PAGE_CONFIGURATION_MAP[dashboardType]
        : (DASHBOARD_PAGE_CONFIGURATION_MAP[DASHBOARD_PAGE_DEFAULT_TAB] ?? DASHBOARD_CONFIG_DEFAULT_DASHBOARD);
    return filterCreateCasefileDashboardConfig(
      config,
      featureFlags?.[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] === true,
    );
  });
}
