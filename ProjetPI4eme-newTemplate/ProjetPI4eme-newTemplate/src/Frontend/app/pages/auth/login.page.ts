import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../../core/auth/auth.service';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  loginForm!: FormGroup;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.loginForm.valid) {
      this.error.set('Please fill in all fields correctly.');
      return;
    }

    this.error.set(null);
    this.busy.set(true);

    try {
      const { username, password } = this.loginForm.value;

      // Get token from Keycloak token endpoint
      const tokenUrl = 'http://localhost:8180/realms/myrealm/protocol/openid-connect/token';
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: 'frontend',
        username: username,
        password: password
      });

      const response = await this.http
        .post<TokenResponse>(tokenUrl, body.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .toPromise();

      if (response?.access_token) {
        // Store token
        localStorage.setItem('access_token', response.access_token);
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }

        // Navigate to dashboard
        await this.router.navigate(['/front/dashboard']);
      } else {
        this.error.set('Invalid credentials. Please try again.');
        this.busy.set(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage =
        err?.error?.error_description ||
        err?.error?.message ||
        'Login failed. Invalid credentials or server error.';
      this.error.set(errorMessage);
      this.busy.set(false);
    }
  }
}
