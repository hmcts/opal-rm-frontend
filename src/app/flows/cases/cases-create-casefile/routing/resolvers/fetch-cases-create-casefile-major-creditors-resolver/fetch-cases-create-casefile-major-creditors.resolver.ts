import { inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, ResolveFn, Router } from '@angular/router';
import { filter, take } from 'rxjs';
import { CasesCreateCasefileMajorCreditorsLoadService } from '../../../cases-create-casefile-order-term-creditor/services/cases-create-casefile-major-creditors-load.service';
import { OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID } from '../../../../services/opal-maintenance-service/constants/opal-maintenance-business-unit-ids.constant';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';

export const fetchCasesCreateCasefileMajorCreditorsResolver: ResolveFn<
  CasesCreateCasefileMajorCreditorsLoadService
> = () => {
  const owner = new CasesCreateCasefileMajorCreditorsLoadService(
    inject(OpalMaintenanceService),
    OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID,
  );
  const router = inject(Router);
  const navigationId = router.currentNavigation()?.id;
  router.events
    .pipe(
      filter(
        (event) =>
          (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) &&
          event.id === navigationId,
      ),
      take(1),
    )
    .subscribe((event) => {
      if (!(event instanceof NavigationEnd)) owner.dispose();
    });
  owner.load();
  return owner;
};
