import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { NotificationPopupComponent } from './notification-popup.component';
import { SessionNotificationService } from '../../services/session-notification.service';

// Déclarations Jasmine globales simplifiées
declare const spyOn: any;

describe('NotificationPopupComponent', () => {
  let component: NotificationPopupComponent;
  let fixture: ComponentFixture<NotificationPopupComponent>;
  let sessionNotificationService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationPopupComponent],
      providers: [SessionNotificationService]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPopupComponent);
    component = fixture.componentInstance;
    sessionNotificationService = TestBed.inject(SessionNotificationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize component properties', () => {
    expect(component.popups).toBeDefined();
    expect(component.popupsVisibles).toBeDefined();
  });

  describe('Popup display', () => {
    it('should show popup when popups are visible', () => {
      const mockPopups = [
        { 
          id: '1', 
          visible: true, 
          session: { 
            sessionId: 1, 
            sujet: 'Session 1',
            date: '2026-04-15',
            heure: '10:00',
            duree: 60,
            lieu: 'Salle A',
            status: 'UPCOMING',
            notes: ''
          } 
        }
      ];
      component['popups'].set(mockPopups);
      fixture.detectChanges();

      const popupElements = fixture.debugElement.queryAll(By.css('.notification-popup'));
      expect(popupElements.length).toBe(1);
    });

    it('should hide popup when popup is not visible', () => {
      const mockPopups = [
        { 
          id: '1', 
          visible: false, 
          session: { 
            sessionId: 1, 
            sujet: 'Session 1',
            date: '2026-04-15',
            heure: '10:00',
            duree: 60,
            lieu: 'Salle A',
            status: 'UPCOMING',
            notes: ''
          } 
        }
      ];
      component['popups'].set(mockPopups);
      fixture.detectChanges();

      const popupElements = fixture.debugElement.queryAll(By.css('.notification-popup.visible'));
      expect(popupElements.length).toBe(0);
    });
  });

  describe('Session confirmation', () => {
    it('should confirm session attendance', fakeAsync(() => {
      const mockSession = { 
        sessionId: 1, 
        sujet: 'Session 1',
        date: '2026-04-15',
        heure: '10:00',
        duree: 60,
        lieu: 'Salle A',
        status: 'UPCOMING',
        notes: ''
      };
      const mockResponse = { success: true };
      spyOn(sessionNotificationService, 'confirmerSession').and.returnValue(of(mockResponse));

      component.confirmerSession(mockSession);
      tick();

      expect(sessionNotificationService.confirmerSession).toHaveBeenCalledWith(1);
    }));

    it('should handle confirmation error', fakeAsync(() => {
      const mockSession = { 
        sessionId: 1, 
        sujet: 'Session 1',
        date: '2026-04-15',
        heure: '10:00',
        duree: 60,
        lieu: 'Salle A',
        status: 'UPCOMING',
        notes: ''
      };
      const mockError = { status: 404, statusText: 'Not Found' };
      spyOn(sessionNotificationService, 'confirmerSession').and.returnValue(throwError(() => mockError));
      spyOn(console, 'error');

      component.confirmerSession(mockSession);
      tick();

      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('Mark as viewed', () => {
    it('should mark session as viewed', fakeAsync(() => {
      const mockSession = { 
        sessionId: 1, 
        sujet: 'Session 1',
        date: '2026-04-15',
        heure: '10:00',
        duree: 60,
        lieu: 'Salle A',
        status: 'UPCOMING',
        notes: ''
      };
      const mockResponse = { success: true };
      spyOn(sessionNotificationService, 'marquerVue').and.returnValue(of(mockResponse));

      component.marquerVue(mockSession);
      tick();

      expect(sessionNotificationService.marquerVue).toHaveBeenCalledWith(1);
    }));

    it('should handle marking as viewed error', fakeAsync(() => {
      const mockSession = { 
        sessionId: 1, 
        sujet: 'Session 1',
        date: '2026-04-15',
        heure: '10:00',
        duree: 60,
        lieu: 'Salle A',
        status: 'UPCOMING',
        notes: ''
      };
      const mockError = { status: 404, statusText: 'Not Found' };
      spyOn(sessionNotificationService, 'marquerVue').and.returnValue(throwError(() => mockError));
      spyOn(console, 'error');

      component.marquerVue(mockSession);
      tick();

      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('Component lifecycle', () => {
    it('should initialize and subscribe to popups', () => {
      spyOn(sessionNotificationService.popups, 'subscribe');
      spyOn(console, 'log');

      component.ngOnInit();

      expect(sessionNotificationService.popups.subscribe).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
    });

    it('should stop polling on destroy', () => {
      spyOn(sessionNotificationService, 'arreterPolling');

      component.ngOnDestroy();

      expect(sessionNotificationService.arreterPolling).toHaveBeenCalled();
    });
  });
});