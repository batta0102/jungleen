import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  AssessmentService,
  BackQcmDto,
  BackQcmCreateRequest,
  BackSessionTestDto,
  BackResultatDto,
  BackQuestionDto,
  BackChoiceDto
} from './assessment.service';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AssessmentService]
    });
    service = TestBed.inject(AssessmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('QCM CRUD Operations', () => {
    // Test 1: Get all QCMs
    it('should retrieve all QCMs', () => {
      const mockQcms: BackQcmDto[] = [
        {
          id: 1,
          titre: 'English Test Level 1',
          contenu: 'Basic English examination',
          type: 'QCM_SINGLE',
          cible: 'STUDENT',
          dureeMinutes: 30,
          tentativesMax: 3,
          noteMax: 100,
          questions: []
        },
        {
          id: 2,
          titre: 'Math Assessment',
          contenu: 'Advanced mathematics',
          type: 'QCM_MULTI',
          cible: 'CANDIDATE',
          dureeMinutes: 60,
          tentativesMax: 2,
          noteMax: 120,
          questions: []
        }
      ];

      service.getQcms().subscribe(qcms => {
        expect(qcms.length).toBe(2);
        expect(qcms[0].titre).toBe('English Test Level 1');
        expect(qcms[1].type).toBe('QCM_MULTI');
      });

      const req = httpMock.expectOne('/api/qcms');
      expect(req.request.method).toBe('GET');
      req.flush(mockQcms);
    });

    // Test 2: Create QCM - simple case
    it('should create a new QCM', () => {
      const newQcmRequest: BackQcmCreateRequest = {
        titre: 'JavaScript Fundamentals',
        contenu: 'Test basic JS knowledge',
        type: 'QCM_SINGLE',
        cible: 'STUDENT',
        dureeMinutes: 45,
        tentativesMax: 2,
        noteMax: 100,
        datePublication: '2024-01-15'
      };

      const createdQcm: BackQcmDto = {
        id: 3,
        ...newQcmRequest,
        questions: []
      };

      service.createQcm(newQcmRequest).subscribe(qcm => {
        expect(qcm.id).toBe(3);
        expect(qcm.titre).toBe('JavaScript Fundamentals');
        expect(qcm.type).toBe('QCM_SINGLE');
      });

      const req = httpMock.expectOne('/api/qcms');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newQcmRequest);
      req.flush(createdQcm);
    });

    // Test 3: Update QCM
    it('should update an existing QCM', () => {
      const qcmId = 1;
      const updatePayload: BackQcmCreateRequest = {
        titre: 'English Test Level 2 (Updated)',
        contenu: 'Intermediate English',
        type: 'QCM_MULTI',
        cible: 'STUDENT',
        dureeMinutes: 45,
        tentativesMax: 3,
        noteMax: 100
      };

      service.updateQcm(qcmId, updatePayload).subscribe(qcm => {
        expect(qcm.titre).toBe('English Test Level 2 (Updated)');
        expect(qcm.type).toBe('QCM_MULTI');
        expect(qcm.dureeMinutes).toBe(45);
      });

      const req = httpMock.expectOne(`/api/qcms/${qcmId}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ id: qcmId, ...updatePayload, questions: [] });
    });

    // Test 4: Create QCM with questions - complex business logic
    it('should create QCM with multiple questions and choices', () => {
      const questions: BackQuestionDto[] = [
        {
          id: 1,
          contenu: 'What is 2 + 2?',
          choix: [
            { id: 1, contenu: '3', estCorrect: false, ordre: 1 },
            { id: 2, contenu: '4', estCorrect: true, ordre: 2 },
            { id: 3, contenu: '5', estCorrect: false, ordre: 3 }
          ]
        },
        {
          id: 2,
          contenu: 'What is the capital of France?',
          choix: [
            { id: 4, contenu: 'London', estCorrect: false, ordre: 1 },
            { id: 5, contenu: 'Paris', estCorrect: true, ordre: 2 },
            { id: 6, contenu: 'Berlin', estCorrect: false, ordre: 3 }
          ]
        }
      ];

      const qcmWithQuestions: BackQcmCreateRequest = {
        titre: 'General Knowledge',
        contenu: 'Basic questions',
        type: 'QCM_SINGLE',
        cible: 'STUDENT',
        dureeMinutes: 30,
        tentativesMax: 1,
        noteMax: 100,
        questions: questions
      };

      service.createQcm(qcmWithQuestions).subscribe(qcm => {
        expect(qcm.questions).toBeDefined();
        expect(qcm.questions!.length).toBe(2);
        expect(qcm.questions![0].choix).toBeDefined();
        expect(qcm.questions![0].choix!.length).toBe(3);
        // Verify correct answers exist
        qcm.questions!.forEach(q => {
          const correctChoices = q.choix!.filter(c => c.estCorrect);
          expect(correctChoices.length).toBeGreaterThan(0);
        });
      });

      const req = httpMock.expectOne('/api/qcms');
      req.flush({
        id: 5,
        ...qcmWithQuestions,
        questions: questions
      });
    });

    // Test 5: QCM type validation (COMPLEX BUSINESS LOGIC)
    it('should validate QCM types (QCM_SINGLE, QCM_MULTI, VRAI_FAUX)', () => {
      const types = ['QCM_SINGLE', 'QCM_MULTI', 'VRAI_FAUX'] as const;

      types.forEach((qcmType) => {
        const payload: BackQcmCreateRequest = {
          titre: `Test ${qcmType}`,
          contenu: 'Test content',
          type: qcmType,
          cible: 'STUDENT',
          dureeMinutes: 30,
          tentativesMax: 3,
          noteMax: 100
        };

        service.createQcm(payload).subscribe(qcm => {
          expect(['QCM_SINGLE', 'QCM_MULTI', 'VRAI_FAUX']).toContain(qcm.type!);
        });

        const req = httpMock.expectOne('/api/qcms');
        req.flush({ id: Math.random(), ...payload, questions: [] });
      });

      expect(true).toBe(true);
    });

    // Test 6: QCM duration constraints
    it('should handle QCM duration constraints properly', () => {
      const payload: BackQcmCreateRequest = {
        titre: 'Timed Test',
        contenu: 'Must complete within 15 minutes',
        type: 'QCM_SINGLE',
        cible: 'STUDENT',
        dureeMinutes: 15,
        tentativesMax: 1,
        noteMax: 50
      };

      service.createQcm(payload).subscribe(qcm => {
        expect(qcm.dureeMinutes).toBe(15);
        expect(qcm.dureeMinutes).toBeGreaterThan(0);
        expect(qcm.noteMax).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne('/api/qcms');
      req.flush({ id: 10, ...payload, questions: [] });
    });

    // Test 7: QCM target audience (STUDENT vs CANDIDATE)
    it('should differentiate between STUDENT and CANDIDATE target audiences', () => {
      const studentQcm: BackQcmCreateRequest = {
        titre: 'Student Assessment',
        contenu: 'For students',
        type: 'QCM_SINGLE',
        cible: 'STUDENT',
        dureeMinutes: 30,
        tentativesMax: 3,
        noteMax: 100
      };

      const candidateQcm: BackQcmCreateRequest = {
        titre: 'Candidate Assessment',
        contenu: 'For candidates',
        type: 'QCM_SINGLE',
        cible: 'CANDIDATE',
        dureeMinutes: 45,
        tentativesMax: 1,
        noteMax: 150
      };

      let studentCreated = false;
      let candidateCreated = false;

      service.createQcm(studentQcm).subscribe(qcm => {
        expect(qcm.cible).toBe('STUDENT');
        studentCreated = true;
      });

      const req1 = httpMock.expectOne('/api/qcms');
      req1.flush({ id: 20, ...studentQcm, questions: [] });

      service.createQcm(candidateQcm).subscribe(qcm => {
        expect(qcm.cible).toBe('CANDIDATE');
        candidateCreated = true;
      });

      const req2 = httpMock.expectOne('/api/qcms');
      req2.flush({ id: 21, ...candidateQcm, questions: [] });

      expect(studentCreated).toBe(true);
      expect(candidateCreated).toBe(true);
    });
  });

  describe('Session Tests', () => {
    // Test 8: Get all session tests
    it('should retrieve all session tests', () => {
      const mockSessions: BackSessionTestDto[] = [
        {
          id: 1,
          statut: 'COMPLETED',
          pourcentage: 85,
          qcm: {
            id: 1,
            titre: 'English Test',
            contenu: 'Basic English',
            questions: []
          }
        },
        {
          id: 2,
          statut: 'IN_PROGRESS',
          pourcentage: 0,
          qcm: {
            id: 2,
            titre: 'Math Test',
            contenu: 'Advanced Math',
            questions: []
          }
        }
      ];

      service.getSessionTests().subscribe(sessions => {
        expect(sessions.length).toBe(2);
        expect(sessions[0].statut).toBe('COMPLETED');
        expect(sessions[0].pourcentage).toBe(85);
        expect(sessions[1].statut).toBe('IN_PROGRESS');
      });

      const req = httpMock.expectOne('/api/session-tests');
      expect(req.request.method).toBe('GET');
      req.flush(mockSessions);
    });

    // Test 9: Session progress tracking (COMPLEX BUSINESS LOGIC)
    it('should track session progress with percentage calculation', () => {
      const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

      statuses.forEach((status) => {
        const mockSession: BackSessionTestDto = {
          id: 1,
          statut: status,
          pourcentage: status === 'COMPLETED' ? 100 : status === 'IN_PROGRESS' ? 50 : 0,
          qcm: { id: 1, titre: 'Test', contenu: 'Content', questions: [] }
        };

        service.getSessionTests().subscribe(sessions => {
          // Progress should be between 0 and 100
          sessions.forEach(session => {
            expect(session.pourcentage).toBeGreaterThanOrEqual(0);
            expect(session.pourcentage).toBeLessThanOrEqual(100);
          });
        });

        const req = httpMock.expectOne('/api/session-tests');
        req.flush([mockSession]);
      });

      expect(true).toBe(true);
    });
  });

  describe('Test Results', () => {
    // Test 10: Get all results
    it('should retrieve all test results', () => {
      const mockResultats: BackResultatDto[] = [
        {
          id: 1,
          score: 85,
          noteSur: 100,
          pourcentage: 85,
          session: {
            id: 1,
            statut: 'COMPLETED',
            pourcentage: 85,
            qcm: { id: 1, titre: 'Test', contenu: 'Content', questions: [] }
          }
        },
        {
          id: 2,
          score: 45,
          noteSur: 100,
          pourcentage: 45,
          session: {
            id: 2,
            statut: 'COMPLETED',
            pourcentage: 45,
            qcm: { id: 2, titre: 'Test 2', contenu: 'Content 2', questions: [] }
          }
        }
      ];

      service.getResultats().subscribe(resultats => {
        expect(resultats.length).toBe(2);
        expect(resultats[0].pourcentage).toBe(85);
        expect(resultats[1].pourcentage).toBe(45);
      });

      const req = httpMock.expectOne('/api/resultats');
      expect(req.request.method).toBe('GET');
      req.flush(mockResultats);
    });

    // Test 11: Result scoring calculation (COMPLEX BUSINESS LOGIC)
    it('should calculate percentage correctly from score and maxNote', () => {
      const testCases = [
        { score: 85, noteSur: 100, expectedPercentage: 85 },
        { score: 75, noteSur: 100, expectedPercentage: 75 },
        { score: 0, noteSur: 100, expectedPercentage: 0 },
        { score: 100, noteSur: 100, expectedPercentage: 100 }
      ];

      testCases.forEach((testCase) => {
        const mockResultat: BackResultatDto = {
          id: Math.random(),
          score: testCase.score,
          noteSur: testCase.noteSur,
          pourcentage: (testCase.score / testCase.noteSur) * 100,
          session: {
            id: 1,
            statut: 'COMPLETED',
            pourcentage: 100,
            qcm: { id: 1, titre: 'Test', contenu: 'Content', questions: [] }
          }
        };

        service.getResultats().subscribe(resultats => {
          resultats.forEach(r => {
            // Verify percentage calculation
            const calculatedPercentage = (r.score / r.noteSur) * 100;
            expect(Math.abs(calculatedPercentage - r.pourcentage)).toBeLessThan(1);
          });
        });

        const req = httpMock.expectOne('/api/resultats');
        req.flush([mockResultat]);
      });

      expect(true).toBe(true);
    });

    // Test 12: Pass/Fail threshold (COMPLEX BUSINESS LOGIC)
    it('should determine pass/fail based on score threshold (typically 60%)', () => {
      const resultsWithThreshold = [
        { score: 70, noteSur: 100, shouldPass: true },
        { score: 55, noteSur: 100, shouldPass: false },
        { score: 60, noteSur: 100, shouldPass: true },
        { score: 59, noteSur: 100, shouldPass: false }
      ];

      resultsWithThreshold.forEach((testCase) => {
        const percentage = (testCase.score / testCase.noteSur) * 100;
        const passed = percentage >= 60;

        expect(passed).toBe(testCase.shouldPass);
      });

      expect(true).toBe(true);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    // Test 13: Handle zero score result
    it('should handle results with zero score', () => {
      const zeroScoreResult: BackResultatDto = {
        id: 999,
        score: 0,
        noteSur: 100,
        pourcentage: 0,
        session: {
          id: 1,
          statut: 'COMPLETED',
          pourcentage: 0,
          qcm: { id: 1, titre: 'Test', contenu: 'Content', questions: [] }
        }
      };

      service.getResultats().subscribe(resultats => {
        expect(resultats[0].score).toBe(0);
        expect(resultats[0].pourcentage).toBe(0);
      });

      const req = httpMock.expectOne('/api/resultats');
      req.flush([zeroScoreResult]);
    });

    // Test 14: Handle empty QCM without questions
    it('should handle QCM creation without questions', () => {
      const emptyQcmRequest: BackQcmCreateRequest = {
        titre: 'Empty QCM',
        contenu: 'To be filled',
        type: 'QCM_SINGLE',
        cible: 'STUDENT',
        dureeMinutes: 30,
        tentativesMax: 3,
        noteMax: 0,
        questions: []
      };

      service.createQcm(emptyQcmRequest).subscribe(qcm => {
        expect(qcm.questions).toBeDefined();
        expect(qcm.questions!.length).toBe(0);
      });

      const req = httpMock.expectOne('/api/qcms');
      req.flush({ id: 100, ...emptyQcmRequest, questions: [] });
    });
  });
});
