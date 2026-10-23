import { CasesDraftCasefileStore } from '../cases-draft/stores/cases-draft-casefile.store';
import { resolveCasesDraftReadIdentity } from '../cases-draft/utils/cases-draft-casefile-permissions';
import { sameCasesDraftIdentity } from '../cases-draft/utils/cases-draft-identity';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../constants/release-1c-rm-create-case-files-feature-flag.constant';
import { CasesCreateCasefileReviewNavigationService } from './services/cases-create-casefile-review-navigation.service';
import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CanDeactivateTypes } from '@hmcts/opal-frontend-common/guards/can-deactivate/types';
import { CasesCreateCasefileStore } from './stores/cases-create-casefile.store';

@Component({
  selector: 'app-cases-create-casefile',
  imports: [RouterOutlet],
  providers: [CasesDraftCasefileStore],
  templateUrl: './cases-create-casefile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileComponent implements OnDestroy {
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly store = inject(CasesCreateCasefileStore);

  private readonly persistedStore = inject(CasesDraftCasefileStore);
  private readonly globalStore = inject(GlobalStore);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      const identity = this.persistedStore.identity();
      if (!identity) return;
      const released =
        (this.globalStore.featureFlags() as Record<string, unknown>)[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] ===
        true;
      const current = this.globalStore.authenticated()
        ? resolveCasesDraftReadIdentity(this.globalStore.userState(), released)
        : null;
      if (!sameCasesDraftIdentity(current, identity)) {
        this.store.resetStore();
        this.persistedStore.resetStore();
        this.reviewNavigation.clearContext();
        void this.router.navigateByUrl('/error/permission-denied');
      }
    });
  }

  @HostListener('window:beforeunload')
  public handleBeforeUnload(): boolean {
    return (
      !this.store.unsavedChanges() &&
      !this.store.stateChanges() &&
      this.store.creditorDraft() === null &&
      this.store.orderTermAmendment() === null
    );
  }

  public canDeactivate(): CanDeactivateTypes {
    return (
      !this.store.unsavedChanges() &&
      !this.store.stateChanges() &&
      this.store.creditorDraft() === null &&
      this.store.orderTermAmendment() === null
    );
  }

  public ngOnDestroy(): void {
    this.store.resetStore();
    this.persistedStore.resetStore();
    this.reviewNavigation.clearContext();
  }
}
