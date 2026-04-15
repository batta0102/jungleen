import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { EventModel } from '../data/models';

type BackendEventType = 'ONLINE' | 'ONSITE';

type BackendEventDto = {
  id: number;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  type: BackendEventType;
  meetingUrl?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  capacity?: number | null;
  currentAttendees?: number | null;
  category?: string | null;
};

export type TimeSlotDto = {
  startTime: string;
  endTime: string;
};

export type VenueSuggestionDto = {
  venueId: number;
  venueName: string;
  capacity: number;
  equipment: string[];
  availableTimeSlots: TimeSlotDto[];
  score: number;
};

export type OptimizeScheduleItem = {
  id?: number;
  title: string;
  eventType?: string;
  category?: string;
  startDate: string;
  endDate: string;
  venueId?: number;
  participants?: number;
  equipmentNeeded?: string[];
  highDemand?: boolean;
  participantPreference?: 'MORNING' | 'AFTERNOON' | 'EVENING';
};

export type OptimizedEventDto = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  venueId: number | null;
  venueName: string | null;
  reason: string;
};

@Injectable({ providedIn: 'root' })
export class EventApiService {
  private readonly http = inject(HttpClient);

  listEvents(): Observable<EventModel[]> {
    return this.http.get<BackendEventDto[]>('/api/events').pipe(map((rows) => rows.map((e) => this.mapEvent(e))));
  }

  registerForEvent(eventId: number, name: string, email: string, userId?: string): Observable<string> {
    return this.http.post(`/api/events/${eventId}/registrations`, { name, email, userId: userId || '' }, {
      responseType: 'text'
    });
  }

  listMyRegisteredEventIds(userId?: string, email?: string): Observable<number[]> {
    const params: string[] = [];
    if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
    if (email) params.push(`email=${encodeURIComponent(email)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<number[]>(`/api/events/registrations/mine${query}`);
  }

  getVenueAvailableTimes(venueId: number, from: string, to: string): Observable<TimeSlotDto[]> {
    const query = `venueId=${encodeURIComponent(String(venueId))}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    return this.http.get<TimeSlotDto[]>(`/api/venues/available-times?${query}`);
  }

  getVenueSuggestions(params: {
    eventType?: string;
    equipmentNeeded?: string[];
    participants?: number;
    from?: string;
    to?: string;
  }): Observable<VenueSuggestionDto[]> {
    const qp: string[] = [];
    if (params.eventType) qp.push(`eventType=${encodeURIComponent(params.eventType)}`);
    if (params.equipmentNeeded && params.equipmentNeeded.length) {
      qp.push(`equipmentNeeded=${encodeURIComponent(params.equipmentNeeded.join(','))}`);
    }
    if (params.participants != null) qp.push(`participants=${encodeURIComponent(String(params.participants))}`);
    if (params.from) qp.push(`from=${encodeURIComponent(params.from)}`);
    if (params.to) qp.push(`to=${encodeURIComponent(params.to)}`);

    const query = qp.length ? `?${qp.join('&')}` : '';
    return this.http.get<VenueSuggestionDto[]>(`/api/events/suggestions${query}`);
  }

  optimizeSchedule(items: OptimizeScheduleItem[]): Observable<OptimizedEventDto[]> {
    return this.http.post<OptimizedEventDto[]>('/api/events/optimize-schedule', { events: items });
  }

  private mapEvent(e: BackendEventDto): EventModel {
    const dateIso = (e.startDate ?? '').slice(0, 10);
    const startTime = (e.startDate ?? '').includes('T') ? (e.startDate.split('T')[1] ?? '').slice(0, 5) : '';
    const endTime = (e.endDate ?? '').includes('T') ? (e.endDate.split('T')[1] ?? '').slice(0, 5) : '';
    const timeLabel = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime;

    const location = e.type === 'ONLINE' ? 'Online' : (e.venueName || e.venueAddress || 'On-site');
    const priceValue = Number(e.price ?? 0);
    const isPaid = priceValue > 0;

    return {
      id: String(e.id),
      name: e.title,
      date: dateIso,
      time: timeLabel,
      location,
      eventType: e.type === 'ONLINE' ? 'online' : 'onsite',
      visibility: 'public',
      priceType: isPaid ? 'paid' : 'free',
      overview: e.description ?? '',
      image: e.imageUrl ?? undefined,
      price: isPaid ? priceValue : 0,
      maxCapacity: e.capacity ?? undefined,
      currentAttendees: e.currentAttendees ?? undefined,
      expectedOutcomes: [],
      schedule: [],
      category: e.category ?? undefined
    };
  }
}
