import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-epingle-indicator',
  imports: [CommonModule],
  template: `
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-amber-600 text-lg">📌</span>
          <span class="font-medium text-amber-800">Messages épinglés</span>
        </div>
        <div class="text-sm text-amber-700">
          <span class="font-semibold">{{ currentPins }}</span> / 
          <span>{{ maxPins }}</span> épingles utilisées
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class EpingleIndicatorComponent {
  @Input() currentPins: number = 0;
  @Input() maxPins: number = 3;
}
