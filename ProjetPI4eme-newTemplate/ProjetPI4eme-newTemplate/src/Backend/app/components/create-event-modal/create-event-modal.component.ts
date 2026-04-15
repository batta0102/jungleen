import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '../ui/modal.component';

interface EventData {
  title: string;
  type: 'Workshop' | 'Cultural' | 'Field Trip';
  date: string;
  time: string;
  location: string;
}

@Component({
  selector: 'app-create-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" [title]="'New Event'" (close)="close()">
      <form (ngSubmit)="handleSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text mb-2">Title</label>
          <input 
            type="text" 
            [(ngModel)]="formData.title" 
            name="title"
            class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Event title"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Type</label>
          <select 
            [(ngModel)]="formData.type" 
            name="type"
            class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="Workshop">Workshop</option>
            <option value="Cultural">Cultural</option>
            <option value="Field Trip">Field Trip</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text mb-2">Date</label>
            <input 
              type="date" 
              [(ngModel)]="formData.date" 
              name="date"
              class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text mb-2">Time</label>
            <input 
              type="time" 
              [(ngModel)]="formData.time" 
              name="time"
              class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Location</label>
          <input 
            type="text" 
            [(ngModel)]="formData.location" 
            name="location"
            class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Event location"
          />
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button 
            type="button" 
            (click)="close()"
            class="px-4 py-2 border border-border rounded-lg text-text hover:bg-light transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Create
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: []
})
export class CreateEventModalComponent {
  @Input() isOpen = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<EventData>();

  formData: EventData = {
    title: '',
    type: 'Workshop',
    date: '',
    time: '',
    location: ''
  };

  close(): void {
    this.onClose.emit();
    this.resetForm();
  }

  handleSubmit(): void {
    if (this.validate()) {
      this.onSubmit.emit(this.formData);
      this.resetForm();
      this.onClose.emit();
    }
  }

  private validate(): boolean {
    return !!(
      this.formData.title &&
      this.formData.date &&
      this.formData.time &&
      this.formData.location
    );
  }

  private resetForm(): void {
    this.formData = {
      title: '',
      type: 'Workshop',
      date: '',
      time: '',
      location: ''
    };
  }
}
