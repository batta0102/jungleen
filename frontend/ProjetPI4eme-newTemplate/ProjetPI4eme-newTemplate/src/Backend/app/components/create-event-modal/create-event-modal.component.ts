import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '../ui/modal.component';

import {
  CreateOnlineEventRequest,
  CreateOnsiteEventRequest,
  EventDto,
  EventAdminApiService,
  OptimizedEventDto,
  TimeSlotDto,
  VenueSuggestionDto
} from '../../core/events/event-admin-api.service';
import { VenueDto } from '../../core/events/venue-admin-api.service';

type EventModalSubmit =
  | { mode: 'create'; type: 'ONLINE'; data: CreateOnlineEventRequest }
  | { mode: 'create'; type: 'ONSITE'; data: CreateOnsiteEventRequest }
  | { mode: 'edit'; id: number; type: 'ONLINE'; data: CreateOnlineEventRequest }
  | { mode: 'edit'; id: number; type: 'ONSITE'; data: CreateOnsiteEventRequest };

@Component({
  selector: 'app-create-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppModalComponent],
  template: `
    <app-modal [isOpen]="isOpen" [title]="title" (close)="close()" [maxWidth]="'550px'">
      <!-- Tab Navigation -->
      <div class="flex border-b border-border mb-6">
        <button 
          *ngFor="let tab of tabs"
          (click)="activeTab = tab.id"
          [class]="'px-4 py-2 text-sm font-medium transition-colors ' + 
            (activeTab === tab.id 
              ? 'text-primary border-b-2 border-primary -mb-px' 
              : 'text-secondary hover:text-text')"
        >
          {{ tab.label }}
        </button>
      </div>

      <form (ngSubmit)="handleSubmit()" class="space-y-5">
        <!-- Basics & Details Tab -->
        <div *ngIf="activeTab === 'basics'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text mb-1.5">Event Title *</label>
            <input 
              type="text" 
              [(ngModel)]="form.title" 
              name="title"
              class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="Event title"
            />
            <p *ngIf="touched && !form.title" class="mt-1 text-xs text-red-600">Title is required.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1.5">Category *</label>
            <select 
              [(ngModel)]="form.category" 
              name="category"
              class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
            >
              <option value="">Select category</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Conference">Conference</option>
              <option value="Training">Training</option>
              <option value="Webinar">Webinar</option>
              <option value="Meetup">Meetup</option>
              <option value="Social">Social</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1.5">Description</label>
            <textarea
              [(ngModel)]="form.description"
              name="description"
              rows="3"
              class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
              placeholder="Add description"
            ></textarea>
          </div>

          <!-- Event Type Toggle -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">Event Type</label>
            <div class="flex gap-2">
              <button 
                type="button"
                (click)="form.type = 'ONLINE'"
                [class]="'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ' +
                  (form.type === 'ONLINE' 
                    ? 'bg-primary/10 text-primary border-2 border-primary' 
                    : 'bg-light text-secondary border border-border hover:bg-gray-100')"
              >
                <span class="w-2 h-2 rounded-full" [class.bg-primary]="form.type === 'ONLINE'" [class.bg-gray-300]="form.type !== 'ONLINE'"></span>
                Online Event
              </button>
              <button 
                type="button"
                (click)="form.type = 'ONSITE'"
                [class]="'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ' +
                  (form.type === 'ONSITE' 
                    ? 'bg-primary/10 text-primary border-2 border-primary' 
                    : 'bg-light text-secondary border border-border hover:bg-gray-100')"
              >
                <span class="w-2 h-2 rounded-full" [class.bg-primary]="form.type === 'ONSITE'" [class.bg-gray-300]="form.type !== 'ONSITE'"></span>
                On-site Event
              </button>
            </div>
          </div>

          <!-- Venue Selection for Onsite -->
          <ng-container *ngIf="form.type === 'ONSITE'">
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Venue *</label>
              <select
                [(ngModel)]="form.venueId"
                name="venueId"
                (ngModelChange)="onOnsiteFieldChanged()"
                class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
              >
                <option [ngValue]="null">-- Select venue --</option>
                <option *ngFor="let v of venues" [ngValue]="v.id">{{ v.name }} ({{ v.address }})</option>
              </select>
              <p *ngIf="touched && form.type === 'ONSITE' && !form.venueId" class="mt-1 text-xs text-red-600">Venue is required.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Required Equipment</label>
              <input
                type="text"
                [(ngModel)]="form.requiredEquipmentCsv"
                name="requiredEquipmentCsv"
                (ngModelChange)="onOnsiteFieldChanged()"
                class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="projector, microphone, chairs"
              />
              <p class="mt-1 text-xs text-secondary">Comma-separated list used for venue matching.</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-text mb-1.5">Expected Participants</label>
                <input
                  type="number"
                  [(ngModel)]="form.capacity"
                  name="capacity"
                  (ngModelChange)="onOnsiteFieldChanged()"
                  class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  min="1"
                  placeholder="30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-text mb-1.5">Demand Priority</label>
                <label class="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    [(ngModel)]="form.highDemand"
                    name="highDemand"
                    (ngModelChange)="onOnsiteFieldChanged()"
                    class="w-4 h-4 text-primary border-border rounded"
                  />
                  <span class="text-sm text-text">High demand event</span>
                </label>
              </div>
            </div>
          </ng-container>

          <!-- Meeting URL for Online -->
          <ng-container *ngIf="form.type === 'ONLINE'">
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Meeting URL</label>
              <input
                type="url"
                [(ngModel)]="form.meetingUrl"
                name="meetingUrl"
                class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="https://..."
              />
            </div>
          </ng-container>

          <!-- Participation (Free/Paid) -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">Participation</label>
            <div class="flex gap-2">
              <button 
                type="button"
                (click)="form.isPaid = false"
                [class]="'px-6 py-2 rounded-lg text-sm font-medium transition-all ' +
                  (!form.isPaid 
                    ? 'bg-primary text-white' 
                    : 'bg-light text-secondary border border-border hover:bg-gray-100')"
              >
                Free
              </button>
              <button 
                type="button"
                (click)="form.isPaid = true"
                [class]="'px-6 py-2 rounded-lg text-sm font-medium transition-all ' +
                  (form.isPaid 
                    ? 'bg-primary text-white' 
                    : 'bg-light text-secondary border border-border hover:bg-gray-100')"
              >
                Paid
              </button>
            </div>
            <div *ngIf="form.isPaid" class="mt-3 flex items-center gap-2">
              <input
                type="number"
                [(ngModel)]="form.price"
                name="price"
                class="w-24 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
              <span class="text-sm text-secondary">EUR $</span>
            </div>
          </div>
        </div>

        <!-- Schedule Tab -->
        <div *ngIf="activeTab === 'schedule'" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-text mb-1.5">Start *</label>
            <div class="flex gap-2">
              <input 
                type="date" 
                [(ngModel)]="startDatePart" 
                name="startDatePart"
                (change)="updateStartDateTime(); onOnsiteFieldChanged()"
                class="flex-1 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <input 
                type="time" 
                [(ngModel)]="startTimePart" 
                name="startTimePart"
                (change)="updateStartDateTime(); onOnsiteFieldChanged()"
                class="w-28 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <input 
                type="time" 
                [(ngModel)]="endTimePart" 
                name="endTimePart"
                (change)="updateEndDateTime(); onOnsiteFieldChanged()"
                class="w-28 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <p *ngIf="calculatedDuration" class="mt-1.5 text-xs text-primary flex items-center gap-1">
              <span>⏱</span> Duration: {{ calculatedDuration }}
            </p>
          </div>

          <div *ngIf="form.type === 'ONSITE'" class="rounded-lg border border-border bg-light p-3 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-text">Dynamic Scheduling</h4>
              <button
                type="button"
                (click)="optimizeCurrentSchedule()"
                class="px-3 py-1.5 text-xs font-medium rounded bg-primary text-white hover:bg-opacity-90"
              >
                {{ optimizeLoading ? 'Optimizing...' : 'Optimize' }}
              </button>
            </div>

            <div *ngIf="schedulingError" class="text-xs text-red-600">{{ schedulingError }}</div>

            <div>
              <label class="block text-xs text-secondary mb-1">Preferred Time</label>
              <select
                [(ngModel)]="form.participantPreference"
                name="participantPreference"
                (ngModelChange)="onOnsiteFieldChanged()"
                class="w-full px-2 py-2 border border-border rounded text-sm bg-white"
              >
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
              </select>
            </div>

            <div>
              <p class="text-xs font-semibold text-text mb-1">Available Times (selected venue)</p>
              <p *ngIf="availabilityLoading" class="text-xs text-secondary">Loading available slots...</p>
              <ul *ngIf="!availabilityLoading && availableTimes.length" class="text-xs text-secondary space-y-1">
                <li *ngFor="let slot of availableTimes">{{ slot.startTime | date:'short' }} - {{ slot.endTime | date:'short' }}</li>
              </ul>
              <p *ngIf="!availabilityLoading && !availableTimes.length" class="text-xs text-secondary">No free slots found in selected range.</p>
            </div>

            <div>
              <p class="text-xs font-semibold text-text mb-1">Suggested Venues</p>
              <p *ngIf="suggestionLoading" class="text-xs text-secondary">Loading suggestions...</p>
              <div *ngIf="!suggestionLoading && venueSuggestions.length" class="space-y-1 text-xs">
                <div *ngFor="let suggestion of venueSuggestions.slice(0, 3)" class="flex items-center justify-between">
                  <span>{{ suggestion.venueName }} (cap: {{ suggestion.capacity }})</span>
                  <button
                    type="button"
                    (click)="form.venueId = suggestion.venueId; onOnsiteFieldChanged()"
                    class="px-2 py-1 rounded border border-border hover:bg-white"
                  >
                    Use
                  </button>
                </div>
              </div>
              <p *ngIf="!suggestionLoading && !venueSuggestions.length" class="text-xs text-secondary">No venue suggestion yet.</p>
            </div>

            <div *ngIf="optimizedPreview" class="rounded border border-primary/30 bg-white p-2 text-xs">
              <p class="font-semibold text-text">Optimization Preview</p>
              <p>Venue: {{ optimizedPreview.venueName || 'Unchanged' }}</p>
              <p>Start: {{ optimizedPreview.startDate | date:'short' }}</p>
              <p>End: {{ optimizedPreview.endDate | date:'short' }}</p>
              <p class="text-secondary">{{ optimizedPreview.reason }}</p>
              <button
                type="button"
                (click)="applyOptimizedPreview()"
                class="mt-2 px-2 py-1 rounded bg-primary text-white"
              >
                Apply Suggestion
              </button>
            </div>
          </div>

          <!-- Repeat Event -->
          <div class="pt-2">
            <label class="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                [(ngModel)]="form.repeatEvent" 
                name="repeatEvent"
                class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <span class="text-sm font-medium text-text">Repeat Event</span>
            </label>
          </div>

          <div *ngIf="form.repeatEvent" class="space-y-4 pl-7">
            <!-- Frequency Selection -->
            <div class="flex gap-3">
              <button 
                type="button"
                (click)="form.repeatFrequency = 'WEEKLY'"
                [class]="'px-4 py-1.5 rounded-lg text-sm font-medium transition-all ' +
                  (form.repeatFrequency === 'WEEKLY' 
                    ? 'bg-primary text-white' 
                    : 'bg-light text-secondary border border-border')"
              >
                Weekly
              </button>
              <button 
                type="button"
                (click)="form.repeatFrequency = 'MONTHLY'"
                [class]="'px-4 py-1.5 rounded-lg text-sm font-medium transition-all ' +
                  (form.repeatFrequency === 'MONTHLY' 
                    ? 'bg-primary text-white' 
                    : 'bg-light text-secondary border border-border')"
              >
                Monthly
              </button>
            </div>

            <!-- Day Selection -->
            <div class="flex gap-1">
              <button 
                *ngFor="let day of weekDays; let i = index"
                type="button"
                (click)="toggleRepeatDay(i)"
                [class]="'w-9 h-9 rounded-full text-xs font-medium transition-all ' +
                  (form.repeatDays.includes(i) 
                    ? 'bg-primary text-white' 
                    : 'bg-light text-secondary border border-border hover:bg-gray-100')"
              >
                {{ day }}
              </button>
            </div>

            <!-- Next Occurrence -->
            <p *ngIf="nextOccurrence" class="text-xs text-secondary flex items-center gap-1">
              <span>⏰</span> Next occurrence: {{ nextOccurrence }}
            </p>
          </div>

          <!-- Image in Schedule Tab (as per design) -->
          <div class="pt-4 border-t border-border">
            <label class="block text-sm font-medium text-text mb-2">Schedule</label>
            <div 
              class="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
              (click)="scheduleImageInput.click()"
            >
              <input 
                type="file"
                #scheduleImageInput
                (change)="onImageFileSelected($event)"
                accept="image/*"
                class="hidden"
              />
              <div *ngIf="!form.imageUrl" class="space-y-2">
                <p class="text-sm text-secondary">Drag & drop or</p>
                <button type="button" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                  Upload Image
                </button>
              </div>
              <div *ngIf="form.imageUrl" class="relative">
                <img [src]="form.imageUrl" alt="Event" class="w-full h-32 object-cover rounded-lg" />
                <button 
                  type="button" 
                  (click)="form.imageUrl = ''; $event.stopPropagation()"
                  class="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-secondary hover:text-red-500"
                >
                  ×
                </button>
                <div class="mt-2 text-xs text-white bg-black/60 py-1 px-2 rounded absolute bottom-2 left-2">
                  {{ form.title || 'Event preview' }}
                </div>
              </div>
            </div>
            <p class="mt-1.5 text-xs text-secondary">Recommended size: 1200x700px</p>
          </div>

          <!-- Afterweek info -->
          <div *ngIf="form.repeatEvent" class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2">
              <input type="checkbox" class="w-4 h-4 text-primary border-border rounded">
              <span class="text-secondary">Afterweek</span>
            </label>
            <span class="text-secondary">{{ getNextDate() }} ›</span>
          </div>
        </div>

        <!-- Media Tab -->
        <div *ngIf="activeTab === 'media'" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-text mb-2">Event Image</label>
            <div 
              class="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              (click)="mediaImageInput.click()"
            >
              <input 
                type="file"
                #mediaImageInput
                (change)="onImageFileSelected($event)"
                accept="image/*"
                class="hidden"
              />
              <div *ngIf="!form.imageUrl" class="space-y-3">
                <div class="w-12 h-12 mx-auto bg-light rounded-lg flex items-center justify-center">
                  <span class="text-2xl text-secondary">🖼️</span>
                </div>
                <p class="text-sm text-secondary">Drag & drop or</p>
                <button type="button" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                  Upload Image
                </button>
              </div>
              <div *ngIf="form.imageUrl" class="relative">
                <img [src]="form.imageUrl" alt="Event" class="w-full h-48 object-cover rounded-lg" />
                <button 
                  type="button" 
                  (click)="form.imageUrl = ''; $event.stopPropagation()"
                  class="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-secondary hover:text-red-500"
                >
                  ×
                </button>
                <div class="mt-2 text-sm text-white bg-black/60 py-1.5 px-3 rounded absolute bottom-3 left-3">
                  {{ form.title || 'Event preview' }}
                </div>
              </div>
            </div>
            <p class="mt-2 text-xs text-secondary">Recommended size: 1200x700px</p>
          </div>
        </div>

        <!-- Settings Tab -->
        <div *ngIf="activeTab === 'settings'" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-text mb-3">Engagement Features</label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-secondary mb-1">Max Participants</label>
                <input 
                  type="number" 
                  [(ngModel)]="form.maxParticipants" 
                  name="maxParticipants"
                  class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  min="0"
                  placeholder="50"
                />
              </div>
              <div class="flex flex-col justify-end">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="form.enableWaitlist" 
                    name="enableWaitlist"
                    class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span class="text-sm text-text">Enable Waitlist</span>
                </label>
              </div>
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="form.allowComments" 
                    name="allowComments"
                    class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span class="text-sm text-text">Allow Comments</span>
                </label>
              </div>
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="form.reminderEmails" 
                    name="reminderEmails"
                    class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span class="text-sm text-text">Reminder Emails</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Event Image in Settings (as per design) -->
          <div class="pt-4 border-t border-border">
            <label class="block text-sm font-medium text-text mb-2">Event Image</label>
            <div *ngIf="form.imageUrl" class="relative rounded-lg overflow-hidden">
              <img [src]="form.imageUrl" alt="Event" class="w-full h-40 object-cover" />
              <button 
                type="button" 
                (click)="form.imageUrl = ''"
                class="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-secondary hover:text-red-500"
              >
                ×
              </button>
              <div class="absolute bottom-3 left-3 text-sm text-white bg-black/60 py-1.5 px-3 rounded">
                {{ form.title || 'Event preview' }}
              </div>
            </div>
            <div *ngIf="!form.imageUrl" class="text-sm text-secondary">
              No image uploaded. Go to Media tab to upload.
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="mt-6 pt-4 border-t border-border flex justify-end gap-3">
          <button 
            type="button" 
            (click)="close()"
            class="px-5 py-2.5 border border-border rounded-lg text-text text-sm font-medium hover:bg-light transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            [disabled]="!isFormValid"
            [class]="'px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ' + 
              (isFormValid 
                ? 'bg-primary text-white hover:bg-opacity-90' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed')"
          >
            {{ submitLabel }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: []
})
export class CreateEventModalComponent {
  private readonly eventsApi = inject(EventAdminApiService);
  @Input() isOpen = false;
  @Input() event: EventDto | null = null;
  @Input() venues: VenueDto[] = [];

  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<EventModalSubmit>();

  touched = false;
  activeTab = 'basics';
  
  tabs = [
    { id: 'basics', label: 'Basics & Details' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'media', label: 'Media' },
    { id: 'settings', label: 'Settings' }
  ];

  weekDays = ['S', 'S', 'M', 'T', 'W', 'T', 'F'];

  suggestionLoading = false;
  availabilityLoading = false;
  optimizeLoading = false;
  schedulingError = '';

  venueSuggestions: VenueSuggestionDto[] = [];
  availableTimes: TimeSlotDto[] = [];
  optimizedPreview: OptimizedEventDto | null = null;
  private liveRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Separate date/time parts for better UX
  startDatePart = '';
  startTimePart = '10:00';
  endTimePart = '12:00';

  get title(): string {
    return this.event ? 'Edit Event' : 'Create Event';
  }

  get submitLabel(): string {
    return this.event ? 'Update' : 'Create Event';
  }

  get isFormValid(): boolean {
    // Basics tab validation
    if (!this.form.title?.trim()) return false;
    if (!this.form.category) return false;
    if (this.form.type === 'ONSITE' && !this.form.venueId) return false;
    if (this.form.isPaid && (!this.form.price || this.form.price <= 0)) return false;
    
    // Schedule tab validation
    if (!this.startDatePart) return false;
    if (!this.startTimePart) return false;
    if (!this.endTimePart) return false;
    
    return true;
  }

  get calculatedDuration(): string {
    if (!this.startTimePart || !this.endTimePart) return '';
    const [sh, sm] = this.startTimePart.split(':').map(Number);
    const [eh, em] = this.endTimePart.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins;
    if (diff <= 0) return '';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
  }

  get nextOccurrence(): string {
    if (!this.startDatePart || !this.form.repeatEvent) return '';
    const date = new Date(this.startDatePart);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  form: {
    title: string;
    description: string;
    type: 'ONLINE' | 'ONSITE';
    startDate: string;
    endDate: string;
    meetingUrl: string;
    venueId: number | null;
    capacity: number | null;
    imageUrl: string;
    isPaid: boolean;
    price: number | null;
    category: string;
    maxParticipants: number | null;
    enableWaitlist: boolean;
    allowComments: boolean;
    reminderEmails: boolean;
    repeatEvent: boolean;
    repeatFrequency: string;
    repeatDays: number[];
    requiredEquipmentCsv: string;
    participantPreference: 'MORNING' | 'AFTERNOON' | 'EVENING';
    highDemand: boolean;
  } = {
    title: '',
    description: '',
    type: 'ONLINE',
    startDate: '',
    endDate: '',
    meetingUrl: '',
    venueId: null,
    capacity: null,
    imageUrl: '',
    isPaid: false,
    price: null,
    category: '',
    maxParticipants: null,
    enableWaitlist: false,
    allowComments: true,
    reminderEmails: true,
    repeatEvent: false,
    repeatFrequency: 'WEEKLY',
    repeatDays: [],
    requiredEquipmentCsv: '',
    participantPreference: 'MORNING',
    highDemand: false
  };

  ngOnChanges(): void {
    if (!this.isOpen) return;
    this.touched = false;
    this.activeTab = 'basics';

    const draft = this.loadDraft();
    if (!this.event && draft) {
      this.form = draft;
      this.extractDateTimeParts();
      return;
    }

    if (this.event) {
      this.form = {
        title: this.event.title ?? '',
        description: (this.event.description ?? '') as string,
        type: this.event.type,
        startDate: this.toDatetimeLocal(this.event.startDate),
        endDate: this.toDatetimeLocal(this.event.endDate),
        meetingUrl: (this.event as any).meetingUrl ?? '',
        venueId: (this.event as any).venue?.id ?? null,
        capacity: (this.event as any).capacity ?? null,
        imageUrl: (this.event as any).imageUrl ?? '',
        isPaid: (this.event as any).price ? (this.event as any).price > 0 : false,
        price: (this.event as any).price ?? null,
        category: (this.event as any).category ?? '',
        maxParticipants: (this.event as any).maxParticipants ?? null,
        enableWaitlist: (this.event as any).enableWaitlist ?? false,
        allowComments: (this.event as any).allowComments ?? true,
        reminderEmails: (this.event as any).reminderEmails ?? true,
        repeatEvent: (this.event as any).repeatEvent ?? false,
        repeatFrequency: (this.event as any).repeatFrequency ?? 'WEEKLY',
        repeatDays: (this.event as any).repeatDays ?? [],
        requiredEquipmentCsv: ((this.event as any).requiredEquipment ?? []).join(', '),
        participantPreference: 'MORNING',
        highDemand: false
      };
      this.extractDateTimeParts();
      this.queueLiveSchedulingRefresh();
      return;
    }

    this.resetForm();
  }

  extractDateTimeParts(): void {
    if (this.form.startDate) {
      const [datePart, timePart] = this.form.startDate.split('T');
      this.startDatePart = datePart;
      this.startTimePart = timePart || '10:00';
    }
    if (this.form.endDate) {
      const [, timePart] = this.form.endDate.split('T');
      this.endTimePart = timePart || '12:00';
    }
  }

  updateStartDateTime(): void {
    if (this.startDatePart && this.startTimePart) {
      this.form.startDate = `${this.startDatePart}T${this.startTimePart}`;
    }
    this.updateEndDateTime();
    this.queueLiveSchedulingRefresh();
  }

  updateEndDateTime(): void {
    if (this.startDatePart && this.endTimePart) {
      this.form.endDate = `${this.startDatePart}T${this.endTimePart}`;
    }
    this.queueLiveSchedulingRefresh();
  }

  toggleRepeatDay(day: number): void {
    const idx = this.form.repeatDays.indexOf(day);
    if (idx === -1) {
      this.form.repeatDays.push(day);
    } else {
      this.form.repeatDays.splice(idx, 1);
    }
  }

  getNextDate(): string {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  close(): void {
    this.onClose.emit();
    this.resetForm();
  }

  handleSubmit(): void {
    this.touched = true;
    this.saveDraft();
    if (!this.validate()) return;

    if (this.form.type === 'ONLINE') {
      const payload: CreateOnlineEventRequest = {
        title: this.form.title,
        description: this.form.description || undefined,
        startDate: this.fromDatetimeLocal(this.form.startDate),
        endDate: this.fromDatetimeLocal(this.form.endDate),
        meetingUrl: this.form.meetingUrl || undefined,
        imageUrl: this.form.imageUrl || undefined,
        price: this.form.isPaid ? this.form.price ?? undefined : undefined,
        category: this.form.category || undefined,
        maxParticipants: this.form.maxParticipants ?? undefined,
        enableWaitlist: this.form.enableWaitlist,
        allowComments: this.form.allowComments,
        reminderEmails: this.form.reminderEmails,
        repeatEvent: this.form.repeatEvent,
        repeatFrequency: this.form.repeatEvent ? this.form.repeatFrequency : undefined,
        repeatDays: this.form.repeatEvent ? this.form.repeatDays : undefined
      };
      if (this.event) {
        this.onSubmit.emit({ mode: 'edit', id: this.event.id, type: 'ONLINE', data: payload });
      } else {
        this.onSubmit.emit({ mode: 'create', type: 'ONLINE', data: payload });
      }
    } else {
      const venue = this.venues.find(v => v.id === this.form.venueId);
      const payload: CreateOnsiteEventRequest = {
        title: this.form.title,
        description: this.form.description || undefined,
        startDate: this.fromDatetimeLocal(this.form.startDate),
        endDate: this.fromDatetimeLocal(this.form.endDate),
        venueName: venue?.name ?? '',
        venueAddress: venue?.address ?? '',
        capacity: this.form.capacity ?? null,
        venueId: this.form.venueId,
        requiredEquipment: this.getRequiredEquipment(),
        eventType: this.form.category || undefined,
        imageUrl: this.form.imageUrl || undefined,
        price: this.form.isPaid ? this.form.price ?? undefined : undefined,
        category: this.form.category || undefined,
        maxParticipants: this.form.maxParticipants ?? undefined,
        enableWaitlist: this.form.enableWaitlist,
        allowComments: this.form.allowComments,
        reminderEmails: this.form.reminderEmails,
        repeatEvent: this.form.repeatEvent,
        repeatFrequency: this.form.repeatEvent ? this.form.repeatFrequency : undefined,
        repeatDays: this.form.repeatEvent ? this.form.repeatDays : undefined
      };
      if (this.event) {
        this.onSubmit.emit({ mode: 'edit', id: this.event.id, type: 'ONSITE', data: payload });
      } else {
        this.onSubmit.emit({ mode: 'create', type: 'ONSITE', data: payload });
      }
    }

    this.clearDraft();
    this.resetForm();
    this.onClose.emit();
  }

  onImageFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Compress image before storing
    this.compressImage(file, 800, 0.7).then((compressedBase64) => {
      this.form.imageUrl = compressedBase64;
    }).catch(() => {
      alert('Failed to process image');
    });
  }

  private compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale down if wider than maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  onImageError(): void {
    this.form.imageUrl = '';
  }

  private validate(): boolean {
    return this.isFormValid;
  }

  private resetForm(): void {
    this.form = {
      title: '',
      description: '',
      type: 'ONLINE',
      startDate: '',
      endDate: '',
      meetingUrl: '',
      venueId: null,
      capacity: null,
      imageUrl: '',
      isPaid: false,
      price: null,
      category: '',
      maxParticipants: null,
      enableWaitlist: false,
      allowComments: true,
      reminderEmails: true,
      repeatEvent: false,
      repeatFrequency: 'WEEKLY',
      repeatDays: [],
      requiredEquipmentCsv: '',
      participantPreference: 'MORNING',
      highDemand: false
    };
    this.touched = false;
    this.activeTab = 'basics';
    this.startDatePart = '';
    this.startTimePart = '10:00';
    this.endTimePart = '12:00';
    this.venueSuggestions = [];
    this.availableTimes = [];
    this.optimizedPreview = null;
    this.schedulingError = '';
  }

  onOnsiteFieldChanged(): void {
    this.queueLiveSchedulingRefresh();
  }

  optimizeCurrentSchedule(): void {
    if (this.form.type !== 'ONSITE') {
      this.optimizedPreview = null;
      return;
    }
    if (!this.form.startDate || !this.form.endDate) {
      return;
    }

    this.optimizeLoading = true;
    this.schedulingError = '';
    this.eventsApi.optimizeSchedule([
      {
        id: this.event?.id,
        title: this.form.title || 'Untitled Event',
        eventType: 'onsite',
        category: this.form.category || undefined,
        startDate: this.fromDatetimeLocal(this.form.startDate),
        endDate: this.fromDatetimeLocal(this.form.endDate),
        venueId: this.form.venueId ?? undefined,
        participants: this.form.capacity ?? this.form.maxParticipants ?? undefined,
        equipmentNeeded: this.getRequiredEquipment(),
        highDemand: this.form.highDemand,
        participantPreference: this.form.participantPreference
      }
    ]).subscribe({
      next: (rows) => {
        this.optimizedPreview = rows?.[0] ?? null;
        this.optimizeLoading = false;
      },
      error: (err) => {
        this.optimizeLoading = false;
        this.schedulingError = err?.error?.message || 'Failed to optimize schedule';
      }
    });
  }

  applyOptimizedPreview(): void {
    if (!this.optimizedPreview) {
      return;
    }
    const start = this.toDatetimeLocal(this.optimizedPreview.startDate);
    const end = this.toDatetimeLocal(this.optimizedPreview.endDate);
    this.form.startDate = start;
    this.form.endDate = end;
    this.extractDateTimeParts();
    if (this.optimizedPreview.venueId) {
      this.form.venueId = this.optimizedPreview.venueId;
    }
    this.queueLiveSchedulingRefresh();
  }

  private queueLiveSchedulingRefresh(): void {
    if (this.form.type !== 'ONSITE') {
      this.venueSuggestions = [];
      this.availableTimes = [];
      return;
    }
    if (this.liveRefreshTimer) {
      clearTimeout(this.liveRefreshTimer);
    }
    this.liveRefreshTimer = setTimeout(() => this.refreshSchedulingHints(), 350);
  }

  private refreshSchedulingHints(): void {
    if (this.form.type !== 'ONSITE' || !this.form.startDate || !this.form.endDate) {
      return;
    }

    this.schedulingError = '';
    this.suggestionLoading = true;
    this.eventsApi.getVenueSuggestions({
      eventType: 'onsite',
      equipmentNeeded: this.getRequiredEquipment(),
      participants: this.form.capacity ?? this.form.maxParticipants ?? undefined,
      from: this.fromDatetimeLocal(this.form.startDate),
      to: this.fromDatetimeLocal(this.form.endDate)
    }).subscribe({
      next: (rows) => {
        this.venueSuggestions = rows ?? [];
        this.suggestionLoading = false;
      },
      error: (err) => {
        this.suggestionLoading = false;
        this.schedulingError = err?.error?.message || 'Failed to load venue suggestions';
      }
    });

    if (!this.form.venueId) {
      this.availableTimes = [];
      return;
    }

    this.availabilityLoading = true;
    const from = this.fromDatetimeLocal(this.form.startDate);
    const to = this.fromDatetimeLocal(this.form.endDate);
    this.eventsApi.getVenueAvailableTimes(this.form.venueId, from, to).subscribe({
      next: (rows) => {
        this.availableTimes = rows ?? [];
        this.availabilityLoading = false;
      },
      error: (err) => {
        this.availabilityLoading = false;
        this.schedulingError = err?.error?.message || 'Failed to load venue availability';
      }
    });
  }

  private getRequiredEquipment(): string[] {
    return (this.form.requiredEquipmentCsv ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }

  private toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private fromDatetimeLocal(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toISOString();
  }

  private draftKey = 'admin-event-draft';

  private saveDraft(): void {
    try {
      if (this.event) return;
      localStorage.setItem(this.draftKey, JSON.stringify(this.form));
    } catch {
      // ignore
    }
  }

  private loadDraft(): any {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private clearDraft(): void {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {
      // ignore
    }
  }
}
