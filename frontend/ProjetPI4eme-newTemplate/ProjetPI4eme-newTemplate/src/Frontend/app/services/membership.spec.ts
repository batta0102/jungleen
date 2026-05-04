import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MembershipService, Membership } from './membership.service';

describe('MembershipService', () => {
  let service: MembershipService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MembershipService]
    });
    service = TestBed.inject(MembershipService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all memberships', () => {
    const mockMemberships: Membership[] = [
      { idInscription: 1, userId: 1, clubId: 1, clubNom: 'Club 1', status: 'ACTIVE', dateInscription: new Date() },
      { idInscription: 2, userId: 2, clubId: 2, clubNom: 'Club 2', status: 'PENDING', dateInscription: new Date() }
    ];

    service.getAllMemberships().subscribe(memberships => {
      expect(memberships).toEqual(mockMemberships);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/memberships');
    expect(req.request.method).toBe('GET');
    req.flush(mockMemberships);
  });

  it('should fetch membership by id', () => {
    const mockMembership: Membership = { idInscription: 1, userId: 1, clubId: 1, clubNom: 'Club 1', status: 'ACTIVE', dateInscription: new Date() };

    service.getMembershipById(1).subscribe(membership => {
      expect(membership).toEqual(mockMembership);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/memberships/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockMembership);
  });

  it('should fetch memberships by club', () => {
    const mockMemberships: Membership[] = [
      { idInscription: 1, userId: 1, clubId: 1, clubNom: 'Club 1', status: 'ACTIVE', dateInscription: new Date() }
    ];

    service.getMembershipsByClub(1).subscribe(memberships => {
      expect(memberships).toEqual(mockMemberships);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/memberships/by-club/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockMemberships);
  });

  it('should create membership', () => {
    const newMembership: Partial<Membership> = { userId: 1, clubId: 1, clubNom: 'Club 1', status: 'PENDING' };
    const createdMembership: Membership = { idInscription: 1, userId: 1, clubId: 1, clubNom: 'Club 1', status: 'PENDING', dateInscription: new Date() };

    service.createMembership(newMembership).subscribe(membership => {
      expect(membership).toEqual(createdMembership);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/memberships');
    expect(req.request.method).toBe('POST');
    req.flush(createdMembership);
  });

  it('should delete a membership', () => {
    service.deleteMembership(1).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne('http://localhost:8085/api/memberships/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});