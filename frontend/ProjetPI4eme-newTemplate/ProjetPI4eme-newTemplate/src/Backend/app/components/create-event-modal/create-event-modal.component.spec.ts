import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EventAdminApiService } from '../../core/events/event-admin-api.service';
import { CreateEventModalComponent } from './create-event-modal.component';

describe('CreateEventModalComponent', () => {
  let component: CreateEventModalComponent;
  let fixture: ComponentFixture<CreateEventModalComponent>;

  const eventsApiMock = {
    optimizeSchedule: () => of([]),
    getVenueSuggestions: () => of([]),
    getVenueAvailableTimes: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEventModalComponent],
      providers: [{ provide: EventAdminApiService, useValue: eventsApiMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateEventModalComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    component.ngOnChanges();
    fixture.detectChanges();
  });

  it('should mark form invalid when required fields are missing', () => {
    component.form.title = '';
    component.form.category = '';

    expect(component.isFormValid).toBeFalsy();
  });

  it('should emit create online event payload when form is valid', () => {
    let emitted: any = null;
    component.onSubmit.subscribe((value) => {
      emitted = value;
    });

    component.form.title = 'Angular Testing Workshop';
    component.form.category = 'Workshop';
    component.form.type = 'ONLINE';
    component.form.description = 'A practical session';
    component.startDatePart = '2026-07-15';
    component.startTimePart = '09:00';
    component.endTimePart = '11:00';
    component.updateStartDateTime();
    component.updateEndDateTime();

    component.handleSubmit();

    expect(emitted).toBeTruthy();
    expect(emitted.mode).toBe('create');
    expect(emitted.type).toBe('ONLINE');
    expect(emitted.data.title).toBe('Angular Testing Workshop');
  });

  it('should reject non-image upload', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const fakeFile = new File(['hello'], 'note.txt', { type: 'text/plain' });
    const evt = { target: { files: [fakeFile] } };

    component.onImageFileSelected(evt);

    expect(alertSpy).toHaveBeenCalled();
    expect(component.form.imageUrl).toBe('');
    alertSpy.mockRestore();
  });
});
