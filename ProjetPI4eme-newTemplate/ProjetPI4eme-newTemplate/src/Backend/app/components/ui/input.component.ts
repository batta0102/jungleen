import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="w-full">
      <label *ngIf="label" class="block text-sm font-medium text-text mb-2">
        {{ label }}
      </label>
      <input
        [type]="type"
        [placeholder]="placeholder"
        [readonly]="readonly"
        [disabled]="disabled"
        [value]="value"
        (input)="onInputChange($event)"
        class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:bg-light disabled:text-secondary"
      />
    </div>
  `,
  styles: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true
    }
  ]
})
export class AppInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: string = 'text';
  @Input() placeholder = '';
  @Input() readonly = false;
  @Input() disabled = false;
  @Input() value = '';

  onChange: any = () => {};
  onTouch: any = () => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(value: any): void {
    this.value = value;
  }

  onInputChange(event: any): void {
    this.value = event.target.value;
    this.onChange(this.value);
  }
}
