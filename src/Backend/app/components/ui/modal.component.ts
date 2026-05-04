import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/40 backdrop-blur-sm p-4 md:p-0">
      <div class="relative w-full max-w-lg rounded-xl bg-surface shadow-2xl border border-border">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 class="font-serif text-xl font-semibold text-text">
            {{ title }}
          </h3>
          <button
            (click)="onClose()"
            class="rounded-lg p-1.5 text-secondary hover:bg-light hover:text-text transition-colors">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div *ngIf="showFooter" class="flex items-center justify-end space-x-3 border-t border-border bg-light px-6 py-4 rounded-b-xl">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AppModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() showFooter = false;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
