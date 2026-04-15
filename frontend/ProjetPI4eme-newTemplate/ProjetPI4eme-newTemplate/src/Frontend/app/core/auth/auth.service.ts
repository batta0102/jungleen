import { Injectable, computed, inject, signal } from '@angular/core';
import Keycloak, { KeycloakInstance, KeycloakTokenParsed } from 'keycloak-js';

import { UserContextService, UserRole } from '../user/user-context.service';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SignupPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
}

type ResourceAccess = Record<string, { roles: string[] }>;

interface KeycloakToken extends KeycloakTokenParsed {
  resource_access?: ResourceAccess;
  realm_access?: { roles: string[] };
  preferred_username?: string;
  email?: string;
  name?: string;
}

const keycloakConfig = {
  url: 'http://localhost:8180',
  realm: 'myrealm',
  clientId: 'jungle-web'
};

const landingRedirect = () => `${window.location.origin}/`;

function readRoles(token: KeycloakToken | undefined, clientId: string): string[] {
  if (!token) return [];
  const resourceRoles = token.resource_access?.[clientId]?.roles ?? [];
  const realmRoles = token.realm_access?.roles ?? [];
  return [...new Set([...resourceRoles, ...realmRoles])];
}

function toUserRole(roles: string[]): UserRole {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('teacher') || roles.includes('TEACHER')) return 'teacher';
  if (roles.includes('tuteur') || roles.includes('tutor') || roles.includes('TUTOR')) return 'tutor';
  return 'student';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userContext = inject(UserContextService);

  private readonly keycloak: KeycloakInstance = new Keycloak(keycloakConfig);
  private readonly _currentUser = signal<AuthUser | null>(null);
  private readonly _ready = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isReady = this._ready.asReadonly();

  async init(): Promise<void> {
    this.keycloak.onAuthSuccess = () => this.syncUser();
    this.keycloak.onAuthRefreshSuccess = () => this.syncUser();
    this.keycloak.onAuthLogout = () => this.clearUser();

    try {
      // Check for stored tokens from credential-based login
      const storedToken = localStorage.getItem('kc_token');
      const storedRefreshToken = localStorage.getItem('kc_refresh_token');
      
      if (storedToken) {
        // Restore token state
        this.keycloak.token = storedToken;
        if (storedRefreshToken) {
          this.keycloak.refreshToken = storedRefreshToken;
        }
        
        const decoded = this.decodeToken(storedToken);
        (this.keycloak as any).tokenParsed = decoded;
        (this.keycloak as any).authenticated = true;
        
        this._ready.set(true);
        this.syncUser();
        return;
      }

      // Otherwise, use standard Keycloak SSO flow
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        pkceMethod: 'S256',
        checkLoginIframe: false,
        silentCheckSsoFallback: false
      });

      this._ready.set(true);
      if (authenticated) {
        this.syncUser();
      } else {
        this.clearUser();
      }
    } catch (error) {
      console.error('Keycloak init error:', error);
      this._ready.set(true);
      this.clearUser();
    }
  }

  async login(): Promise<void> {
    await this.keycloak.login({ redirectUri: landingRedirect() });
  }

  async register(): Promise<void> {
    await this.keycloak.register({ redirectUri: landingRedirect() });
  }

  async signup(payload: SignupPayload): Promise<{ id: string; message: string }> {
    const response = await fetch('/users-api/api/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage = 'Sign up failed. Please try again.';
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message || errorBody?.error || errorMessage;
      } catch {
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async logout(): Promise<void> {
    this.clearUser();
    // Clear stored tokens
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_refresh_token');
    
    // Only call keycloak logout if it's properly initialized
    try {
      if (this.keycloak && this.keycloak.authenticated) {
        await this.keycloak.logout({ redirectUri: landingRedirect() });
      } else {
        // Fallback: redirect to landing page
        window.location.href = landingRedirect();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect to landing page as fallback
      window.location.href = landingRedirect();
    }
  }

  async loginWithCredentials(username: string, password: string): Promise<{ access_token: string }> {
    const response = await fetch(`${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: keycloakConfig.clientId,
        username,
        password,
        grant_type: 'password',
        scope: 'openid profile email'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();
    if (data.access_token) {
      // Properly set all tokens on keycloak instance
      this.keycloak.token = data.access_token;
      this.keycloak.refreshToken = data.refresh_token;
      this.keycloak.idToken = data.id_token;
      
      // Parse and set the token
      const decoded = this.decodeToken(data.access_token);
      (this.keycloak as any).tokenParsed = decoded;
      (this.keycloak as any).authenticated = true;
      
      // Store tokens in localStorage for persistence
      localStorage.setItem('kc_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('kc_refresh_token', data.refresh_token);
      }
      
      // Sync user state
      this.syncUser();
    }
    return data;
  }

  decodeToken(token: string): KeycloakToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const decoded = JSON.parse(atob(parts[1]));
      return decoded as KeycloakToken;
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.keycloak.token ?? null;
  }

  isAccessTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const decoded = this.decodeToken(token);
    const exp = decoded?.exp;
    if (!exp) return false;

    const nowSeconds = Math.floor(Date.now() / 1000);
    return exp > nowSeconds;
  }

  private syncUser(): void {
    const token = this.keycloak.tokenParsed as KeycloakToken | undefined;
    if (!token) {
      this.clearUser();
      return;
    }

    const roles = readRoles(token, keycloakConfig.clientId);
    const role = toUserRole(roles);
    const subject = (token as { sub?: string }).sub;
    const stableUserId = subject ?? token.email ?? token.preferred_username ?? 'unknown';
    const user: AuthUser = {
      id: stableUserId,
      name: token.name ?? token.preferred_username ?? 'User',
      email: token.email ?? '',
      role
    };

    this._currentUser.set(user);
    this.userContext.setRole(role);
    this.userContext.setCurrentUser(user.id);
  }

  private clearUser(): void {
    this._currentUser.set(null);
    this.userContext.setRole('student');
    this.userContext.setCurrentUser('');
  }
}
