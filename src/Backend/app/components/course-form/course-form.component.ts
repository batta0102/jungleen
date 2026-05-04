import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseApiService } from '../../../../core/api/services/course-api.service';
import { CourseCreate } from '../../../../core/api/models';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly courseApi = inject(CourseApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  form!: FormGroup;
  isEditMode = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  courseId: string | null = null;

  statusOptions: Array<'Active' | 'Upcoming' | 'Completed'> = ['Active', 'Upcoming', 'Completed'];

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      instructor: ['', [Validators.required, Validators.minLength(2)]],
      students: [0, [Validators.required, Validators.min(0)]],
      sessions: [1, [Validators.required, Validators.min(1)]],
      progress: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      status: ['Active', Validators.required]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.courseId = id;
      this.loading.set(true);
      this.courseApi.getCourseById(id).subscribe({
        next: (course) => {
          this.form.patchValue({
            title: course.title,
            instructor: course.instructor ?? '',
            students: course.students ?? 0,
            sessions: course.sessions ?? 1,
            progress: course.progress ?? 0,
            status: course.status ?? 'Active'
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Failed to load course');
          this.loading.set(false);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.error.set('Please fix the form errors.');
      return;
    }
    this.error.set(null);
    this.success.set(null);
    this.loading.set(true);

    const value: CourseCreate = {
      title: this.form.value.title,
      instructor: this.form.value.instructor,
      students: this.form.value.students,
      sessions: this.form.value.sessions,
      progress: this.form.value.progress,
      status: this.form.value.status
    };

    const request = this.isEditMode() && this.courseId
      ? this.courseApi.updateCourse(this.courseId, value)
      : this.courseApi.createCourse(value);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(this.isEditMode() ? 'Course updated successfully.' : 'Course created successfully.');
        setTimeout(() => this.router.navigate(['/back/courses']), 1200);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Request failed');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/back/courses']);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (!field?.errors) return null;
    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Min ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['min']) return `Min value is ${field.errors['min'].min}`;
    if (field.errors['max']) return `Max value is ${field.errors['max'].max}`;
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
