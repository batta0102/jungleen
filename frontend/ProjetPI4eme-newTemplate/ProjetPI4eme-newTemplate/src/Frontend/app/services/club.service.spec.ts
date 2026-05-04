// Déclarations globales pour Jasmine
declare const jasmine: any;
declare const spyOn: any;
declare const fail: any;

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ClubService, Club, CreateClubDTO } from './club.service';

describe('ClubService', () => {
  let service: ClubService;
  let httpMock: HttpTestingController;

  const mockClub: Club = {
    idClub: 1,
    nom: 'Test Club',
    description: 'Test Description',
    niveau: 'A1',
    capacityMax: 50,
    status: 'ACTIVE',
    clubOwner: 1,
    dateCreation: '2023-01-01T00:00:00Z',
    dateModification: '2023-01-01T00:00:00Z',
    adresse: '123 Test St',
    ville: 'Test City',
    pays: 'Test Country',
    telephone: '123-456-7890',
    email: 'test@test.com',
    siteWeb: 'https://test.com',
    actif: true
  };

  const mockCreateClubDTO: CreateClubDTO = {
    nom: 'New Club',
    description: 'New Description',
    adresse: '456 New St',
    ville: 'New City',
    pays: 'New Country',
    telephone: '098-765-4321',
    email: 'new@test.com',
    siteWeb: 'https://new.com'
  };

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

  it('should get all clubs', () => {
    const mockClubs: Club[] = [mockClub];

    service.getAllClubs().subscribe(clubs => {
      expect(clubs).toEqual(mockClubs);
      expect(clubs.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/clubs');
    expect(req.request.method).toBe('GET');
    req.flush(mockClubs);
  });

  it('should get club by id', () => {
    service.getClubById(1).subscribe(club => {
      expect(club).toEqual(mockClub);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockClub);
  });

  it('should create new club', () => {
    service.createClub(mockCreateClubDTO).subscribe(club => {
      expect(club).toEqual(mockClub);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/clubs');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockCreateClubDTO);
    req.flush(mockClub);
  });

  it('should update club', () => {
    const updateData = { nom: 'Updated Club' };

    service.updateClub(1, updateData).subscribe(club => {
      expect(club).toEqual(mockClub);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush(mockClub);
  });

  it('should delete club', () => {
    service.deleteClub(1).subscribe(() => {
      // Expectation is in http mock below
    });

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should search clubs by name', () => {
    const mockClubs: Club[] = [mockClub];

    service.searchClubs('Test').subscribe(clubs => {
      expect(clubs).toEqual(mockClubs);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/search?nom=Test');
    expect(req.request.method).toBe('GET');
    req.flush(mockClubs);
  });

  it('should get active clubs', () => {
    const mockClubs: Club[] = [mockClub];

    service.getActiveClubs().subscribe(clubs => {
      expect(clubs).toEqual(mockClubs);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/actifs');
    expect(req.request.method).toBe('GET');
    req.flush(mockClubs);
  });

  it('should handle 404 error', () => {
    service.getClubById(999).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.message).toContain('Club non trouvé');
      }
    );

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/999');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  it('should handle 401 error', () => {
    service.getAllClubs().subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.message).toContain('Non autorisé');
      }
    );

    const req = httpMock.expectOne('http://localhost:8085/api/clubs');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle 403 error', () => {
    service.deleteClub(1).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.message).toContain('Accès interdit');
      }
    );

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/1');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
  });

  it('should handle 500 error', () => {
    service.createClub(mockCreateClubDTO).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.message).toContain('Erreur serveur');
      }
    );

    const req = httpMock.expectOne('http://localhost:8085/api/clubs');
    req.flush('Server Error', { status: 500, statusText: 'Server Error' });
  });

  it('should handle network error', () => {
    service.getClubById(1).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.message).toContain('Une erreur inattendue est survenue');
      }
    );

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/1');
    req.error(new ErrorEvent('Network error'));
  });

  it('should handle 400 error', () => {
    service.updateClub(1, { nom: '' }).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.message).toContain('Requête invalide');
      }
    );

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/1');
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
  });

  it('should handle 409 error', () => {
    service.createClub(mockCreateClubDTO).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.message).toContain('Conflit de données');
      }
    );

    const req = httpMock.expectOne('http://localhost:8085/api/clubs');
    req.flush('Conflict', { status: 409, statusText: 'Conflict' });
  });

  it('should handle 503 error', () => {
    service.searchClubs('test').subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.message).toContain('Service indisponible');
      }
    );

    const req = httpMock.expectOne('http://localhost:8085/api/clubs/search?nom=test');
    req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
  });
});
