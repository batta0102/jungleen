import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape($event)'
  }
})
export class ModalComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('');

  readonly closed = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly lastActive = signal<HTMLElement | null>(null);

  constructor() {
    effect(() => {
      if (this.open()) this.afterOpen();
    });
  }

  onBackdropMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  onEscape(event: Event): void {
    if (!this.open()) return;
    event.preventDefault();
    this.close();
  }

  afterOpen(): void {
    this.lastActive.set(document.activeElement as HTMLElement);
    queueMicrotask(() => {
      const el = this.host.nativeElement.querySelector('[data-autofocus]') as HTMLElement | null;
      el?.focus();
    });
  }

  close(): void {
    this.closed.emit();
    queueMicrotask(() => this.lastActive()?.focus());
  }
}
