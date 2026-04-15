import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent {
  notifications = [
    { title: 'New message from instructor', body: 'Please check the new assignment.', time: '2h' },
    { title: 'Event reminder', body: 'Language Meetup starts tomorrow.', time: '1d' },
    { title: 'Course update', body: 'New materials added to Phonetics.', time: '3d' }
  ];

  getNotificationIcon(title: string): string {
    if (title.toLowerCase().includes('message')) return '💬';
    if (title.toLowerCase().includes('event')) return '📅';
    if (title.toLowerCase().includes('course')) return '📚';
    if (title.toLowerCase().includes('assignment')) return '📝';
    if (title.toLowerCase().includes('achievement')) return '🏆';
    return '🔔';
  }
}
