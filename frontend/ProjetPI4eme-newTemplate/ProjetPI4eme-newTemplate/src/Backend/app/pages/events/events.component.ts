import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarComponent } from '../../components/calendar/calendar.component';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { CreateEventModalComponent } from '../../components/create-event-modal/create-event-modal.component';
import { CreateVenueModalComponent, VenueFormData } from '../../components/create-venue-modal/create-venue-modal.component';
import { AppTabsComponent, Tab } from '../../components/ui/tabs.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

import {
  CreateOnlineEventRequest,
  CreateOnsiteEventRequest,
  EventAdminApiService,
  EventDto
} from '../../core/events/event-admin-api.service';
import { CreateVenueRequest, VenueAdminApiService, VenueDto } from '../../core/events/venue-admin-api.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
  CommonModule,
  FormsModule,
  CalendarComponent,
  CreateEventModalComponent,
  CreateVenueModalComponent,
  PaginationComponent
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent {
  private readonly eventsApi = inject(EventAdminApiService);
  private readonly venuesApi = inject(VenueAdminApiService);

  activeTab = signal('events');
  
  tabs: Tab[] = [
    { id: 'events', label: 'Events' },
    { id: 'venues', label: 'Venues' },
    { id: 'analytics', label: 'Analytics' }
  ];

  isEventModalOpen = signal(false);
  isVenueModalOpen = signal(false);

  loading = signal(false);
  error = signal<string | null>(null);

  events = signal<EventDto[]>([]);
  venues = signal<VenueDto[]>([]);

  // Pagination for Events
  eventsPage = signal(1);
  eventsPageSize = 5;
  eventsPageCount = computed(() => Math.max(1, Math.ceil(this.filteredEvents().length / this.eventsPageSize)));
  pagedEvents = computed(() => {
    const start = (this.eventsPage() - 1) * this.eventsPageSize;
    return this.filteredEvents().slice(start, start + this.eventsPageSize);
  });
  setEventsPage(page: number): void {
    this.eventsPage.set(Math.min(Math.max(1, page), this.eventsPageCount()));
  }

  
  venuesPage = signal(1);
  venuesPageSize = 2;
  venuesPageCount = computed(() => Math.max(1, Math.ceil(this.venues().length / this.venuesPageSize)));
  pagedVenues = computed(() => {
    const start = (this.venuesPage() - 1) * this.venuesPageSize;
    return this.venues().slice(start, start + this.venuesPageSize);
  });
  setVenuesPage(page: number): void {
    this.venuesPage.set(Math.min(Math.max(1, page), this.venuesPageCount()));
  }

  selectedDate = signal<string | null>(null); 

  editingEvent = signal<EventDto | null>(null);
  editingVenue = signal<VenueDto | null>(null);

  searchQuery = signal('');
  levelFilter = signal('all');
  typeFilter = signal('all');

  totalEvents = computed(() => this.events().length);
  
  onlineEvents = computed(() => 
    this.events().filter(e => this.isOnlineEvent(e)).length
  );
  
  onsiteEvents = computed(() => 
    this.events().filter(e => this.isOnsiteEvent(e)).length
  );
  
  totalVenues = computed(() => this.venues().length);

  isOnlineEvent(event: EventDto): event is import('../../core/events/event-admin-api.service').OnlineEventDto {
    return event.type === 'ONLINE' || 'meetingUrl' in event;
  }

  isOnsiteEvent(event: EventDto): event is import('../../core/events/event-admin-api.service').OnsiteEventDto {
    return event.type === 'ONSITE' || 'venueName' in event;
  }

  editingVenueFormData = computed(() => {
    const v = this.editingVenue();
    if (!v) return null;
    return {
      name: v.name,
      address: v.address,
      city: v.city ?? undefined,
      country: v.country ?? undefined,
      postalCode: v.postalCode ?? undefined,
      capacity: v.capacity ?? null,
      imageUrl: v.imageUrl ?? undefined,
      equipmentCsv: (v.equipment ?? []).join(', '),
      venueType: v.venueType ?? undefined,
      maxParticipants: v.maxParticipants ?? null,
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null
    };
  });

  markers = computed(() => {
    const map: Record<string, number> = {};
    for (const e of this.events()) {
      const key = (e.startDate ?? '').slice(0, 10);
      if (!key) continue;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  });

  filteredEvents = computed(() => {
    const all = [...this.events()].sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
    const key = this.selectedDate();
    const query = this.searchQuery().toLowerCase();
    const type = this.typeFilter();
    
    let filtered = all;
    
    
    if (key) {
      filtered = filtered.filter(e => (e.startDate ?? '').startsWith(key));
    }
    
    
    if (query) {
      filtered = filtered.filter(e => 
        (e.title ?? '').toLowerCase().includes(query) ||
        (e.description ?? '').toLowerCase().includes(query)
      );
    }
    
    
    if (type !== 'all') {
      filtered = filtered.filter(e => e.type === type.toUpperCase());
    }
    
    return filtered;
  });

  constructor() {
    this.refreshAll();
  }

  selectTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  refreshAll(): void {
    this.loading.set(true);
    this.error.set(null);

    this.eventsApi.listEvents().subscribe({
      next: (events) => this.events.set(events ?? []),
      error: () => this.error.set('Failed to load events.'),
      complete: () => this.loading.set(false)
    });

    this.venuesApi.listVenues().subscribe({
      next: (venues) => this.venues.set(venues ?? []),
      error: () => this.error.set('Failed to load venues.')
    });
  }

  onDateSelected(key: string): void {
    this.selectedDate.set(this.selectedDate() === key ? null : key);
  }

  openCreateEvent(): void {
    this.editingEvent.set(null);
    this.isEventModalOpen.set(true);
  }

  openEditEvent(event: EventDto): void {
    this.editingEvent.set(event);
    this.isEventModalOpen.set(true);
  }

  closeEventModal(): void {
    this.isEventModalOpen.set(false);
    this.editingEvent.set(null);
  }

  handleEventSubmit(payload: any): void {
    this.error.set(null);
    if (!payload) return;

    const done = () => {
      this.closeEventModal();
      this.refreshAll();
    };

    const handleError = (err: any) => {
      const message = err?.error?.message || 'An error occurred while processing your request';
      this.error.set(message);
      console.error('Event operation error:', err);
    };

    if (payload.mode === 'create' && payload.type === 'ONLINE') {
      this.eventsApi.createOnlineEvent(payload.data as CreateOnlineEventRequest).subscribe({ 
        next: done, 
        error: handleError 
      });
      return;
    }
    if (payload.mode === 'create' && payload.type === 'ONSITE') {
      this.eventsApi.createOnsiteEvent(payload.data as CreateOnsiteEventRequest).subscribe({ 
        next: done, 
        error: handleError 
      });
      return;
    }
    if (payload.mode === 'edit' && payload.type === 'ONLINE') {
      this.eventsApi.updateOnlineEvent(payload.id, payload.data as CreateOnlineEventRequest).subscribe({ 
        next: done, 
        error: handleError 
      });
      return;
    }
    if (payload.mode === 'edit' && payload.type === 'ONSITE') {
      this.eventsApi.updateOnsiteEvent(payload.id, payload.data as CreateOnsiteEventRequest).subscribe({ 
        next: done, 
        error: handleError 
      });
      return;
    }
  }

  deleteEvent(event: EventDto): void {
    if (!confirm(`Delete event "${event.title}"?`)) return;
    this.error.set(null);
    this.eventsApi.deleteEvent(event.id).subscribe({
      next: () => this.refreshAll(),
      error: (err: any) => {
        const message = err?.error?.message || 'Failed to delete event';
        this.error.set(message);
        console.error('Delete event error:', err);
      }
    });
  }

  openCreateVenue(): void {
    this.editingVenue.set(null);
    this.isVenueModalOpen.set(true);
  }

  openEditVenue(venue: VenueDto): void {
    this.editingVenue.set(venue);
    this.isVenueModalOpen.set(true);
  }

  closeVenueModal(): void {
    this.isVenueModalOpen.set(false);
    this.editingVenue.set(null);
  }

  handleVenueSubmit(data: VenueFormData): void {
    this.error.set(null);
    const equipment = (data.equipmentCsv ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const req: CreateVenueRequest = {
      name: data.name,
      address: data.address,
      city: data.city || undefined,
      country: data.country || undefined,
      postalCode: data.postalCode || undefined,
      capacity: data.capacity ?? null,
      imageUrl: data.imageUrl || undefined,
      equipment,
      venueType: data.venueType || undefined,
      maxParticipants: data.maxParticipants ?? undefined,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined
    };

    const handleError = (err: any) => {
      const message = err?.error?.message || 'An error occurred while processing your request';
      this.error.set(message);
      console.error('Venue operation error:', err);
    };

    const editing = this.editingVenue();
    if (editing) {
      this.venuesApi.updateVenue(editing.id, req).subscribe({
        next: () => {
          this.closeVenueModal();
          this.refreshAll();
        },
        error: handleError
      });
      return;
    }

    this.venuesApi.createVenue(req).subscribe({
      next: () => {
        this.closeVenueModal();
        this.refreshAll();
      },
      error: handleError
    });
  }

  deleteVenue(venue: VenueDto): void {
    if (!confirm(`Delete venue "${venue.name}"?`)) return;
    this.error.set(null);
    this.venuesApi.deleteVenue(venue.id).subscribe({
      next: () => this.refreshAll(),
      error: (err: any) => {
        const message = err?.error?.message || 'Failed to delete venue';
        this.error.set(message);
        console.error('Delete venue error:', err);
      }
    });
  }

  downloadAttendeesCsv(event: EventDto): void {
    this.error.set(null);
    this.eventsApi.exportAttendeesCsv(event.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `event-${event.id}-attendees.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        const message = err?.error?.message || 'Failed to download attendees CSV';
        this.error.set(message);
        console.error('CSV export error:', err);
      }
    });
  }
}
