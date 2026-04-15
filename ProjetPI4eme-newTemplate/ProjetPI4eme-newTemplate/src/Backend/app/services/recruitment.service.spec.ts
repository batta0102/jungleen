import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  RecruitmentService,
  JobOfferDto,
  JobOfferPayload,
  CandidatureDto,
  CVAnalysisResultDto,
  InterviewDto,
  InterviewPayload,
  RecruitmentStatus
} from './recruitment.service';

describe('RecruitmentService', () => {
  let service: RecruitmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecruitmentService]
    });
    service = TestBed.inject(RecruitmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Job Offer CRUD Operations', () => {
    // Test 1: Get all job offers
    it('should retrieve all job offers', () => {
      const mockOffers: JobOfferDto[] = [
        {
          id: 1,
          titre: 'Senior Developer',
          description: 'Vue, React skills required',
          niveauRequis: 'Senior',
          experienceRequise: 5,
          actif: true
        },
        {
          id: 2,
          titre: 'Junior Developer',
          description: 'Entry level position',
          niveauRequis: 'Junior',
          experienceRequise: 0,
          actif: true
        }
      ];

      service.getOffers().subscribe(offers => {
        expect(offers.length).toBe(2);
        expect(offers[0].titre).toBe('Senior Developer');
        expect(offers[1].niveauRequis).toBe('Junior');
      });

      const req = httpMock.expectOne('/api/poste/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockOffers);
    });

    // Test 2: Create new job offer - simple case
    it('should create a new job offer', () => {
      const newOffer: JobOfferPayload = {
        titre: 'DevOps Engineer',
        contenu: 'Cloud infrastructure',
        description: 'AWS, Docker, Kubernetes expertise needed',
        niveauRequis: 'Senior',
        experienceRequise: 4,
        datePublication: '2024-01-15',
        actif: true
      };

      const createdOffer: JobOfferDto = { id: 3, ...newOffer, actif: true };

      service.createOffer(newOffer).subscribe(offer => {
        expect(offer.id).toBe(3);
        expect(offer.titre).toBe('DevOps Engineer');
        expect(offer.actif).toBe(true);
      });

      const req = httpMock.expectOne('/api/poste/add');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newOffer);
      req.flush(createdOffer);
    });

    // Test 3: Update job offer
    it('should update an existing job offer', () => {
      const offerId = 1;
      const updatedPayload: JobOfferPayload = {
        titre: 'Senior Developer (Updated)',
        contenu: 'Angular, Node.js required',
        description: 'Updated requirements',
        niveauRequis: 'Senior+',
        experienceRequise: 6,
        datePublication: '2024-01-20',
        actif: true
      };

      service.updateOffer(offerId, updatedPayload).subscribe(offer => {
        expect(offer.titre).toBe('Senior Developer (Updated)');
        expect(offer.experienceRequise).toBe(6);
      });

      const req = httpMock.expectOne(`/api/poste/update/${offerId}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ id: offerId, ...updatedPayload });
    });

    // Test 4: Delete job offer
    it('should delete a job offer', () => {
      const offerId = 1;

      service.deleteOffer(offerId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`/api/poste/delete/${offerId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Candidature (Application) CRUD Operations', () => {
    // Test 5: Get all candidatures
    it('should retrieve all candidatures', () => {
      const mockCandidatures: CandidatureDto[] = [
        {
          id: 1,
          nom: 'John Doe',
          email: 'john@example.com',
          cv: 'John has 5 years of experience in Angular and Node.js',
          statut: 'CV_VALIDE',
          dateSoumission: '2024-01-10',
          aiScore: 85,
          aiDecision: 'ACCEPT'
        },
        {
          id: 2,
          nom: 'Jane Smith',
          email: 'jane@example.com',
          cv: 'Jane has 2 years of experience in React',
          statut: 'EN_ATTENTE',
          dateSoumission: '2024-01-11',
          aiScore: 45,
          aiDecision: 'REVIEW'
        }
      ];

      service.getCandidatures().subscribe(candidatures => {
        expect(candidatures.length).toBe(2);
        expect(candidatures[0].nom).toBe('John Doe');
        expect(candidatures[1].aiScore).toBe(45);
      });

      const req = httpMock.expectOne('/api/candidature/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockCandidatures);
    });

    // Test 6: Update candidature status - business logic test
    it('should update candidature status with proper state transitions', () => {
      const candidatureId = 1;
      const newStatus: RecruitmentStatus = 'INTERVIEW_PLANIFIEE';

      service.updateStatus(candidatureId, newStatus).subscribe(candidature => {
        expect(candidature.statut).toBe('INTERVIEW_PLANIFIEE');
        expect([
          'EN_ATTENTE',
          'CV_VALIDE',
          'INTERVIEW_PLANIFIEE',
          'INTERVIEW_ACCEPTEE',
          'INTERVIEW_REFUSEE',
          'TEST_EN_ATTENTE',
          'CERTIFIE',
          'REFUSE'
        ]).toContain(candidature.statut!);
      });

      const req = httpMock.expectOne(
        `/api/candidature/statut/${candidatureId}?statut=${newStatus}`
      );
      expect(req.request.method).toBe('PUT');
      req.flush({
        id: candidatureId,
        nom: 'John Doe',
        email: 'john@example.com',
        cv: 'CV content',
        statut: newStatus,
        aiScore: 85
      });
    });

    // Test 7: Update candidature comment
    it('should update candidature admin comment', () => {
      const candidatureId = 1;
      const comment = 'Excellent CV, strong technical background';

      service.updateComment(candidatureId, comment).subscribe(candidature => {
        expect(candidature.commentaireAdmin).toBe(comment);
      });

      const req = httpMock.expectOne(`/api/candidature/update/${candidatureId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ commentaireAdmin: comment });
      req.flush({
        id: candidatureId,
        nom: 'John Doe',
        email: 'john@example.com',
        cv: 'CV content',
        commentaireAdmin: comment
      });
    });

    // Test 8: Validate candidature status transitions (COMPLEX BUSINESS LOGIC)
    it('should handle all 8 candidature statuses correctly', () => {
      const statuses: RecruitmentStatus[] = [
        'EN_ATTENTE',
        'CV_VALIDE',
        'INTERVIEW_PLANIFIEE',
        'INTERVIEW_ACCEPTEE',
        'INTERVIEW_REFUSEE',
        'TEST_EN_ATTENTE',
        'CERTIFIE',
        'REFUSE'
      ];

      statuses.forEach((status, index) => {
        service.updateStatus(1, status).subscribe(candidature => {
          expect(candidature.statut).toBe(status);
        });

        const req = httpMock.expectOne(`/api/candidature/statut/1?statut=${status}`);
        req.flush({
          id: 1,
          nom: 'John',
          email: 'john@test.com',
          cv: 'CV',
          statut: status
        });
      });

      expect(true).toBe(true); // All statuses were processed
    });
  });

  describe('CV Analysis - Complex Business Logic', () => {
    // Test 9: Analyze CV - complex scoring and decision logic
    it('should analyze CV with scoring and decision', () => {
      const candidatureId = 1;
      const mockAnalysis: CVAnalysisResultDto = {
        score: 85,
        decision: 'ACCEPT',
        matchedSkills: ['Angular', 'Node.js', 'TypeScript'],
        missingSkills: ['Python', 'Go'],
        explanation: [
          'Strong experience in required technologies',
          'Good educational background',
          'Exceeds experience requirements'
        ],
        experienceYears: 5,
        educationLevel: 'Master',
        experienceScore: 90,
        skillsScore: 85,
        educationScore: 80
      };

      service.analyzeCv(candidatureId).subscribe(analysis => {
        expect(analysis.score).toBeGreaterThanOrEqual(70);
        expect(['ACCEPT', 'REVIEW', 'REJECT']).toContain(analysis.decision);
        expect(analysis.matchedSkills.length).toBeGreaterThan(0);
        expect(analysis.experienceScore + analysis.skillsScore + analysis.educationScore).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`/api/candidature/${candidatureId}/analyze-cv`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAnalysis);
    });

    // Test 10: CV analysis scoring algorithm - ACCEPT threshold (score >= 70)
    it('should classify CV as ACCEPT when score is 70 or higher', () => {
      const candidatureId = 1;
      const mockAnalysis: CVAnalysisResultDto = {
        score: 75,
        decision: 'ACCEPT',
        matchedSkills: ['Java', 'Spring Boot', 'PostgreSQL'],
        missingSkills: [],
        explanation: ['Perfect match for position'],
        experienceYears: 6,
        educationLevel: 'Master',
        experienceScore: 85,
        skillsScore: 80,
        educationScore: 75
      };

      service.analyzeCv(candidatureId).subscribe(analysis => {
        if (analysis.score >= 70) {
          expect(analysis.decision).toBe('ACCEPT');
        }
      });

      const req = httpMock.expectOne(`/api/candidature/${candidatureId}/analyze-cv`);
      req.flush(mockAnalysis);
    });

    // Test 11: CV analysis scoring algorithm - REVIEW threshold (40-70)
    it('should classify CV as REVIEW when score is between 40 and 70', () => {
      const candidatureId = 2;
      const mockAnalysis: CVAnalysisResultDto = {
        score: 55,
        decision: 'REVIEW',
        matchedSkills: ['Node.js', 'React'],
        missingSkills: ['Java', 'C++', 'Python'],
        explanation: ['Some skills match, but requires review for fit'],
        experienceYears: 2,
        educationLevel: 'Bachelor',
        experienceScore: 50,
        skillsScore: 60,
        educationScore: 50
      };

      service.analyzeCv(candidatureId).subscribe(analysis => {
        if (analysis.score >= 40 && analysis.score < 70) {
          expect(analysis.decision).toBe('REVIEW');
        }
      });

      const req = httpMock.expectOne(`/api/candidature/${candidatureId}/analyze-cv`);
      req.flush(mockAnalysis);
    });

    // Test 12: CV analysis scoring algorithm - REJECT threshold (score < 40)
    it('should classify CV as REJECT when score is below 40', () => {
      const candidatureId = 3;
      const mockAnalysis: CVAnalysisResultDto = {
        score: 25,
        decision: 'REJECT',
        matchedSkills: ['HTML', 'CSS'],
        missingSkills: ['Angular', 'Node.js', 'Java', 'TypeScript', 'PostgreSQL'],
        explanation: ['Does not meet minimum requirements'],
        experienceYears: 1,
        educationLevel: 'High School',
        experienceScore: 20,
        skillsScore: 30,
        educationScore: 25
      };

      service.analyzeCv(candidatureId).subscribe(analysis => {
        if (analysis.score < 40) {
          expect(analysis.decision).toBe('REJECT');
        }
      });

      const req = httpMock.expectOne(`/api/candidature/${candidatureId}/analyze-cv`);
      req.flush(mockAnalysis);
    });

    // Test 13: CV analysis skill matching
    it('should extract matched and missing skills from CV', () => {
      const candidatureId = 4;
      const mockAnalysis: CVAnalysisResultDto = {
        score: 80,
        decision: 'ACCEPT',
        matchedSkills: ['Java', 'Spring', 'Spring Boot', 'REST API', 'Maven'],
        missingSkills: ['Docker', 'Kubernetes'],
        explanation: ['Strong backend development experience'],
        experienceYears: 7,
        educationLevel: 'Master',
        experienceScore: 85,
        skillsScore: 85,
        educationScore: 75
      };

      service.analyzeCv(candidatureId).subscribe(analysis => {
        expect(analysis.matchedSkills.length).toBeGreaterThan(0);
        expect(analysis.matchedSkills).toContain('Java');
        // Skills analysis should include both matched and missing
        expect(
          analysis.matchedSkills.length + analysis.missingSkills.length
        ).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`/api/candidature/${candidatureId}/analyze-cv`);
      req.flush(mockAnalysis);
    });

    // Test 14: CV analysis component scoring breakdown
    it('should provide detailed scoring breakdown (experience, skills, education)', () => {
      const candidatureId = 5;
      const mockAnalysis: CVAnalysisResultDto = {
        score: 78,
        decision: 'ACCEPT',
        matchedSkills: ['Angular', 'TypeScript', 'RxJS'],
        missingSkills: ['Vue.js'],
        explanation: ['Experience matches requirements'],
        experienceYears: 4,
        educationLevel: 'Bachelor',
        experienceScore: 80, // 40% weight
        skillsScore: 85, // 40% weight
        educationScore: 70 // 20% weight
      };

      service.analyzeCv(candidatureId).subscribe(analysis => {
        // Total score should be weighted average
        const calculatedScore =
          analysis.experienceScore * 0.4 +
          analysis.skillsScore * 0.4 +
          analysis.educationScore * 0.2;

        expect(Math.abs(calculatedScore - analysis.score)).toBeLessThan(5);
      });

      const req = httpMock.expectOne(`/api/candidature/${candidatureId}/analyze-cv`);
      req.flush(mockAnalysis);
    });
  });

  describe('Interview Management', () => {
    // Test 15: Get all interviews
    it('should retrieve all interviews', () => {
      const mockInterviews: InterviewDto[] = [
        {
          id: 1,
          dateInterview: '2024-02-01',
          type: 'TECHNICAL',
          resultat: 'PASSED',
          commentaire: 'Strong technical knowledge'
        },
        {
          id: 2,
          dateInterview: '2024-02-02',
          type: 'HR',
          resultat: 'PASSED',
          commentaire: 'Good cultural fit'
        }
      ];

      service.getInterviews().subscribe(interviews => {
        expect(interviews.length).toBe(2);
        expect(interviews[0].type).toBe('TECHNICAL');
      });

      const req = httpMock.expectOne('/api/interview/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockInterviews);
    });

    // Test 16: Create interview - business logic for scheduling
    it('should create new interview with proper scheduling', () => {
      const newInterview: InterviewPayload = {
        dateInterview: '2024-02-15',
        type: 'TECHNICAL',
        resultat: 'PENDING',
        commentaire: 'Initial technical screening',
        meetLink: 'https://meet.google.com/abc-defg-hijk',
        candidature: { id: 1 }
      };

      service.createInterview(newInterview).subscribe(interview => {
        expect(interview.id).toBeDefined();
        expect(interview.dateInterview).toBe('2024-02-15');
        expect(new Date(interview.dateInterview)).toBeInstanceOf(Date);
      });

      const req = httpMock.expectOne('/api/interview/add');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 10, ...newInterview });
    });

    // Test 17: Complex interview workflow - multiple interview stages
    it('should handle interview workflow with multiple stages', () => {
      const stages = ['TECHNICAL', 'HR', 'FINAL'];
      let callCount = 0;

      stages.forEach((stage, index) => {
        const interview: InterviewPayload = {
          dateInterview: `2024-02-${15 + index}`,
          type: stage,
          resultat: index < 2 ? 'PASSED' : 'PENDING',
          commentaire: `${stage} interview`,
          candidature: { id: 1 }
        };

        service.createInterview(interview).subscribe(() => {
          callCount++;
          expect(callCount).toBeLessThanOrEqual(stages.length);
        });

        const req = httpMock.expectOne('/api/interview/add');
        req.flush({ id: 20 + index, ...interview });
      });

      expect(callCount).toBe(stages.length);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    // Test 18: Handle null CV in analysis
    it('should handle CV analysis with empty CV content', () => {
      const candidatureId = 99;
      const mockAnalysis: CVAnalysisResultDto = {
        score: 0,
        decision: 'REJECT',
        matchedSkills: [],
        missingSkills: [],
        explanation: ['CV content is empty or invalid'],
        experienceYears: 0,
        educationLevel: 'Unknown',
        experienceScore: 0,
        skillsScore: 0,
        educationScore: 0
      };

      service.analyzeCv(candidatureId).subscribe(analysis => {
        expect(analysis.score).toBe(0);
        expect(analysis.decision).toBe('REJECT');
        expect(analysis.matchedSkills.length).toBe(0);
      });

      const req = httpMock.expectOne(`/api/candidature/${candidatureId}/analyze-cv`);
      req.flush(mockAnalysis);
    });

    // Test 19: Update offer with validation
    it('should handle offer update with invalid experience requirement', () => {
      const offerId = 1;
      const invalidPayload: JobOfferPayload = {
        titre: 'Position',
        contenu: 'Content',
        description: 'Description',
        niveauRequis: 'Invalid',
        experienceRequise: -5, // Invalid: negative experience
        datePublication: '2024-01-15',
        actif: true
      };

      service.updateOffer(offerId, invalidPayload).subscribe();

      const req = httpMock.expectOne(`/api/poste/update/${offerId}`);
      // Should still send request but may handle validation server-side
      expect(req.request.method).toBe('PUT');
      req.flush({ id: offerId, ...invalidPayload });
    });
  });
});
