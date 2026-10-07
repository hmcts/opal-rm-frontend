import {
  afterNextRender,
  effect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GovukButtonComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-button';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { UtilsService } from '@hmcts/opal-frontend-common/services/utils-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import type { ICasesDraftCasefileResolved } from '../interfaces/cases-draft-casefile-resolved.interface';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CasesDraftCasefileStore } from '../stores/cases-draft-casefile.store';
import { canReviewDraftCasefile, resolveCasesDraftReadIdentity } from '../utils/cases-draft-casefile-permissions';
import { sameCasesDraftIdentity } from '../utils/cases-draft-identity';

@Component({
  selector: 'app-cases-draft-delete-placeholder',
  imports: [GovukButtonComponent],
  templateUrl: './cases-draft-delete-placeholder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftDeletePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navigation = inject(CasesDraftNavigationService);
  private readonly store = inject(CasesDraftCasefileStore);
  private readonly globalStore = inject(GlobalStore);
  private readonly utils = inject(UtilsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly resolved = signal<ICasesDraftCasefileResolved | null>(null);
  private readonly navigating = signal(false);
  private denialRequested = false;
  public readonly readable = computed(() => {
    const result = this.resolved();
    const draft = this.store.draft();
    const released =
      (this.globalStore.featureFlags() as Record<string, unknown>)[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] ===
      true;
    return (
      !!result &&
      !!draft &&
      result.intent === 'checker-delete' &&
      draft.draft_casefile_id === result.draft.draft_casefile_id &&
      draft.business_unit_id === result.identity.businessUnitId &&
      this.globalStore.authenticated() &&
      sameCasesDraftIdentity(resolveCasesDraftReadIdentity(this.globalStore.userState(), released), result.identity)
    );
  });

  public readonly eligible = computed(
    () =>
      this.readable() &&
      canReviewDraftCasefile(
        this.store.draft()!,
        this.globalStore.userState(),
        (this.globalStore.featureFlags() as Record<string, unknown>)[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] ===
          true,
      ),
  );

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const result: ICasesDraftCasefileResolved | undefined = data['draftCasefile'];
      this.resolved.set(result ?? null);
      if (result) this.store.loadResolved(result);
    });
    afterNextRender(() => this.heading()?.nativeElement.focus());
    // Lost read authority is handled by the shell; this handles only retained-read Delete denial.
    effect(() => {
      if (this.eligible()) this.denialRequested = false;
      else if (this.readable() && !this.denialRequested) {
        this.denialRequested = true;
        void this.router
          .navigateByUrl('/error/permission-denied')
          .then((accepted) => {
            if (!accepted) this.showError();
          })
          .catch(() => this.showError());
      }
    });
  }

  private showError(): void {
    if (this.destroyRef.destroyed) return;
    this.globalStore.setBannerError({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
    this.utils.scrollToTop();
  }

  /** Returns to the checker dashboard without changing the saved casefile lifecycle. */
  public async handleReturn(): Promise<void> {
    if (this.destroyRef.destroyed || !this.eligible() || this.navigating()) return;
    this.globalStore.resetBannerError();
    this.navigating.set(true);
    try {
      const accepted = await this.router.navigateByUrl(this.navigation.persistedDashboardUrl('checker'));
      if (!accepted) this.showError();
    } catch {
      this.showError();
    } finally {
      this.navigating.set(false);
    }
  }
}
