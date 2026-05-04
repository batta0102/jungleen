import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OcrService } from './ocr.service';
import { AuthService } from './auth.service';

describe('OcrService', () => {
  let service: OcrService;
  let httpMock: HttpTestingController;
  let authServiceSpy: { getCurrentUserId: jasmine.Spy };

  beforeEach(() => {
    const spy = { getCurrentUserId: jasmine.createSpy('getCurrentUserId') };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OcrService,
        { provide: AuthService, useValue: spy }
      ]
    });

    service = TestBed.inject(OcrService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = spy;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should extract text from image', () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const mockResponse = { texte: 'Hello World' };

    service.extraireTexte(mockFile).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/vision/ocr');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockResponse);
  });

  it('should extract and translate text', () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const mockResponse = {
      texteOriginal: 'Hello World',
      traduction: 'Bonjour le monde',
      langueSource: 'en'
    };

    service.extraireEtTraduire(mockFile).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/vision/ocr/traduire');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockResponse);
  });

  it('should add word to vocabulary', () => {
    authServiceSpy.getCurrentUserId.and.returnValue(1);
    
    const mockResponse = { id: 1, mot: 'hello', traduction: 'bonjour' };
    const userId = 1;
    const clubId = 2;
    const mot = 'hello';
    const traduction = 'bonjour';

    service.ajouterAuVocabulaire(userId, clubId, mot, traduction).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(req => {
      return req.method === 'POST' && req.url === 'http://localhost:8085/api/vision/vocabulaire/ajouter';
    });
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should get vocabulary', () => {
    authServiceSpy.getCurrentUserId.and.returnValue(1);
    
    const mockResponse = [
      { id: 1, mot: 'hello', traduction: 'bonjour', foisVu: 5 },
      { id: 2, mot: 'world', traduction: 'monde', foisVu: 3 }
    ];
    const userId = 1;
    const clubId = 2;

    service.getVocabulaire(userId, clubId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`http://localhost:8085/api/vision/vocabulaire/${userId}/${clubId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should delete word from vocabulary', () => {
    const mockResponse = { success: true };
    const motId = 1;

    service.supprimerDuVocabulaire(motId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`http://localhost:8085/api/vision/vocabulaire/${motId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should publish message to club', () => {
    const mockResponse = { id: 1, contenu: 'Test message' };
    const clubId = 2;
    const userId = 1;
    const contenu = 'Test message';

    service.publierMessageClub(clubId, userId, contenu).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/clubMessages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ clubId, userId, contenu });
    req.flush(mockResponse);
  });

  it('should return current user ID', () => {
    authServiceSpy.getCurrentUserId.and.returnValue(42);
    
    expect(service.getCurrentUserId()).toBe(42);
    expect(authServiceSpy.getCurrentUserId).toHaveBeenCalled();
  });

  it('should handle HTTP errors in extractTexte', () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const mockError = { status: 500, statusText: 'Server Error' };

    service.extraireTexte(mockFile).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error).toBeTruthy();
      }
    });

    const req = httpMock.expectOne('http://localhost:8085/api/vision/ocr');
    req.flush('Server Error', { status: 500, statusText: 'Server Error' });
  });

  it('should handle empty vocabulary response', () => {
    authServiceSpy.getCurrentUserId.and.returnValue(1);
    
    const mockResponse: any[] = [];
    const userId = 1;
    const clubId = 2;

    service.getVocabulaire(userId, clubId).subscribe(response => {
      expect(response).toEqual([]);
    });

    const req = httpMock.expectOne(`http://localhost:8085/api/vision/vocabulaire/${userId}/${clubId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});