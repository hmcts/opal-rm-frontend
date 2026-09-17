import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { CasesCreateCasefileOrderTermRawValue } from '../types/cases-create-casefile-order-term-raw-value.type';

@Component({
  selector: 'app-cases-create-casefile-order-term-autocomplete',
  imports: [ReactiveFormsModule],
  templateUrl: './cases-create-casefile-order-term-autocomplete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(input)': 'handleInput($event)' },
})
export class CasesCreateCasefileOrderTermAutocompleteComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private displayedText = '';
  private displayedTextConfirmed = false;
  private observer: MutationObserver | null = null;
  private widget: { componentWillUnmount: () => void } | null = null;
  @ViewChild('autocomplete') private container?: ElementRef<HTMLElement>;
  @Input({ required: true }) public inputId!: string;
  @Input({ required: true }) public inputName!: string;
  @Input({ required: true }) public labelText!: string;
  @Input({ required: true }) public control!: FormControl<CasesCreateCasefileOrderTermRawValue>;
  @Input({ required: true }) public options!: { value: string; name: string }[];
  @Input() public hintText = '';
  @Input() public errors: string | null = null;
  @Input() public selectionConfirmed = false;
  @Output() public readonly textChanged = new EventEmitter<string>();
  @Output() public readonly optionSelected = new EventEmitter<string>();

  public constructor() {
    // The shared wrapper cannot escape suggestion HTML or disable confirmation on blur.
    afterNextRender(() => void this.initialiseAutocomplete());
    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
      // accessible-autocomplete 3.0.1 forwards this standard Preact ref. Its lifecycle
      // cleanup cancels the recurring input poll; the vanilla API has no destroy method.
      this.widget?.componentWillUnmount();
      this.widget = null;
      const container = this.container?.nativeElement;
      while (container?.firstChild) this.renderer.removeChild(container, container.firstChild);
    });
  }

  private async initialiseAutocomplete(): Promise<void> {
    const { default: autocomplete } = await import('accessible-autocomplete');
    if (this.destroyRef.destroyed || !this.container) return;
    const label = (option: { name: string } | string | undefined): string =>
      typeof option === 'string' ? option : (option?.name ?? '');
    const value = this.control.value;
    const selectedOption = this.selectionConfirmed ? this.options.find((option) => option.value === value) : undefined;
    this.displayedText = selectedOption?.name ?? (typeof value === 'string' ? value : '');
    this.displayedTextConfirmed = this.selectionConfirmed;
    autocomplete<{ value: string; name: string }>({
      element: this.container.nativeElement,
      id: `${this.inputId}-autocomplete`,
      name: `${this.inputName}-autocomplete`,
      defaultValue: this.displayedText,
      showAllValues: true,
      confirmOnBlur: false,
      source: (query, populate) => {
        // Speech tools can change .value without an input event. The widget's poll
        // reaches this callback, but ArrowDown also queries '' without editing text.
        const input = this.container?.nativeElement.querySelector<HTMLInputElement>('input[role="combobox"]');
        if (input && input.value !== this.displayedText) this.emitTextChange(input.value);
        populate(this.options.filter((option) => option.name.toLowerCase().includes(query.toLowerCase())));
      },
      templates: {
        inputValue: label,
        // Only the suggestion template is an HTML sink. Keep input text and option IDs intact.
        suggestion: (option) =>
          label(option)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;'),
      },
      onConfirm: (option) => {
        if (!this.destroyRef.destroyed && option && typeof option !== 'string') {
          this.displayedText = option.name;
          this.displayedTextConfirmed = true;
          this.optionSelected.emit(option.value);
        }
      },
      ref: (instance) => {
        this.widget = instance;
      },
    });
    this.observer = new MutationObserver(() => this.applyDescribedBy());
    this.observer.observe(this.container.nativeElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-describedby'],
    });
    this.applyDescribedBy();
  }

  private applyDescribedBy(): void {
    const input = this.container?.nativeElement.querySelector('input[role="combobox"]');
    if (!input) return;
    const hintId = `${this.inputId}-hint`;
    const errorId = `${this.inputId}-autocomplete-error-message`;
    const current = input.getAttribute('aria-describedby') ?? '';
    const ids = current.split(' ').filter((id) => id && id !== hintId && id !== errorId);
    if (this.hintText) ids.push(hintId);
    if (this.errors) ids.push(errorId);
    const next = [...new Set(ids)].join(' ');
    if (next !== current) this.renderer.setAttribute(input, 'aria-describedby', next);
  }

  private emitTextChange(value: string): void {
    if (value === this.displayedText && !this.displayedTextConfirmed) return;
    this.displayedText = value;
    this.displayedTextConfirmed = false;
    this.textChanged.emit(value);
  }

  public handleInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.id === `${this.inputId}-autocomplete`) {
      this.emitTextChange(target.value);
    }
  }

  public ngOnChanges(): void {
    this.applyDescribedBy();
  }
}
