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
    this.keycloak.onAuthSuccess = () => this.syncUser();
    this.keycloak.onAuthRefreshSuccess = () => this.syncUser();
    this.keycloak.onAuthLogout = () => this.clearUser();

    try {
      const authenticated = await this.keycloak.init({
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

  async logout(): Promise<void> {
    this.clearUser();
    await this.keycloak.logout({ redirectUri: landingRedirect() });
  }

  getAccessToken(): string | null {
    return this.keycloak.token ?? null;
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
