import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  RESPONDENT_ACCOUNT_ROUTE,
  type RespondentAccountActionInfo,
  respondentAccountReturnFragment,
  respondentAccountTab,
} from '../../routing/cases-account-respondent-navigation';

const commentHeadings = {
  add: 'Add comment',
  change: 'Change comment',
};

@Component({
  selector: 'app-respondent-account-action-placeholder',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="govuk-grid-column-two-thirds">
      <h1 class="govuk-heading-xl" #headingElement tabindex="-1">{{ heading }}</h1>
      <a
        class="govuk-link"
        id="respondent-account-placeholder-cancel"
        [routerLink]="details()"
        [fragment]="returnFragment"
        >Cancel</a
      >
    </div>
  `,
})
export class RespondentAccountActionPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly navigation = inject(Router).currentNavigation();
  private readonly title = inject(Title);
  private readonly headingElement = viewChild.required<ElementRef<HTMLHeadingElement>>('headingElement');
  // Initial navigation can also receive history state after a reload.
  private readonly info = (this.navigation?.trigger === 'popstate'
    ? this.navigation.extras.state
    : this.navigation?.extras.info) as Partial<RespondentAccountActionInfo> | undefined;
  private readonly action = this.route.snapshot.data['actionHeading'] as string;
  private readonly comment = this.route.snapshot.data['comment'] === true ? this.info?.comment : undefined;
  private readonly commentHeading =
    this.comment === 'add' || this.comment === 'change' ? commentHeadings[this.comment] : undefined;
  private readonly accountId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => params.get('respondentAccountId'))),
    { initialValue: this.route.parent!.snapshot.paramMap.get('respondentAccountId') },
  );
  readonly heading = this.commentHeading ?? this.action;
  readonly details = computed(() => [RESPONDENT_ACCOUNT_ROUTE, this.accountId(), 'details']);
  readonly returnFragment = respondentAccountReturnFragment(respondentAccountTab(this.info?.returnTab));

  constructor() {
    afterNextRender(() => {
      this.headingElement().nativeElement.focus();
      if (this.commentHeading) this.title.setTitle(`OPAL - ${this.commentHeading}`);
    });
  }
}
