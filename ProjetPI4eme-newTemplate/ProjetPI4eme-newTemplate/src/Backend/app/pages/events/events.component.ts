import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../../components/calendar/calendar.component';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { CreateEventModalComponent } from '../../components/create-event-modal/create-event-modal.component';

interface EventData {
  title: string;
  type: 'Workshop' | 'Cultural' | 'Field Trip';
  date: string;
  time: string;
  location: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, CalendarComponent, EventCardComponent, CreateEventModalComponent],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent {
  isModalOpen = signal(false);
  
  events: { type: 'Workshop' | 'Cultural' | 'Field Trip'; title: string; date: string; time: string; location: string; status: 'Open' | 'Full'; buttonText: string }[] = [
    { type: 'Workshop', title: 'Calligraphy Workshop', date: 'October 15', time: '2:00 PM - 4:00 PM', location: 'Room 101', status: 'Open', buttonText: 'Registered (Cancel)' },
    { type: 'Cultural', title: 'Conference: Origins of Language', date: 'October 18', time: '6:00 PM - 8:00 PM', location: 'Auditorium A', status: 'Full', buttonText: 'Waitlist' },
    { type: 'Field Trip', title: 'Museum Visit', date: 'October 22', time: '9:00 AM - 12:00 PM', location: 'National Museum', status: 'Open', buttonText: 'Register' }
  ];

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  handleEventCreation(eventData: EventData): void {
    console.log('New event created:', eventData);
    // Add new event to the list
    const newEvent = {
      type: eventData.type,
      title: eventData.title,
      date: this.formatDateDisplay(eventData.date),
      time: this.formatTimeDisplay(eventData.time),
      location: eventData.location,
      status: 'Open' as const,
      buttonText: 'Register'
    };
    this.events.unshift(newEvent);
    this.closeModal();
  }

  private formatDateDisplay(dateStr: string): string {
    // Convert yyyy-mm-dd to Month DD format
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  private formatTimeDisplay(timeStr: string): string {
    // Convert HH:mm to HH:mm AM/PM format
    const [hours, minutes] = timeStr.split(':');
    const date = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}
