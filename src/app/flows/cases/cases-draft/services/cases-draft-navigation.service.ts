import { effect, inject, Injectable, signal } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../../cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import { CASES_DRAFT_ROUTING_PATHS } from '../routing/constants/cases-draft-routing-paths.constant';
import { resolveCasesDraftIdentity } from '../utils/cases-draft-identity';
import { defaultCasesDraftNavigation } from '../utils/cases-draft-navigation';

/** In-memory navigation metadata shared across draft and creation routes, scoped to the authorised user. */
@Injectable({ providedIn: 'root' })
export class CasesDraftNavigationService {
  private readonly router = inject(Router);
  private readonly globalStore = inject(GlobalStore);
  private readonly current = signal<ICasesDraftNavigation>(defaultCasesDraftNavigation());
  private readonly createOrigin = signal<ICasesDraftNavigation | null>(null);
  // Seed from the live identity so the first effect preserves valid local table state.
  private previousIdentity = this.authorisedIdentity();

  public readonly selection = this.current.asReadonly();

  constructor() {
    effect(() => {
      const identity = this.authorisedIdentity();
      if (!identity || !this.sameIdentity(identity, this.previousIdentity)) {
        this.current.set(defaultCasesDraftNavigation());
        this.createOrigin.set(null);
      }
      this.previousIdentity = identity;
    });
  }

  private authorisedIdentity(): ICasesDraftIdentity | null {
    const flags: Record<string, unknown> = this.globalStore.featureFlags();
    const user = this.globalStore.userState();
    const authenticated = this.globalStore.authenticated();
    return authenticated
      ? resolveCasesDraftIdentity(user, flags[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] === true)
      : null;
  }

  private sameIdentity(current: ICasesDraftIdentity, previous: ICasesDraftIdentity | null): boolean {
    return (
      current.userId === previous?.userId &&
      current.businessUnitId === previous.businessUnitId &&
      current.submittedBy === previous.submittedBy
    );
  }

  public setSelection(selection: ICasesDraftNavigation): void {
    const { tab, page, sort, direction } = selection;
    this.current.set({ tab, page, sort, direction });
  }

  public dashboardUrl(selection = this.selection()): UrlTree {
    return this.router.createUrlTree(
      ['/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.tabs],
      {
        fragment: selection.tab,
      },
    );
  }

  /** Constructs only supported internal destinations; details and amendment require a positive safe integer ID. */
  public placeholderUrl(kind: 'details' | 'amendment' | 'rejections', id?: number): UrlTree {
    const selection = this.selection();
    let path: string;
    if (kind === 'rejections') {
      path = '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.rejections;
    } else {
      if (id === undefined || !Number.isSafeInteger(id) || id < 1) throw new Error('Invalid draft casefile identifier');
      const child =
        kind === 'details'
          ? CASES_CREATE_CASEFILE_ROUTING_PATHS.children.checkCaseDetails
          : CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
      path = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + child + '/' + id;
    }
    return this.router.createUrlTree([path], {
      fragment: selection.tab,
    });
  }

  public rememberCreateOrigin(): void {
    this.createOrigin.set({ ...this.selection() });
  }

  public clearCreateOrigin(): void {
    this.createOrigin.set(null);
  }

  public creationReturnUrl(): UrlTree {
    return this.dashboardUrl(this.createOrigin() ?? defaultCasesDraftNavigation());
  }
}
