import type { Router } from '@angular/router';
import type { ICasesCreateCasefileOrderTermAmendment } from '../interfaces/cases-create-casefile-order-term-amendment.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';

type AmendmentStore = Pick<
  InstanceType<typeof CasesCreateCasefileStore>,
  'cancelOrderTermAmendment' | 'orderTermAmendment'
>;

export async function cancelOrderTermAmendmentAfterNavigation(
  router: Pick<Router, 'navigateByUrl'>,
  store: AmendmentStore,
  destination: string,
  amendment: ICasesCreateCasefileOrderTermAmendment,
): Promise<'cancelled' | 'failed' | 'retained'> {
  try {
    if (!(await router.navigateByUrl(destination))) return 'retained';
    if (store.orderTermAmendment() !== amendment) return 'retained';
    return store.cancelOrderTermAmendment(amendment.termId) ? 'cancelled' : 'retained';
  } catch {
    return 'failed';
  }
}
