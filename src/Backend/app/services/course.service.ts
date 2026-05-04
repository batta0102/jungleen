import { Injectable, signal, computed } from '@angular/core';
import { Course, CourseCreate } from '../models/course.model';

/**
 * Shared in-memory store for Courses.
 * Used by Back office (/back/courses) for CRUD and by Front (/front/trainings) for display.
 * Later you can replace with HTTP calls to http://localhost:8085/courses
 */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly _courses = signal<Course[]>(this.getInitialCourses());

  readonly courses = this._courses.asReadonly();

  getAll(): Course[] {
    return this._courses();
  }

  getById(id: string): Course | undefined {
    return this._courses().find((c) => c.id === id);
  }

  create(dto: CourseCreate): Course {
    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const course: Course = { ...dto, id };
    this._courses.update((list) => [...list, course]);
    return course;
  }

  update(id: string, dto: Partial<CourseCreate>): Course | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;
    const updated: Course = { ...existing, ...dto };
    this._courses.update((list) => list.map((c) => (c.id === id ? updated : c)));
    return updated;
  }

  delete(id: string): boolean {
    const exists = this.getById(id);
    if (!exists) return false;
    this._courses.update((list) => list.filter((c) => c.id !== id));
    return true;
  }

  private getInitialCourses(): Course[] {
    return [
      {
        id: 'c-1',
        title: 'Introduction to Linguistics',
        instructor: 'Dr. Sarah Martin',
        students: 45,
        sessions: 12,
        progress: 75,
        status: 'Active'
      },
      {
        id: 'c-2',
        title: 'Advanced Phonetics',
        instructor: 'Prof. Jean Dubois',
        students: 28,
        sessions: 8,
        progress: 40,
        status: 'Active'
      },
      {
        id: 'c-3',
        title: 'Semantics and Pragmatics',
        instructor: 'Dr. Alice Chen',
        students: 32,
        sessions: 10,
        progress: 10,
        status: 'Upcoming'
      },
      {
        id: 'c-4',
        title: 'Historical Linguistics',
        instructor: 'Dr. Mark Lee',
        students: 18,
        sessions: 6,
        progress: 100,
        status: 'Completed'
      }
    ];
  }
}
