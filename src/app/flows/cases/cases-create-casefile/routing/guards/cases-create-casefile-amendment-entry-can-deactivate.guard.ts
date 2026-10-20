import { inject } from '@angular/core';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CanDeactivateFn, DefaultUrlSerializer, PRIMARY_OUTLET } from '@angular/router';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';

const sharedDepartureGuard = canDeactivateGuard as unknown as CanDeactivateFn<unknown>;

/** Matches Angular path segments, including encoded IDs and matrix parameters. */
export function isCasesCreateCasefileAmendmentEntry(url: string): boolean {
  const tree = new DefaultUrlSerializer().parse(url);
  const segments = tree.root.children[PRIMARY_OUTLET]?.segments ?? [];
  const path = segments.map((segment) => segment.path).join('/');
  let end = path.length;
  while (path[end - 1] === '/') end -= 1;
  return /^cases\/create-casefile\/task-list\/[1-9]\d*$/.test(path.slice(0, end));
}

/** Replacing an accepted amendment needs departure confirmation; ordinary task returns do not. */
export const casesCreateCasefileAmendmentEntryCanDeactivateGuard: CanDeactivateFn<unknown> = (
  _component,
  currentRoute,
  currentState,
  nextState,
) => {
  if (!isCasesCreateCasefileAmendmentEntry(nextState.url)) return true;
  const store = inject(CasesCreateCasefileStore);
  // Editors can be locally clean while accepted corrections still belong to this draft.
  const departure = {
    canDeactivate: () =>
      !store.unsavedChanges() &&
      !store.stateChanges() &&
      !store.creditorDraft() &&
      !store.orderTermDraft() &&
      !store.orderTermAmendment() &&
      !store.orderTermRemoval() &&
      !store.minorCreditorRemoval(),
  };
  return sharedDepartureGuard(departure, currentRoute, currentState, nextState);
};
