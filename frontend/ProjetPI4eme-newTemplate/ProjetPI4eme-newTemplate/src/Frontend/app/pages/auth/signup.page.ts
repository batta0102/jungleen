import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-signup-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.page.html',
  styleUrl: './signup.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly busy = signal(false);
  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly username = signal('');
  readonly role = signal('student');
  readonly password = signal('');
  readonly confirmPassword = signal('');

  async submit(): Promise<void> {
    this.error.set(null);
    this.success.set(null);

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Password and confirm password do not match.');
      return;
    }

    this.busy.set(true);

    try {
      await this.auth.signup({
        username: this.username().trim(),
        email: this.email().trim(),
        firstName: this.firstName().trim(),
        lastName: this.lastName().trim(),
        password: this.password(),
        role: this.role()
      });

      this.success.set('Account created successfully. You can now log in.');
      setTimeout(() => {
        this.router.navigate(['/front/login']);
      }, 600);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Sign up failed. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
