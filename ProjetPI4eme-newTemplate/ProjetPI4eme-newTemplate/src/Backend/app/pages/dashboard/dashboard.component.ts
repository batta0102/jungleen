import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCardComponent } from '../../components/ui/card.component';
import { ModuleCardComponent } from '../../components/module-card/module-card.component';
import { CalendarComponent } from '../../components/calendar/calendar.component';
import { ActivityTimelineComponent } from '../../components/activity-timeline/activity-timeline.component';

interface ModuleData {
  title: string;
  description: string;
  icon: string;
  progress: number;
}

interface StatData {
  label: string;
  value: string;
  icon: string;
  trend: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AppCardComponent, ModuleCardComponent, CalendarComponent, ActivityTimelineComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  modules: ModuleData[] = [
    {
      title: 'Etymology & Origins',
      description: 'Explore the historical roots and evolution of language families.',
      icon: '🌍',
      progress: 75
    },
    {
      title: 'Phonetics Laboratory',
      description: 'Master pronunciation and sound patterns of speech.',
      icon: '🎤',
      progress: 42
    },
    {
      title: 'Syntactic Structures',
      description: 'Dive into grammatical frameworks and construction rules.',
      icon: '🏗️',
      progress: 12
    },
    {
      title: 'Semantic Analysis',
      description: 'Understand meaning and context in written communication.',
      icon: '📚',
      progress: 88
    },
    {
      title: 'Comparative Linguistics',
      description: 'Cross-language pattern recognition and reconstruction methods.',
      icon: '📄',
      progress: 5
    },
    {
      title: 'Academic Writing',
      description: 'Scholarly composition techniques for research papers.',
      icon: '✏️',
      progress: 30
    }
  ];

  stats: StatData[] = [
    {
      label: 'Active Courses',
      value: '12',
      icon: '📚',
      trend: '+2 this month'
    },
    {
      label: 'Enrolled Students',
      value: '1,247',
      icon: '👥',
      trend: '+89 this week'
    },
    {
      label: 'Success Rate',
      value: '94%',
      icon: '🏆',
      trend: '+3% vs last month'
    },
    {
      label: 'Learning Hours',
      value: '2,840',
      icon: '⏰',
      trend: 'This semester'
    }
  ];
  
  timeline = [
    { title: 'Module 1 Completed', desc: 'You completed the first module', time: '2 days ago' },
    { title: 'Quiz Passed', desc: 'Passed Intermediate Quiz', time: '1 week ago' },
    { title: 'Certificate Earned', desc: 'Certificate for Etymology module', time: '2 weeks ago' }
  ];

  getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
