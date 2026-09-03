import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-cases-create-casefile-character-count-textarea',
  imports: [ReactiveFormsModule],
  templateUrl: './cases-create-casefile-character-count-textarea.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCharacterCountTextareaComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly controlValue = signal('');
  private formControl!: FormControl<string | null>;

  @Input({ required: true }) public labelText!: string;
  @Input({ required: true }) public hintText!: string;
  @Input({ required: true }) public inputId!: string;
  @Input({ required: true }) public inputName!: string;
  @Input({ required: true }) public rows!: number;
  @Input({ required: true }) public maxCharacterLimit!: number;
  @Input() public errors: string | null = null;

  @Input({ required: true })
  public set control(control: FormControl<string | null>) {
    this.formControl = control;
    this.controlValue.set(control.value ?? '');
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.controlValue.set(value ?? ''));
  }

  public get control(): FormControl<string | null> {
    return this.formControl;
  }

  public readonly remainingCharacterCount = computed(() => this.maxCharacterLimit - this.controlValue().length);

  public get describedBy(): string {
    return [
      `${this.inputId}-hint`,
      `${this.inputId}-with-hint-info`,
      ...(this.errors ? [`${this.inputId}-error-message`] : []),
    ].join(' ');
  }
}
