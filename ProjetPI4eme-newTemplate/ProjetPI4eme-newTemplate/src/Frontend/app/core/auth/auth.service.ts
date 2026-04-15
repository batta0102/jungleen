import { Injectable, computed, inject, signal } from '@angular/core';
import Keycloak, { KeycloakInstance, KeycloakTokenParsed } from 'keycloak-js';

import { UserContextService, UserRole } from '../user/user-context.service';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
  clientId: 'frontend'
};

// Development mode - allow app to work without Keycloak
const isDevelopment = !window.location.hostname.includes('prod');

const landingRedirect = () => `${window.location.origin}/`;

function readRoles(token: KeycloakToken | undefined, clientId: string): string[] {
  if (!token) return [];
  const resourceRoles = token.resource_access?.[clientId]?.roles ?? [];
  const realmRoles = token.realm_access?.roles ?? [];
  return [...new Set([...resourceRoles, ...realmRoles])];
}

function toUserRole(roles: string[]): UserRole {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('tuteur') || roles.includes('tutor')) return 'tutor';
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
    // In development mode, skip Keycloak entirely
    if (isDevelopment) {
      console.log('[AUTH] Development mode: Keycloak disabled. Using mock user.');
      const mockUser: AuthUser = {
        id: 'dev-user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student'
      };
      this._currentUser.set(mockUser);
      this.userContext.setRole('student');
      this._ready.set(true);
      return;
    }

    // Production mode: Initialize Keycloak
    this.keycloak.onAuthSuccess = () => this.syncUser();
    this.keycloak.onAuthRefreshSuccess = () => this.syncUser();
    this.keycloak.onAuthLogout = () => this.clearUser();

    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
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
      console.error('[AUTH] Keycloak initialization failed:', error);
      this._ready.set(true);
      this.clearUser();
    }
  }

  async login(): Promise<void> {
    if (isDevelopment && !this.keycloak.token) {
      // In development, just set a mock user
      const mockUser: AuthUser = {
        id: 'dev-user',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student'
      };
      this._currentUser.set(mockUser);
      this.userContext.setRole('student');
    } else {
      await this.keycloak.login({ redirectUri: landingRedirect() });
    }
  }

  async register(): Promise<void> {
    if (isDevelopment) {
      // In development, just set a mock user as if registered
      const mockUser: AuthUser = {
        id: 'dev-user',
        name: 'New User',
        email: 'newuser@example.com',
        role: 'student'
      };
      this._currentUser.set(mockUser);
      this.userContext.setRole('student');
    } else {
      await this.keycloak.register({ redirectUri: landingRedirect() });
    }
  }

  async logout(): Promise<void> {
    this.clearUser();
    if (!isDevelopment) {
      await this.keycloak.logout({ redirectUri: landingRedirect() });
    }
  }

  getAccessToken(): string | null {
    // In development mode, return a mock token
    if (isDevelopment) {
      return 'dev-mock-token-' + Date.now();
    }
    
    // Production: Check localStorage first (from form-based login)
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      return storedToken;
    }
    
    // Fall back to Keycloak token if available
    return this.keycloak.token ?? null;
  }

  setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
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
    const user: AuthUser = {
      id: subject ?? 'unknown',
      name: token.name ?? token.preferred_username ?? 'User',
      email: token.email ?? '',
      role
    };

    this._currentUser.set(user);
    this.userContext.setRole(role);
  }

  private clearUser(): void {
    this._currentUser.set(null);
    this.userContext.setRole('student');
  }
}
