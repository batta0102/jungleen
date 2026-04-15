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
import { FormsModule } from '@angular/forms';
import { EventModel } from '../../core/data/models';

@Component({
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrl: './payment-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    '[class.open]': 'open()'
  }
})
export class PaymentModalComponent {
  readonly open = input<boolean>(false);
  readonly event = input<EventModel | null>(null);
  readonly isProcessing = input<boolean>(false);

  readonly paymentComplete = output<{ method: string; transactionId: string }>();
  readonly closed = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly lastActive = signal<HTMLElement | null>(null);

  readonly paymentMethod = signal<'card' | 'mobile'>('card');
  readonly cardName = signal('');
  readonly cardNumber = signal('');
  readonly cardExpiry = signal('');
  readonly cardCvv = signal('');
  readonly phoneNumber = signal('');
  readonly showPaymentForm = signal(true);
  readonly paymentError = signal('');

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
    this.resetForm();
    queueMicrotask(() => {
      const el = this.host.nativeElement.querySelector('[data-autofocus]') as HTMLElement | null;
      el?.focus();
    });
  }

  close(): void {
    this.closed.emit();
    this.resetForm();
    queueMicrotask(() => this.lastActive()?.focus());
  }

  resetForm(): void {
    this.cardName.set('');
    this.cardNumber.set('');
    this.cardExpiry.set('');
    this.cardCvv.set('');
    this.phoneNumber.set('');
    this.paymentError.set('');
    this.showPaymentForm.set(true);
    this.paymentMethod.set('card');
  }

  setPaymentMethod(method: 'card' | 'mobile'): void {
    this.paymentMethod.set(method);
    this.paymentError.set('');
  }

  formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  onCardNumberInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    target.value = this.formatCardNumber(target.value);
    this.cardNumber.set(target.value);
  }

  formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
      return digits.slice(0, 2) + '/' + digits.slice(2, 4);
    }
    return digits;
  }

  onExpiryInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    target.value = this.formatExpiry(target.value);
    this.cardExpiry.set(target.value);
  }

  onCvvInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    target.value = target.value.replace(/\D/g, '').slice(0, 4);
    this.cardCvv.set(target.value);
  }

  formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits;
  }

  onPhoneInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    target.value = this.formatPhoneNumber(target.value);
    this.phoneNumber.set(target.value);
  }

  validateCardForm(): boolean {
    if (!this.cardName().trim()) {
      this.paymentError.set('Please enter cardholder name');
      return false;
    }
    if (this.cardNumber().replace(/\s/g, '').length !== 16) {
      this.paymentError.set('Please enter a valid card number');
      return false;
    }
    if (!/^\d{2}\/\d{2}$/.test(this.cardExpiry())) {
      this.paymentError.set('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (this.cardCvv().length < 3) {
      this.paymentError.set('Please enter a valid CVV');
      return false;
    }
    return true;
  }

  validateMobileForm(): boolean {
    if (this.phoneNumber().length < 8) {
      this.paymentError.set('Please enter a valid phone number');
      return false;
    }
    return true;
  }

  processPayment(): void {
    if (this.paymentMethod() === 'card') {
      if (!this.validateCardForm()) return;
    } else {
      if (!this.validateMobileForm()) return;
    }

    this.showPaymentForm.set(false);
    this.paymentError.set('');

    // Simulate payment processing
    setTimeout(() => {
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.paymentComplete.emit({
        method: this.paymentMethod() === 'card' ? 'Card' : 'Mobile Payment',
        transactionId
      });
      this.close();
    }, 2000);
  }

  getEventPrice(): string {
    const event = this.event();
    if (!event) return '0';
    const price = event.price ?? 60;
    return price.toString();
  }
}
