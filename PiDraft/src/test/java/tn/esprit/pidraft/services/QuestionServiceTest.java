package tn.esprit.pidraft.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidraft.Repositories.QuestionRepository;
import tn.esprit.pidraft.Repositories.QCMRepository;
import tn.esprit.pidraft.Services.QuestionService;
import tn.esprit.pidraft.entities.Question;
import tn.esprit.pidraft.entities.QCM;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("QuestionService - Tests CRUD")
@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private QCMRepository qcmRepository;

    @InjectMocks
    private QuestionService questionService;

    private Question testQuestion;
    private QCM testQCM;

    @BeforeEach
    void setUp() {
        testQCM = new QCM();
        testQCM.setId(1L);
        testQCM.setTitre("Test QCM");

        testQuestion = new Question();
        testQuestion.setId(1L);
        testQuestion.setContenu("Quelle est la bonne réponse ?");
        testQuestion.setQcm(testQCM);
    }

    @Test
    @DisplayName("Doit récupérer toutes les questions")
    void testGetAllQuestions() {
        List<Question> questions = Arrays.asList(testQuestion);
        when(questionRepository.findAll()).thenReturn(questions);

        List<Question> result = questionService.getAllQuestions();

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(questionRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Doit récupérer une question par ID")
    void testGetQuestionById() {
        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));

        Optional<Question> result = questionService.getQuestionById(1L);

        assertTrue(result.isPresent());
        assertEquals("Quelle est la bonne réponse ?", result.get().getContenu());
        verify(questionRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Doit créer une question valide")
    void testCreateQuestion() {
        when(qcmRepository.findById(1L)).thenReturn(Optional.of(testQCM));
        when(questionRepository.save(testQuestion)).thenReturn(testQuestion);

        Question result = questionService.createQuestion(testQuestion);

        assertNotNull(result);
        assertEquals(testQCM, result.getQcm());
        verify(questionRepository, times(1)).save(testQuestion);
    }

    @Test
    @DisplayName("Doit lever exception si QCM manquant")
    void testCreateQuestionMissingQCM() {
        testQuestion.setQcm(null);

        assertThrows(RuntimeException.class, () -> questionService.createQuestion(testQuestion));
    }

    @Test
    @DisplayName("Doit lever exception si QCM ID invalide")
    void testCreateQuestionInvalidQCMId() {
        testQuestion.setQcm(new QCM());
        testQuestion.getQcm().setId(null);

        assertThrows(RuntimeException.class, () -> questionService.createQuestion(testQuestion));
    }

    @Test
    @DisplayName("Doit lever exception si QCM non trouvé")
    void testCreateQuestionQCMNotFound() {
        when(qcmRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> questionService.createQuestion(testQuestion));
    }

    @Test
    @DisplayName("Doit mettre à jour une question")
    void testUpdateQuestion() {
        testQuestion.setContenu("Nouvelle question ?");
        when(qcmRepository.findById(1L)).thenReturn(Optional.of(testQCM));
        when(questionRepository.save(any(Question.class))).thenReturn(testQuestion);

        Question result = questionService.updateQuestion(1L, testQuestion);

        assertNotNull(result);
        assertEquals("Nouvelle question ?", result.getContenu());
        verify(questionRepository, times(1)).save(any(Question.class));
    }

    @Test
    @DisplayName("Doit supprimer une question")
    void testDeleteQuestion() {
        questionService.deleteQuestion(1L);

        verify(questionRepository, times(1)).deleteById(1L);
    }
}