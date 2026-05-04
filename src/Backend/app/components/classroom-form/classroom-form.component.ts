import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClassroomApiService } from '../../../../core/api/services/classroom-api.service';
import { Classroom } from '../../../../core/api/models';

@Component({
  selector: 'app-classroom-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './classroom-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassroomFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ClassroomApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  form!: FormGroup;
  isEditMode = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  classroomId: string | null = null;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      capacity: [10, [Validators.required, Validators.min(1)]],
      type: ['STANDARD', Validators.required],
      location: [''],
      model3dUrl: [''],
      sketchfabModelUid: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.classroomId = id;
      this.error.set(null);
      this.loading.set(true);
      this.api.getClassroomById(id).subscribe({
        next: (classroom) => {
          this.form.patchValue({
            name: classroom.name ?? '',
            capacity: classroom.capacity ?? 10,
            type: String((classroom as Record<string, unknown>)['type'] ?? 'STANDARD').toUpperCase(),
            location: (classroom as Record<string, unknown>)['location'] ?? '',
            model3dUrl: classroom.model3dUrl ?? '',
            sketchfabModelUid: classroom.sketchfabModelUid ?? ''
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Failed to load classroom');
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

    const payload = {
      name: this.form.value.name.trim(),
      capacity: Number(this.form.value.capacity),
      type: String(this.form.value.type ?? 'STANDARD').toUpperCase(),
      location: (this.form.value.location ?? '').trim() || undefined,
      model3dUrl: (this.form.value.model3dUrl ?? '').trim() || undefined,
      sketchfabModelUid: (this.form.value.sketchfabModelUid ?? '').trim() || undefined
    };

    const request =
      this.isEditMode() && this.classroomId
        ? this.api.updateClassroom(this.classroomId, payload)
        : this.api.createClassroom(payload);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(this.isEditMode() ? 'Classroom updated.' : 'Classroom created.');
        setTimeout(() => this.router.navigate(['/back/courses/classrooms']), 1200);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Request failed');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/back/courses/classrooms']);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (!field?.errors) return null;
    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Min ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['min']) return `Min value is ${field.errors['min'].min}`;
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
