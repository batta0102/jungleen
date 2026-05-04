import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTabsComponent, type Tab } from '../../components/ui/tabs.component';
import { AppBadgeComponent } from '../../components/ui/badge.component';

interface Assessment {
  id: number;
  title: string;
  questions: number;
  duration: string;
  status: 'published' | 'draft';
  participants: number;
  avgScore: number;
}

interface Result {
  id: number;
  student: string;
  score: number;
}

@Component({
  selector: 'app-assessments',
  standalone: true,
  imports: [CommonModule, AppTabsComponent, AppBadgeComponent],
  templateUrl: './assessments.component.html',
  styleUrls: ['./assessments.component.scss']
})
export class AssessmentsComponent {
  activeTab = signal('quizzes');
  
  tabs: Tab[] = [
    { id: 'quizzes', label: 'My Quizzes' },
    { id: 'results', label: 'Results' },
    { id: 'statistics', label: 'Statistics' }
  ];

  assessments: Assessment[] = [
    {
      id: 1,
      title: 'Quiz: English Grammar',
      questions: 20,
      duration: '30 min',
      status: 'published',
      participants: 45,
      avgScore: 85
    },
    {
      id: 2,
      title: 'Vocabulary Test B2',
      questions: 50,
      duration: '60 min',
      status: 'draft',
      participants: 0,
      avgScore: 0
    },
    {
      id: 3,
      title: 'Listening Comprehension',
      questions: 15,
      duration: '45 min',
      status: 'published',
      participants: 32,
      avgScore: 72
    }
  ];

  results: Result[] = [
    { id: 1, student: 'Alice Martin', score: 95 },
    { id: 2, student: 'Thomas Dubois', score: 82 },
    { id: 3, student: 'Julie Leroy', score: 68 },
    { id: 4, student: 'Marc Petit', score: 88 }
  ];

  selectTab(tabId: string): void {
    this.activeTab.set(tabId);
  }
}

