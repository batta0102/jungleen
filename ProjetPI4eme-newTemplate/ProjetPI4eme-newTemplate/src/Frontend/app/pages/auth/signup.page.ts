import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

import { UserService } from '../../core/user.service';

@Component({
  selector: 'app-signup-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.page.html',
  styleUrl: './signup.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupPage {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  readonly signupForm = this.fb.group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      role: ['student', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: this.passwordMatchValidator.bind(this) }
  );

  async onSubmit(): Promise<void> {
    this.error.set(null);
    
    if (!this.signupForm.valid) {
      this.error.set('Please fill out all required fields correctly.');
      return;
    }

    this.busy.set(true);

    try {
      const formValue = this.signupForm.value;
      const signupRequest = {
        firstName: formValue.firstName || '',
        lastName: formValue.lastName || '',
        email: formValue.email || '',
        username: formValue.username || '',
        password: formValue.password || '',
        role: formValue.role || 'student'
      };

      const result = await this.userService.signup(signupRequest).toPromise();
      
      if (result) {
        alert('Account created successfully! Please log in with your credentials.');
        this.router.navigate(['/front/login']);
      }
    } catch (error: any) {
      const message = error?.error?.message || 'Sign up failed. Please try again.';
      this.error.set(message);
      this.busy.set(false);
    }
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }
}
