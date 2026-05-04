import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ForumMessages } from './forum-messages.component';
import { ClubMessageService } from '../../services/club-message.service';
import { EpingleService } from '../../services/epingle.service';
import { AuthService } from '../../services/auth.service';

describe('ForumMessagesComponent', () => {
  let component: ForumMessages;
  let fixture: ComponentFixture<ForumMessages>;
  let clubMessageServiceSpy: any;
  let epingleServiceSpy: any;
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(async () => {
    const clubMessageSpy = jasmine.createSpyObj('ClubMessageService', ['getMessages']);
    const epingleSpy = jasmine.createSpyObj('EpingleService', ['getEpingles']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUserId']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ForumMessages],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}) } },
        { provide: ClubMessageService, useValue: clubMessageSpy },
        { provide: EpingleService, useValue: epingleSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForumMessages);
    component = fixture.componentInstance;
    clubMessageServiceSpy = TestBed.inject(ClubMessageService);
    epingleServiceSpy = TestBed.inject(EpingleService);
    authServiceSpy = TestBed.inject(AuthService);
    routerSpy = TestBed.inject(Router);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have messages array', () => {
    expect(component.messages).toBeDefined();
    expect(Array.isArray(component.messages)).toBe(true);
  });
});
