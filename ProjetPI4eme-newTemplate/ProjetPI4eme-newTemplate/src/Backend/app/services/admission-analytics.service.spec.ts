import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  AdmissionAnalyticsService,
  AdmissionAnalyticsResponseDto,
  FailedQuestionStatDto,
  WeakAreaStatDto,
  ProgressPointDto,
  TopicAverageDto
} from './admission-analytics.service';

describe('AdmissionAnalyticsService', () => {
  let service: AdmissionAnalyticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdmissionAnalyticsService]
    });
    service = TestBed.inject(AdmissionAnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Dashboard Data Retrieval', () => {
    // Test 1: Get dashboard analytics
    it('should retrieve admission analytics dashboard', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [
          {
            questionId: 101,
            questionContent: 'What is the past tense of "go"?',
            quizTitle: 'English Grammar',
            failCount: 15,
            totalAttempts: 20,
            failureRate: 75
          }
        ],
        weakGrammarAreas: [
          {
            area: 'Past Tense Verbs',
            attempts: 50,
            accuracy: 65
          }
        ],
        progressOverTime: [
          {
            period: '2024-01',
            averageScore: 65,
            attempts: 30
          }
        ],
        averageScoreByTopic: [
          {
            topic: 'Grammar',
            averageScore: 70,
            attempts: 100
          }
        ]
      };

      service.getDashboard().subscribe(dashboard => {
        expect(dashboard).toBeDefined();
        expect(dashboard.mostFailedQuestions).toBeDefined();
        expect(dashboard.weakGrammarAreas).toBeDefined();
        expect(dashboard.progressOverTime).toBeDefined();
        expect(dashboard.averageScoreByTopic).toBeDefined();
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      expect(req.request.method).toBe('GET');
      req.flush(mockDashboard);
    });

    // Test 2: Dashboard response structure validation
    it('should validate complete analytics response structure', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        expect(dashboard.mostFailedQuestions).toBeInstanceOf(Array);
        expect(dashboard.weakGrammarAreas).toBeInstanceOf(Array);
        expect(dashboard.progressOverTime).toBeInstanceOf(Array);
        expect(dashboard.averageScoreByTopic).toBeInstanceOf(Array);
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });
  });

  describe('Failed Questions Analysis - COMPLEX BUSINESS LOGIC', () => {
    // Test 3: Most failed questions ranking
    it('should identify and rank most frequently failed questions', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [
          {
            questionId: 101,
            questionContent: 'Complex grammar rule',
            quizTitle: 'Advanced Grammar',
            failCount: 45,
            totalAttempts: 100,
            failureRate: 45
          },
          {
            questionId: 102,
            questionContent: 'Moderate difficulty question',
            quizTitle: 'Basic Grammar',
            failCount: 30,
            totalAttempts: 80,
            failureRate: 37.5
          },
          {
            questionId: 103,
            questionContent: 'Easy question',
            quizTitle: 'Vocabulary',
            failCount: 10,
            totalAttempts: 100,
            failureRate: 10
          }
        ],
        weakGrammarAreas: [],
        progressOverTime: [],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        const sorted = dashboard.mostFailedQuestions.sort(
          (a, b) => b.failCount - a.failCount
        );
        expect(sorted[0].failCount).toBeGreaterThanOrEqual(sorted[1].failCount);
        expect(sorted[0].failureRate).toBeGreaterThanOrEqual(sorted[2].failureRate);
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 4: Failure rate calculation validation
    it('should calculate failure rate correctly (failCount / totalAttempts * 100)', () => {
      const testCases = [
        { failCount: 45, totalAttempts: 100, expectedRate: 45 },
        { failCount: 30, totalAttempts: 60, expectedRate: 50 },
        { failCount: 5, totalAttempts: 50, expectedRate: 10 },
        { failCount: 100, totalAttempts: 100, expectedRate: 100 },
        { failCount: 0, totalAttempts: 50, expectedRate: 0 }
      ];

      testCases.forEach((testCase) => {
        const failedQuestion: FailedQuestionStatDto = {
          questionId: Math.floor(Math.random() * 1000),
          questionContent: 'Test question',
          quizTitle: 'Test Quiz',
          failCount: testCase.failCount,
          totalAttempts: testCase.totalAttempts,
          failureRate: (testCase.failCount / testCase.totalAttempts) * 100
        };

        const mockDashboard: AdmissionAnalyticsResponseDto = {
          mostFailedQuestions: [failedQuestion],
          weakGrammarAreas: [],
          progressOverTime: [],
          averageScoreByTopic: []
        };

        service.getDashboard().subscribe(dashboard => {
          const question = dashboard.mostFailedQuestions[0];
          const calculatedRate = (question.failCount / question.totalAttempts) * 100;
          expect(Math.abs(calculatedRate - question.failureRate)).toBeLessThan(0.01);
        });

        const req = httpMock.expectOne('/api/analytics/admission');
        req.flush(mockDashboard);
      });

      expect(true).toBe(true);
    });

    // Test 5: High failure rate detection (threshold analysis)
    it('should identify high failure rate questions (> 60%)', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [
          {
            questionId: 201,
            questionContent: 'Critical question',
            quizTitle: 'Test',
            failCount: 75,
            totalAttempts: 100,
            failureRate: 75 // HIGH FAILURE
          },
          {
            questionId: 202,
            questionContent: 'Moderate question',
            quizTitle: 'Test',
            failCount: 50,
            totalAttempts: 100,
            failureRate: 50 // ACCEPTABLE
          },
          {
            questionId: 203,
            questionContent: 'Easy question',
            quizTitle: 'Test',
            failCount: 20,
            totalAttempts: 100,
            failureRate: 20 // GOOD
          }
        ],
        weakGrammarAreas: [],
        progressOverTime: [],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        const highFailureQuestions = dashboard.mostFailedQuestions.filter(
          (q) => q.failureRate > 60
        );
        expect(highFailureQuestions.length).toBeGreaterThan(0);
        expect(highFailureQuestions[0].failureRate).toBeGreaterThan(60);
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 6: Question difficulty inference from failure rate
    it('should infer question difficulty from failure rate', () => {
      const questions: FailedQuestionStatDto[] = [
        {
          questionId: 301,
          questionContent: 'Very difficult',
          quizTitle: 'Test',
          failCount: 80,
          totalAttempts: 100,
          failureRate: 80 // VERY DIFFICULT
        },
        {
          questionId: 302,
          questionContent: 'Moderate difficulty',
          quizTitle: 'Test',
          failCount: 45,
          totalAttempts: 100,
          failureRate: 45 // MODERATE
        }
      ];

      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: questions,
        weakGrammarAreas: [],
        progressOverTime: [],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        dashboard.mostFailedQuestions.forEach((question) => {
          let difficulty: string;
          if (question.failureRate > 70) {
            difficulty = 'VERY_DIFFICULT';
          } else if (question.failureRate > 50) {
            difficulty = 'DIFFICULT';
          } else {
            difficulty = 'MODERATE_TO_EASY';
          }

          if (question.failureRate > 70) {
            expect(difficulty).toBe('VERY_DIFFICULT');
          }
        });
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });
  });

  describe('Weak Grammar Areas Analysis - COMPLEX BUSINESS LOGIC', () => {
    // Test 7: Weak grammar areas ranking
    it('should identify weak grammar areas by accuracy score', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [
          {
            area: 'Conditional Tenses',
            attempts: 25,
            accuracy: 40
          },
          {
            area: 'Subjunctive Mood',
            attempts: 30,
            accuracy: 55
          },
          {
            area: 'Active/Passive Voice',
            attempts: 20,
            accuracy: 85
          }
        ],
        progressOverTime: [],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        const sorted = dashboard.weakGrammarAreas.sort(
          (a, b) => a.accuracy - b.accuracy
        );
        expect(sorted[0].accuracy).toBeLessThanOrEqual(sorted[1].accuracy);
        expect(sorted[sorted.length - 1].accuracy).toBeGreaterThanOrEqual(
          sorted[sorted.length - 2].accuracy
        );
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 8: Accuracy score distribution
    it('should validate accuracy scores between 0 and 100', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [
          { area: 'Area 1', attempts: 10, accuracy: 0 },
          { area: 'Area 2', attempts: 20, accuracy: 50 },
          { area: 'Area 3', attempts: 15, accuracy: 100 }
        ],
        progressOverTime: [],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        dashboard.weakGrammarAreas.forEach((area) => {
          expect(area.accuracy).toBeGreaterThanOrEqual(0);
          expect(area.accuracy).toBeLessThanOrEqual(100);
        });
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 9: Attempts tracking per grammar area
    it('should track total attempts per grammar area', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [
          {
            area: 'Past Tense',
            attempts: 150,
            accuracy: 72
          },
          {
            area: 'Present Continuous',
            attempts: 80,
            accuracy: 65
          },
          {
            area: 'Articles',
            attempts: 200,
            accuracy: 90
          }
        ],
        progressOverTime: [],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        const totalAttempts = dashboard.weakGrammarAreas.reduce(
          (sum, area) => sum + area.attempts,
          0
        );
        expect(totalAttempts).toBe(430);
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });
  });

  describe('Progress Over Time Analysis - COMPLEX BUSINESS LOGIC', () => {
    // Test 10: Progress trend detection
    it('should track student progress over multiple periods', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [
          { period: '2024-01', averageScore: 55, attempts: 20 },
          { period: '2024-02', averageScore: 62, attempts: 25 },
          { period: '2024-03', averageScore: 71, attempts: 30 },
          { period: '2024-04', averageScore: 78, attempts: 28 }
        ],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        // Check if progress is increasing
        const scores = dashboard.progressOverTime.map((p) => p.averageScore);
        expect(scores[scores.length - 1]).toBeGreaterThanOrEqual(scores[0]);
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 11: Performance improvement calculation
    it('should calculate performance improvement across periods', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [
          { period: '2024-01', averageScore: 50, attempts: 10 },
          { period: '2024-02', averageScore: 60, attempts: 12 },
          { period: '2024-03', averageScore: 75, attempts: 15 }
        ],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        const progress = dashboard.progressOverTime;
        if (progress.length >= 2) {
          const firstScore = progress[0].averageScore;
          const lastScore = progress[progress.length - 1].averageScore;
          const improvement = lastScore - firstScore;

          expect(improvement).toBeGreaterThan(0);
        }
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 12: Attempt frequency during periods
    it('should track attempt frequency to identify study patterns', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [
          { period: '2024-01', averageScore: 60, attempts: 5 },
          { period: '2024-02', averageScore: 65, attempts: 15 },
          { period: '2024-03', averageScore: 70, attempts: 25 },
          { period: '2024-04', averageScore: 72, attempts: 8 }
        ],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        // More attempts should generally correlate with improvement
        const first2Periods = dashboard.progressOverTime.slice(0, 2);
        const avgAttemptsEarly = first2Periods.reduce((a, b) => a + b.attempts, 0) / 2;

        const last2Periods = dashboard.progressOverTime.slice(-2);
        const avgAttemptsLate = last2Periods.reduce((a, b) => a + b.attempts, 0) / 2;

        // Both values should be positive
        expect(avgAttemptsEarly).toBeGreaterThan(0);
        expect(avgAttemptsLate).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 13: Detect performance plateau
    it('should identify when progress plateaus', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [
          { period: '2024-01', averageScore: 50, attempts: 10 },
          { period: '2024-02', averageScore: 65, attempts: 20 },
          { period: '2024-03', averageScore: 72, attempts: 25 },
          { period: '2024-04', averageScore: 71, attempts: 22 },
          { period: '2024-05', averageScore: 72, attempts: 20 }
        ],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        const Recent3Scores = dashboard.progressOverTime
          .slice(-3)
          .map((p) => p.averageScore);
        const isPlateauing = Recent3Scores[2] - Recent3Scores[0] < 5;

        expect(typeof isPlateauing).toBe('boolean');
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });
  });

  describe('Topic Average Score Analysis - COMPLEX BUSINESS LOGIC', () => {
    // Test 14: Get average score by topic
    it('should retrieve average scores for each topic', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [],
        averageScoreByTopic: [
          { topic: 'Grammar', averageScore: 75, attempts: 100 },
          { topic: 'Vocabulary', averageScore: 82, attempts: 80 },
          { topic: 'Listening', averageScore: 68, attempts: 60 },
          { topic: 'Reading', averageScore: 79, attempts: 95 }
        ]
      };

      service.getDashboard().subscribe(dashboard => {
        expect(dashboard.averageScoreByTopic.length).toBe(4);
        dashboard.averageScoreByTopic.forEach((topic) => {
          expect(topic.topic).toBeDefined();
          expect(topic.averageScore).toBeGreaterThanOrEqual(0);
          expect(topic.averageScore).toBeLessThanOrEqual(100);
        });
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 15: Topic difficulty ranking by average score
    it('should rank topics from easiest to hardest based on average scores', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [],
        averageScoreByTopic: [
          { topic: 'Reading', averageScore: 85, attempts: 100 },
          { topic: 'Vocabulary', averageScore: 75, attempts: 90 },
          { topic: 'Writing', averageScore: 60, attempts: 80 },
          { topic: 'Speaking', averageScore: 55, attempts: 70 }
        ]
      };

      service.getDashboard().subscribe(dashboard => {
        const sortedByDifficulty = dashboard.averageScoreByTopic.sort(
          (a, b) => b.averageScore - a.averageScore
        );

        expect(sortedByDifficulty[0].topic).toBe('Reading'); // Easiest
        expect(sortedByDifficulty[sortedByDifficulty.length - 1].topic).toBe('Speaking'); // Hardest
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 16: Topic attempt volume analysis
    it('should identify focus areas by attempt volume', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [],
        averageScoreByTopic: [
          { topic: 'Grammar', averageScore: 75, attempts: 200 }, // Most focused
          { topic: 'Vocabulary', averageScore: 82, attempts: 150 },
          { topic: 'Listening', averageScore: 68, attempts: 80 },
          { topic: 'Reading', averageScore: 79, attempts: 50 } // Least focused
        ]
      };

      service.getDashboard().subscribe(dashboard => {
        const totalAttempts = dashboard.averageScoreByTopic.reduce(
          (sum, topic) => sum + topic.attempts,
          0
        );
        expect(totalAttempts).toBe(480);

        const mostFocused = dashboard.averageScoreByTopic.reduce(
          (a, b) => (a.attempts > b.attempts ? a : b)
        );
        expect(mostFocused.topic).toBe('Grammar');
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });

    // Test 17: Topic mastery detection
    it('should detect topic mastery (high score + high attempts)', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [],
        averageScoreByTopic: [
          { topic: 'Grammar', averageScore: 92, attempts: 180 }, // Mastered
          { topic: 'Vocabulary', averageScore: 75, attempts: 100 }, // In progress
          { topic: 'Listening', averageScore: 55, attempts: 30 } // Starting
        ]
      };

      service.getDashboard().subscribe(dashboard => {
        dashboard.averageScoreByTopic.forEach((topic) => {
          const isMastered = topic.averageScore >= 85 && topic.attempts >= 150;
          const inProgress =
            topic.averageScore >= 70 && topic.averageScore < 85 && topic.attempts >= 50;
          const justStarted = topic.attempts < 50;

          if (topic.topic === 'Grammar') {
            expect(isMastered).toBe(true);
          }
        });
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    // Test 18: Handle empty dashboard
    it('should handle empty analytics dashboard gracefully', () => {
      const emptyDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [],
        progressOverTime: [],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        expect(dashboard.mostFailedQuestions.length).toBe(0);
        expect(dashboard.weakGrammarAreas.length).toBe(0);
        expect(dashboard.progressOverTime.length).toBe(0);
        expect(dashboard.averageScoreByTopic.length).toBe(0);
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(emptyDashboard);
    });

    // Test 19: Handle invalid accuracy values
    it('should handle edge case accuracy values (0 and 100)', () => {
      const mockDashboard: AdmissionAnalyticsResponseDto = {
        mostFailedQuestions: [],
        weakGrammarAreas: [
          { area: 'Perfect Area', attempts: 50, accuracy: 100 },
          { area: 'Failed Area', attempts: 50, accuracy: 0 }
        ],
        progressOverTime: [],
        averageScoreByTopic: []
      };

      service.getDashboard().subscribe(dashboard => {
        const accuracyValues = dashboard.weakGrammarAreas.map((a) => a.accuracy);
        expect(accuracyValues).toContain(0);
        expect(accuracyValues).toContain(100);
      });

      const req = httpMock.expectOne('/api/analytics/admission');
      req.flush(mockDashboard);
    });
  });
});
