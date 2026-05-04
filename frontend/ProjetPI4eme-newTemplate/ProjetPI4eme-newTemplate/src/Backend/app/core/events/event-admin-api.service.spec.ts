import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import {
  CreateOnlineEventRequest,
  CreateOnsiteEventRequest,
  EventAdminApiService
} from './event-admin-api.service';

describe('EventAdminApiService', () => {
  let service: EventAdminApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(EventAdminApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch events list', () => {
    service.listEvents().subscribe((events) => {
      expect(events.length).toBe(1);
      expect(events[0].title).toBe('Workshop');
    });

    const req = httpMock.expectOne('/api/events');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, title: 'Workshop', startDate: '2026-04-01T09:00:00', endDate: '2026-04-01T10:00:00', status: 'ACTIVE', type: 'ONLINE' }]);
  });

  it('should create online event with POST', () => {
    const payload: CreateOnlineEventRequest = {
      title: 'Online Session',
      startDate: '2026-06-01T10:00:00',
      endDate: '2026-06-01T11:00:00'
    };

    service.createOnlineEvent(payload).subscribe((res) => {
      expect(res.title).toBe('Online Session');
      expect(res.type).toBe('ONLINE');
    });

    const req = httpMock.expectOne('/api/events/online');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Online Session');
    req.flush({ id: 10, title: 'Online Session', startDate: payload.startDate, endDate: payload.endDate, status: 'ACTIVE', type: 'ONLINE' });
  });

  it('should create onsite event with POST', () => {
    const payload: CreateOnsiteEventRequest = {
      title: 'Onsite Session',
      startDate: '2026-06-02T10:00:00',
      endDate: '2026-06-02T11:00:00',
      venueName: 'Lab A',
      venueAddress: 'Campus'
    };

    service.createOnsiteEvent(payload).subscribe((res) => {
      expect(res.title).toBe('Onsite Session');
      expect(res.type).toBe('ONSITE');
    });

    const req = httpMock.expectOne('/api/events/onsite');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.venueName).toBe('Lab A');
    req.flush({ id: 11, title: 'Onsite Session', startDate: payload.startDate, endDate: payload.endDate, status: 'ACTIVE', type: 'ONSITE' });
  });

  it('should call delete endpoint', () => {
    service.deleteEvent(88).subscribe();

    const req = httpMock.expectOne('/api/events/88');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
