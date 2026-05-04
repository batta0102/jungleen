import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-signup-page',
  imports: [RouterLink],
  templateUrl: './signup.page.html',
  styleUrl: './signup.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupPage {
  private readonly auth = inject(AuthService);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  async submit(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);

    try {
      await this.auth.register();
    } catch {
      this.error.set('Sign up failed. Please try again.');
      this.busy.set(false);
    }
  }
}
