import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthGuardService } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuardService', () => {
  let guard: AuthGuardService;
  let navigateCalls: any[] = [];
  let navigateSpy: (args: any) => void;

  beforeEach(() => {
    navigateCalls = [];
    navigateSpy = (args: any) => {
      navigateCalls.push(args);
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuardService,
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: AuthService, useValue: { isLoggedIn: () => true } }
      ]
    });

    guard = TestBed.inject(AuthGuardService);
  });

  it('should allow navigation for authenticated user', () => {
    expect(guard.canActivate()).toBeTruthy();
    expect(navigateCalls.length).toBe(0);
  });

  it('should redirect guest to login page', () => {
    TestBed.resetTestingModule();
    navigateCalls = [];
    navigateSpy = (args: any) => {
      navigateCalls.push(args);
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuardService,
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: AuthService, useValue: { isLoggedIn: () => false } }
      ]
    });

    const guestGuard = TestBed.inject(AuthGuardService);
    expect(guestGuard.canActivate()).toBeFalsy();
    expect(navigateCalls.length).toBe(1);
    expect(navigateCalls[0]).toEqual(['/front/login']);
  });
});
