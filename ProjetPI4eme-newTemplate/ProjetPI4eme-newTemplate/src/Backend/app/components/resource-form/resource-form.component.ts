import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../services/resource.service';
import { Resource } from '../../models/resource.model';

@Component({
  selector: 'app-resource-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resource-form.component.html',
  styleUrls: ['./resource-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private resourceService = inject(ResourceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form!: FormGroup;
  isEditMode = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  resourceId: number | null = null;

  // Resource types - normalized to uppercase for backend compatibility
  resourceTypes = ['PDF', 'VIDEO', 'AUDIO', 'DOCUMENT'];

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      fileUrl: ['']
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.resourceId = parseInt(id, 10);
      this.loadResource(this.resourceId);
    }
  }

  private loadResource(id: number): void {
    this.loading.set(true);
    this.resourceService.getById(id).subscribe({
      next: (resource) => {
        console.log('Resource loaded for editing:', resource);
        this.form.patchValue({
          title: resource.title,
          type: resource.type,
          description: resource.description,
          fileUrl: resource.fileUrl || ''
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load resource');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.error.set('Please fix the form errors');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const formValue: Resource = this.form.value;

    const request = this.isEditMode() && this.resourceId
      ? this.resourceService.update(this.resourceId, formValue)
      : this.resourceService.create(formValue);

    request.subscribe({
      next: () => {
        const message = this.isEditMode() ? 'Resource updated successfully' : 'Resource created successfully';
        this.success.set(message);
        this.loading.set(false);

        setTimeout(() => {
          this.router.navigate(['/back/resources']);
        }, 1500);
      },
      error: (err) => {
        this.error.set(err.message || 'An error occurred');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/back/resources']);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (!field || !field.errors) return null;

    if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required`;
    if (field.errors['minlength']) {
      return `${this.formatFieldName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }

    return null;
  }

  private formatFieldName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
