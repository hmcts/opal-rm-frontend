import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { AbstractFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-base';
import { GovukErrorSummaryComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-error-summary';
import {
  GovukRadioComponent,
  GovukRadiosItemComponent,
} from '@hmcts/opal-frontend-common/components/govuk/govuk-radio';
import type { CasesDraftCasefileDecision } from '../../types/cases-draft-casefile-decision.type';

const meaningfulReason: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };

@Component({
  selector: 'app-cases-draft-casefile-decision',
  imports: [ReactiveFormsModule, GovukErrorSummaryComponent, GovukRadioComponent, GovukRadiosItemComponent],
  templateUrl: './cases-draft-casefile-decision.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftCasefileDecisionComponent extends AbstractFormBaseComponent {
  private readonly injector = inject(Injector);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  protected override fieldErrors = {
    create_casefile_review_decision: { required: { message: 'Select a review decision', priority: 1 } },
    create_casefile_review_rejection_reason: {
      required: { message: 'Enter reason for rejection', priority: 1 },
      maxlength: { message: 'Reason for rejection must be 250 characters or fewer', priority: 2 },
    },
  };

  public readonly decisionEvent = output<CasesDraftCasefileDecision>();
  public override form = new FormGroup({
    create_casefile_review_decision: new FormControl<'approve' | 'reject' | null>(null, Validators.required),
    create_casefile_review_rejection_reason: new FormControl('', { nonNullable: true }),
  });
  public readonly reasonValue = signal('');
  public readonly reasonError = signal(false);
  public readonly reasonCountText = computed(() => {
    const remaining = 250 - this.reasonValue().length;
    const count = Math.abs(remaining);
    const noun = count === 1 ? 'character' : 'characters';
    const suffix = remaining < 0 ? 'too many' : 'remaining';
    return `You have ${count} ${noun} ${suffix}`;
  });
  public readonly reasonDescribedBy = computed(() => {
    const base = 'create_casefile_review_rejection_reason';
    const ids = [base + '-hint', base + '-count'];
    if (this.reasonError()) ids.push(base + '-error-message');
    return ids.join(' ');
  });

  constructor() {
    super();
    this.setInitialErrorMessages();
    const reason = this.form.controls.create_casefile_review_rejection_reason;
    reason.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.reasonValue.set(value));
    this.form.controls.create_casefile_review_decision.valueChanges.pipe(takeUntilDestroyed()).subscribe((decision) => {
      if (decision === 'reject') {
        reason.setValidators([meaningfulReason, Validators.maxLength(250)]);
      } else {
        reason.clearValidators();
        reason.reset('', { emitEvent: false });
        this.reasonValue.set('');
      }
      reason.updateValueAndValidity({ emitEvent: false });
      if (this.formErrorSummaryMessage.length) this.handleErrorMessages();
      this.reasonError.set(!!this.formControlErrorMessages['create_casefile_review_rejection_reason']);
    });
  }

  /** Emits validated future decision intent; persistence and navigation belong to the parent. */
  public handleContinue(): void {
    this.form.markAllAsTouched();
    this.handleErrorMessages();
    this.reasonError.set(!!this.formControlErrorMessages['create_casefile_review_rejection_reason']);
    if (this.form.invalid) {
      afterNextRender(() => this.element.nativeElement.querySelector<HTMLElement>('.govuk-error-summary')?.focus(), {
        injector: this.injector,
      });
      return;
    }
    const decision = this.form.controls.create_casefile_review_decision.value;
    if (decision === 'approve') {
      this.decisionEvent.emit({ decision, targetStatus: 'PUBLISHING_PENDING' });
    } else if (decision === 'reject') {
      this.decisionEvent.emit({
        decision,
        targetStatus: 'REJECTED',
        reason: this.form.controls.create_casefile_review_rejection_reason.value,
      });
    }
  }

  public override handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.handleContinue();
  }
}
