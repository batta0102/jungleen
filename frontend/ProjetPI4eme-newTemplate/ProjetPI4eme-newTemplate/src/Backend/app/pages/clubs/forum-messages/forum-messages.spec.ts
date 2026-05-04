import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumMessages } from './forum-messages';

describe('ForumMessages', () => {
  let component: ForumMessages;
  let fixture: ComponentFixture<ForumMessages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForumMessages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForumMessages);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
