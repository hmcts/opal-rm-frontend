import { inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, ResolveFn, Router } from '@angular/router';
import { filter, take } from 'rxjs';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import { CasesCreateCasefileOrderTermsLoadService } from '../../../cases-create-casefile-order-terms-select/services/cases-create-casefile-order-terms-load.service';

export const fetchCasesCreateCasefileOrderTermsResolver: ResolveFn<CasesCreateCasefileOrderTermsLoadService> = () => {
  const owner = new CasesCreateCasefileOrderTermsLoadService(inject(OpalMaintenanceService));
  const router = inject(Router);
  const navigationId = router.currentNavigation()?.id;
  // If activation fails before the routed component owns cleanup, release this activation's request here.
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
