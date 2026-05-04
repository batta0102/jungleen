import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppEmptyStateComponent } from '../../components/ui/empty-state.component';
import { ClubCardComponent } from '../../components/club-card/club-card.component';

@Component({
  selector: 'app-clubs',
  standalone: true,
  imports: [CommonModule, AppEmptyStateComponent, ClubCardComponent],
  templateUrl: './clubs.component.html',
  styleUrls: ['./clubs.component.scss']
})
export class ClubsComponent {
  clubs: { title: string; description: string; icon: string; members: string; location: string; color: 'blue' | 'green' | 'purple' | 'yellow' }[] = [
    {
      title: 'Polyglot Circle',
      description: 'Weekly language exchanges in 5 different languages.',
      icon: '👥',
      members: '128',
      location: 'Virtual',
      color: 'blue'
    },
    {
      title: 'Debate Club',
      description: 'Practice argumentation and advanced rhetoric.',
      icon: '👥',
      members: '64',
      location: 'Campus',
      color: 'green'
    }
  ];

  upcomingEvents = [
    { title: 'Polyglot Circle', time: 'Thursday 6pm' },
    { title: 'Debate Club', time: 'Tuesday 7pm' },
    { title: 'Writing Workshop', time: 'Monday 5pm' }
  ];

  recentActivities = [
    { title: 'Latin Roots', desc: 'Completed lesson 4.2', time: '2h ago' },
    { title: 'Phoneme Master', desc: 'Finished pronunciation drills', time: '5h ago' }
  ];
}
