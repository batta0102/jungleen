import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border-b border-border">
      <nav class="-mb-px flex space-x-8" role="tablist">
        <button
          *ngFor="let tab of tabs"
          (click)="selectTab(tab.id)"
          [class.border-primary]="activeTab === tab.id"
          [class.text-primary]="activeTab === tab.id"
          [class.border-transparent]="activeTab !== tab.id"
          [class.text-secondary]="activeTab !== tab.id"
          class="whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:border-border hover:text-text"
          [attr.aria-selected]="activeTab === tab.id"
          role="tab">
          {{ tab.label }}
        </button>
      </nav>
    </div>
  `,
  styles: []
})
export class AppTabsComponent {
  @Input() tabs: Tab[] = [];
  @Input() activeTab = '';
  @Output() onChange = new EventEmitter<string>();

  selectTab(tabId: string): void {
    this.onChange.emit(tabId);
  }
}
