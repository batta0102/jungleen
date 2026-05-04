import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  async submit(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);

    try {
      await this.auth.login();
    } catch {
      this.error.set('Login failed. Please try again.');
      this.busy.set(false);
    }
  }
}
