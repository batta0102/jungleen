import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClubService, Club } from './club';

describe('ClubService', () => {
  let service: ClubService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClubService]
    });
    service = TestBed.inject(ClubService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all clubs', () => {
    const mockClubs: Club[] = [
      { idClub: 1, nom: 'Club 1', description: 'Desc 1', clubOwner: 1, capacityMax: 100, status: 'ACTIVE', dateCreation: new Date(), niveau: 'A1' },
      { idClub: 2, nom: 'Club 2', description: 'Desc 2', clubOwner: 1, capacityMax: 50, status: 'ACTIVE', dateCreation: new Date(), niveau: 'A2' }
    ];

    service.getAllClubs().subscribe(clubs => {
      expect(clubs).toEqual(mockClubs);
    });

    const req = httpMock.expectOne('/api/clubs');
    expect(req.request.method).toBe('GET');
    req.flush(mockClubs);
  });

  it('should fetch club by id', () => {
    const mockClub: Club = { idClub: 1, nom: 'Club 1', description: 'Desc 1', clubOwner: 1, capacityMax: 100, status: 'ACTIVE', dateCreation: new Date(), niveau: 'A1' };

    service.getClubById(1).subscribe(club => {
      expect(club).toEqual(mockClub);
    });

    const req = httpMock.expectOne('/api/clubs/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockClub);
  });
});