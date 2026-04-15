import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AdminEventType = 'ONLINE' | 'ONSITE';

export interface BaseEventDto {
	id: number;
	title: string;
	description?: string | null;
	startDate: string; // ISO date-time
	endDate: string;   // ISO date-time
	status: string;
	type: AdminEventType;
	eventDiscriminator?: string;
	imageUrl?: string | null;
	price?: number | null;
	// New fields
	category?: string | null;
	maxParticipants?: number | null;
	enableWaitlist?: boolean | null;
	allowComments?: boolean | null;
	reminderEmails?: boolean | null;
	repeatEvent?: boolean | null;
	repeatFrequency?: string | null;
	repeatDays?: number[] | null;
}

export interface OnlineEventDto extends BaseEventDto {
	meetingUrl?: string | null;
}

export interface OnsiteEventDto extends BaseEventDto {
	venueName?: string | null;
	venueAddress?: string | null;
	capacity?: number | null;
	venue?: { id: number } | null;
}

export type EventDto = OnlineEventDto | OnsiteEventDto;

export interface CreateOnlineEventRequest {
	title: string;
	description?: string;
	startDate: string;
	endDate: string;
	meetingUrl?: string;
	imageUrl?: string;
	price?: number;
	// New fields
	category?: string;
	maxParticipants?: number;
	enableWaitlist?: boolean;
	allowComments?: boolean;
	reminderEmails?: boolean;
	repeatEvent?: boolean;
	repeatFrequency?: string;
	repeatDays?: number[];
}

export interface CreateOnsiteEventRequest {
	title: string;
	description?: string;
	startDate: string;
	endDate: string;
	venueName: string;
	venueAddress: string;
	capacity?: number | null;
	venueId?: number | null;
	imageUrl?: string;
	price?: number;
	requiredEquipment?: string[];
	eventType?: string;
	// New fields
	category?: string;
	maxParticipants?: number;
	enableWaitlist?: boolean;
	allowComments?: boolean;
	reminderEmails?: boolean;
	repeatEvent?: boolean;
	repeatFrequency?: string;
	repeatDays?: number[];
}

export interface TimeSlotDto {
	startTime: string;
	endTime: string;
}

export interface VenueSuggestionDto {
	venueId: number;
	venueName: string;
	capacity: number;
	equipment: string[];
	availableTimeSlots: TimeSlotDto[];
	score: number;
}

export interface OptimizeScheduleItem {
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
}

export interface OptimizedEventDto {
	id: number;
	title: string;
	startDate: string;
	endDate: string;
	venueId: number | null;
	venueName: string | null;
	reason: string;
}

@Injectable({ providedIn: 'root' })
export class EventAdminApiService {
	private readonly http = inject(HttpClient);

	listEvents(): Observable<EventDto[]> {
		return this.http.get<EventDto[]>('/api/events');
	}

	createOnlineEvent(req: CreateOnlineEventRequest): Observable<OnlineEventDto> {
		return this.http.post<OnlineEventDto>('/api/events/online', req);
	}

	createOnsiteEvent(req: CreateOnsiteEventRequest): Observable<OnsiteEventDto> {
		return this.http.post<OnsiteEventDto>('/api/events/onsite', req);
	}

	updateOnlineEvent(id: number, req: CreateOnlineEventRequest): Observable<OnlineEventDto> {
		return this.http.put<OnlineEventDto>(`/api/events/online/${id}`, req);
	}

	updateOnsiteEvent(id: number, req: CreateOnsiteEventRequest): Observable<OnsiteEventDto> {
		return this.http.put<OnsiteEventDto>(`/api/events/onsite/${id}`, req);
	}

	deleteEvent(id: number): Observable<void> {
		return this.http.delete<void>(`/api/events/${id}`);
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

	exportAttendeesCsv(id: number): Observable<Blob> {
		return this.http.get(`/api/events/${id}/attendees/export`, { responseType: 'blob' });
	}
}
