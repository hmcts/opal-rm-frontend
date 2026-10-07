import type { CasesDraftAllRejectedPlaceholderKind } from '../types/cases-draft-all-rejected-placeholder-kind.type';
import type { ICasesDraftAllRejectedSelection } from '../interfaces/cases-draft-all-rejected-selection.interface';
import type { ICasesDraftAllRejectedPlaceholderContext } from '../interfaces/cases-draft-all-rejected-placeholder-context.interface';
import type { ICasesDraftResubmissionSuccess } from '../interfaces/cases-draft-resubmission-success.interface';
import {
  defaultAllRejectedSelection,
  validAllRejectedSelection,
  decodeAllRejectedSuccess,
} from '../utils/cases-draft-all-rejected';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../../cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS } from '../routing/constants/cases-draft-checker-routing-paths.constant';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import { CASES_DRAFT_ROUTING_PATHS } from '../routing/constants/cases-draft-routing-paths.constant';
import { resolveCasesDraftIdentity, sameCasesDraftIdentity } from '../utils/cases-draft-identity';
import { defaultCasesDraftNavigation } from '../utils/cases-draft-navigation';

/** In-memory navigation metadata scoped to the dashboard mode and authorised user. */
@Injectable({ providedIn: 'root' })
export class CasesDraftNavigationService {
  private readonly router = inject(Router);
  private readonly globalStore = inject(GlobalStore);
  private readonly mode = inject(CASES_DRAFT_DASHBOARD_MODE);
  private readonly routes = this.mode === 'checker' ? CASES_DRAFT_CHECKER_ROUTING_PATHS : CASES_DRAFT_ROUTING_PATHS;
  private readonly current = signal<ICasesDraftNavigation>(defaultCasesDraftNavigation(undefined, this.mode));
  private readonly createOrigin = signal<ICasesDraftNavigation | null>(null);
  // Seed from the live identity so the first effect preserves valid local table state.
  private previousIdentity = this.authorisedIdentity();

  private readonly allRejectedScope = signal<ICasesDraftIdentity | null>(
    this.mode === 'inputter' ? this.authorisedIdentity() : null,
  );
  private readonly rejectedSelection = signal<ICasesDraftAllRejectedSelection>(defaultAllRejectedSelection());
  private readonly rejectedDashboardOrigin = signal<ICasesDraftNavigation | null>(null);
  private readonly rejectedSuccess = signal<ICasesDraftResubmissionSuccess | null>(null);
  private readonly rejectedPlaceholder = signal<ICasesDraftAllRejectedPlaceholderContext | null>(null);
  private allRejectedNavigationOperation = 0;

  public readonly selection = this.current.asReadonly();
  public readonly allRejectedSelection = computed(() =>
    this.currentAllRejectedIdentity() ? this.rejectedSelection() : defaultAllRejectedSelection(),
  );

  constructor() {
    effect(() => {
      const identity = this.authorisedIdentity();
      if (!identity || !this.sameIdentity(identity, this.previousIdentity)) {
        this.current.set(defaultCasesDraftNavigation(undefined, this.mode));
        this.createOrigin.set(null);
        this.resetAllRejected(this.mode === 'inputter' ? identity : null);
      }
      this.previousIdentity = identity;
    });
  }

  private currentAllRejectedIdentity(): ICasesDraftIdentity | null {
    const identity = this.mode === 'inputter' ? this.authorisedIdentity() : null;
    return identity && sameCasesDraftIdentity(identity, this.allRejectedScope()) ? identity : null;
  }

  private resetAllRejected(identity: ICasesDraftIdentity | null): void {
    this.allRejectedNavigationOperation++;
    this.allRejectedScope.set(identity);
    this.rejectedSelection.set(defaultAllRejectedSelection());
    this.rejectedDashboardOrigin.set(null);
    this.rejectedSuccess.set(null);
    this.rejectedPlaceholder.set(null);
  }

  private liveAllRejectedScope(): ICasesDraftIdentity | null {
    const identity = this.mode === 'inputter' ? this.authorisedIdentity() : null;
    if (!sameCasesDraftIdentity(identity, this.allRejectedScope())) this.resetAllRejected(identity);
    return identity;
  }

  /** Only the latest navigation in the live identity may finalise or roll back shared journey state. */
  private async navigateInAllRejectedScope(
    identity: ICasesDraftIdentity,
    url: UrlTree,
    settled: (accepted: boolean) => void,
  ): Promise<boolean> {
    const operation = ++this.allRejectedNavigationOperation;
    let accepted = false;
    try {
      accepted = await this.router.navigateByUrl(url);
      return accepted;
    } finally {
      if (
        operation === this.allRejectedNavigationOperation &&
        sameCasesDraftIdentity(identity, this.currentAllRejectedIdentity())
      )
        settled(accepted);
    }
  }

  private authorisedIdentity(): ICasesDraftIdentity | null {
    const flags: Record<string, unknown> = this.globalStore.featureFlags();
    const user = this.globalStore.userState();
    const authenticated = this.globalStore.authenticated();
    return authenticated
      ? resolveCasesDraftIdentity(user, flags[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] === true, this.mode)
      : null;
  }

  private sameIdentity(current: ICasesDraftIdentity, previous: ICasesDraftIdentity | null): boolean {
    return (
      current.userId === previous?.userId &&
      current.businessUnitId === previous.businessUnitId &&
      current.submittedBy === previous.submittedBy
    );
  }

  public setAllRejectedSelection(selection: ICasesDraftAllRejectedSelection): void {
    if (!this.liveAllRejectedScope() || !validAllRejectedSelection(selection)) return;
    this.rejectedSelection.set({ ...selection });
  }

  public rememberAllRejectedDashboardOrigin(): void {
    if (!this.liveAllRejectedScope()) return;
    const selection = this.selection();
    this.rejectedDashboardOrigin.set(
      selection.tab === 'rejected' ? { ...selection } : defaultCasesDraftNavigation('rejected'),
    );
  }

  public allRejectedDashboardUrl(): UrlTree {
    return this.dashboardUrl(
      this.currentAllRejectedIdentity()
        ? (this.rejectedDashboardOrigin() ?? defaultCasesDraftNavigation('rejected'))
        : defaultCasesDraftNavigation('rejected'),
    );
  }

  public allRejectedUrl(): UrlTree {
    return this.router.createUrlTree([
      '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.rejections,
    ]);
  }

  public allRejectedPlaceholderUrl(kind: CasesDraftAllRejectedPlaceholderKind, id: number): UrlTree {
    const url = this.placeholderUrl(kind, id);
    url.fragment = null;
    return url;
  }

  public contextForPlaceholder(kind: unknown, idText: string | null): ICasesDraftAllRejectedPlaceholderContext | null {
    const identity = this.currentAllRejectedIdentity();
    const context = this.rejectedPlaceholder();
    if (
      !identity ||
      !context ||
      !sameCasesDraftIdentity(identity, context.identity) ||
      (kind !== 'details' && kind !== 'amendment') ||
      !idText ||
      !/^[1-9]\d*$/.test(idText)
    )
      return null;
    const id = Number(idText);
    return Number.isSafeInteger(id) && context.kind === kind && context.id === id ? context : null;
  }

  public async navigateToAllRejected(): Promise<boolean> {
    const identity = this.liveAllRejectedScope();
    if (!identity) return false;
    const previous = this.rejectedDashboardOrigin();
    this.rememberAllRejectedDashboardOrigin();
    return this.navigateInAllRejectedScope(identity, this.allRejectedUrl(), (accepted) => {
      if (!accepted) this.rejectedDashboardOrigin.set(previous);
    });
  }

  public async navigateToPlaceholder(
    kind: CasesDraftAllRejectedPlaceholderKind,
    id: number,
    origin: 'dashboard' | 'all-rejected' = 'dashboard',
  ): Promise<boolean> {
    const identity = this.liveAllRejectedScope();
    if (!identity) return false;
    const url = origin === 'all-rejected' ? this.allRejectedPlaceholderUrl(kind, id) : this.placeholderUrl(kind, id);
    const previous = this.rejectedPlaceholder();
    this.rejectedPlaceholder.set(origin === 'all-rejected' ? { identity: { ...identity }, kind, id } : null);
    return this.navigateInAllRejectedScope(identity, url, (accepted) => {
      if (!accepted) this.rejectedPlaceholder.set(previous);
    });
  }

  public async returnFromPlaceholder(kind: unknown, idText: string | null): Promise<boolean> {
    const context = this.contextForPlaceholder(kind, idText);
    if (!context) return false;
    return this.navigateInAllRejectedScope(context.identity, this.allRejectedUrl(), (accepted) => {
      if (accepted) this.rejectedPlaceholder.set(null);
    });
  }

  public async returnFromAllRejected(): Promise<boolean> {
    const identity = this.liveAllRejectedScope();
    if (!identity) return false;
    const previous = { ...this.selection() };
    const target = this.rejectedDashboardOrigin() ?? defaultCasesDraftNavigation('rejected');
    this.setSelection(target);
    return this.navigateInAllRejectedScope(identity, this.dashboardUrl(target), (accepted) => {
      if (accepted) this.rejectedPlaceholder.set(null);
      else this.setSelection(previous);
    });
  }

  public recordAllRejectedResubmission(value: unknown): boolean {
    const success = decodeAllRejectedSuccess(value, this.liveAllRejectedScope());
    this.rejectedSuccess.set(success);
    return success !== null;
  }

  public consumeAllRejectedResubmission(): ICasesDraftResubmissionSuccess | null {
    const event = decodeAllRejectedSuccess(this.rejectedSuccess(), this.liveAllRejectedScope());
    this.rejectedSuccess.set(null);
    return event;
  }

  public clearAllRejectedSuccess(): void {
    this.rejectedSuccess.set(null);
  }

  public setSelection(selection: ICasesDraftNavigation): void {
    const { tab, page, sort, direction } = selection;
    this.current.set({ tab, page, sort, direction });
  }

  public dashboardUrl(selection = this.selection()): UrlTree {
    return this.router.createUrlTree(['/' + this.routes.root + '/' + this.routes.children.tabs], {
      fragment: selection.tab,
    });
  }

  /** Constructs only supported internal destinations with positive safe integer IDs. */
  public placeholderUrl(kind: 'details' | 'amendment' | 'rejections' | 'review' | 'view', id?: number): UrlTree {
    const selection = this.selection();
    let path: string;
    if (kind === 'rejections') {
      path = '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.rejections;
    } else {
      if (id === undefined || !Number.isSafeInteger(id) || id < 1) throw new Error('Invalid draft casefile identifier');
      if (kind === 'review' || kind === 'view') {
        path =
          '/' +
          CASES_DRAFT_CHECKER_ROUTING_PATHS.root +
          '/' +
          CASES_DRAFT_CHECKER_ROUTING_PATHS.children[kind] +
          '/' +
          id;
      } else {
        const child =
          kind === 'details'
            ? CASES_CREATE_CASEFILE_ROUTING_PATHS.children.checkCaseDetails
            : CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
        path = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + child + '/' + id;
      }
    }
    return this.router.createUrlTree([path], {
      fragment: selection.tab,
    });
  }

  public rememberCreateOrigin(): void {
    if (this.mode === 'inputter') this.createOrigin.set({ ...this.selection() });
  }

  public clearCreateOrigin(): void {
    this.createOrigin.set(null);
  }

  /** Restore the captured table state explicitly before navigating back from creation. */
  public prepareCreationReturn(): UrlTree {
    this.setSelection(this.createOrigin() ?? defaultCasesDraftNavigation(undefined, this.mode));
    return this.creationReturnUrl();
  }

  public creationReturnUrl(): UrlTree {
    return this.dashboardUrl(this.createOrigin() ?? defaultCasesDraftNavigation(undefined, this.mode));
  }
}
