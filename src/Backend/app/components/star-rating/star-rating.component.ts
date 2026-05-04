import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Star Rating Input Component
 * Displays clickable stars (1-6) for rating input
 * Can be used with Angular Forms (supports ngModel and formControl)
 * 
 * @example
 * <app-star-rating [(ngModel)]="rating" [maxStars]="6" />
 */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: StarRatingComponent,
      multi: true
    }
  ]
})
export class StarRatingComponent implements ControlValueAccessor {
  @Input() maxStars = 6;
  @Input() disabled = false;
  @Input() readonly = false;
  @Output() ratingChange = new EventEmitter<number>();

  rating = signal(0);
  hoverRating = signal(0);

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  get stars(): number[] {
    return Array.from({ length: this.maxStars }, (_, i) => i + 1);
  }

  get displayRating(): number {
    return this.hoverRating() || this.rating();
  }

  setRating(value: number): void {
    if (this.disabled || this.readonly) return;
    
    this.rating.set(value);
    this.onChange(value);
    this.onTouched();
    this.ratingChange.emit(value);
  }

  setHoverRating(value: number): void {
    if (this.disabled || this.readonly) return;
    this.hoverRating.set(value);
  }

  clearHoverRating(): void {
    this.hoverRating.set(0);
  }

  // ControlValueAccessor implementation
  writeValue(value: number): void {
    this.rating.set(value || 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
