import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VenueDto {
	id: number;
	name: string;
	address: string;
	city?: string | null;
	country?: string | null;
	postalCode?: string | null;
	capacity?: number | null;
	imageUrl?: string | null;
	equipment?: string[];
	// New fields
	venueType?: string | null;
	maxParticipants?: number | null;
	latitude?: number | null;
	longitude?: number | null;
}

export interface CreateVenueRequest {
	name: string;
	address: string;
	city?: string;
	country?: string;
	postalCode?: string;
	capacity?: number | null;
	imageUrl?: string;
	equipment?: string[];
	// New fields
	venueType?: string;
	maxParticipants?: number;
	latitude?: number;
	longitude?: number;
}

export interface VenueAvailabilityInterval {
	start: string;
	end: string;
	eventTitle?: string;
	eventId?: number;
}

export interface VenueAvailabilityResponse {
	venueId: number;
	from: string;
	to: string;
	bookedIntervals: VenueAvailabilityInterval[];
	freeIntervals: VenueAvailabilityInterval[];
}

@Injectable({ providedIn: 'root' })
export class VenueAdminApiService {
	private readonly http = inject(HttpClient);

	listVenues(): Observable<VenueDto[]> {
		return this.http.get<VenueDto[]>('/api/venues');
	}

	createVenue(req: CreateVenueRequest): Observable<VenueDto> {
		return this.http.post<VenueDto>('/api/venues', req);
	}

	updateVenue(id: number, req: CreateVenueRequest): Observable<VenueDto> {
		return this.http.put<VenueDto>(`/api/venues/${id}`, req);
	}

	deleteVenue(id: number): Observable<void> {
		return this.http.delete<void>(`/api/venues/${id}`);
	}

	getVenueAvailability(id: number, fromIso: string, toIso: string): Observable<VenueAvailabilityResponse> {
		return this.http.get<VenueAvailabilityResponse>(`/api/venues/${id}/availability`, {
			params: {
				from: fromIso,
				to: toIso
			}
		});
	}
}
