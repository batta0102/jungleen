import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly username = signal('');
  readonly password = signal('');

  async submit(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);

    try {
      const result = await this.auth.loginWithCredentials(
        this.username(),
        this.password()
      );

      if (result?.access_token) {
        const decoded = this.auth.decodeToken(result.access_token);
        const resourceRoles = decoded?.resource_access?.['jungle-web']?.roles || [];
        const realmRoles = decoded?.realm_access?.roles || [];
        const allRoles = [...resourceRoles, ...realmRoles];

        // Determine navigation based on roles
        if (allRoles.includes('admin')) {
          await this.router.navigate(['/admin']);
        } else if (
          allRoles.includes('teacher') ||
          allRoles.includes('TEACHER') ||
          allRoles.includes('tuteur') ||
          allRoles.includes('tutor') ||
          allRoles.includes('TUTOR')
        ) {
          await this.router.navigate(['/admin']);
        } else {
          await this.router.navigate(['/front/profile/student']);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      this.error.set(err?.error_description || err?.error || 'Invalid username or password. Please try again.');
      this.busy.set(false);
    }
  }
}
