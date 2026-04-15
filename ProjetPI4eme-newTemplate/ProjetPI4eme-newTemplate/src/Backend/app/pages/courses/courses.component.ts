import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppEmptyStateComponent } from '../../components/ui/empty-state.component';
import { CourseCardComponent } from '../../components/course-card/course-card.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, AppEmptyStateComponent, CourseCardComponent],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class CoursesComponent {
  courses: { title: string; instructor: string; students: number; sessions: number; progress: number; status: 'Active' | 'Upcoming' | 'Completed' }[] = [
    { title: 'Introduction to Linguistics', instructor: 'Dr. Sarah Martin', students: 45, sessions: 12, progress: 75, status: 'Active' },
    { title: 'Advanced Phonetics', instructor: 'Prof. Jean Dubois', students: 28, sessions: 8, progress: 40, status: 'Active' },
    { title: 'Semantics and Pragmatics', instructor: 'Dr. Alice Chen', students: 32, sessions: 10, progress: 10, status: 'Upcoming' },
    { title: 'Historical Linguistics', instructor: 'Dr. Mark Lee', students: 18, sessions: 6, progress: 100, status: 'Completed' }
  ];
}
