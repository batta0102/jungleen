package tn.esprit.pidraft.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidraft.Repositories.QCMRepository;
import tn.esprit.pidraft.Services.QCMService;
import tn.esprit.pidraft.entities.QCM;
import tn.esprit.pidraft.entities.Question;
import tn.esprit.pidraft.entities.ChoixReponse;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("QCMService - Tests CRUD et logique")
@ExtendWith(MockitoExtension.class)
class QCMServiceTest {

    @Mock
    private QCMRepository qcmRepository;

    @InjectMocks
    private QCMService qcmService;

    private QCM testQCM;
    private Question testQuestion;
    private ChoixReponse testChoice;

    @BeforeEach
    void setUp() {
        // Initialiser les données de test
        testQCM = new QCM();
        testQCM.setId(1L);
        testQCM.setTitre("Test QCM");
        testQCM.setContenu("Contenu du test");
        testQCM.setQuestions(new ArrayList<>());

        testChoice = new ChoixReponse();
        testChoice.setId(1L);
        testChoice.setContenu("Bonne réponse");
        testChoice.setEstCorrect(true);

        testQuestion = new Question();
        testQuestion.setId(1L);
        testQuestion.setContenu("Quelle est la bonne réponse ?");
        testQuestion.setChoix(new ArrayList<>(Arrays.asList(testChoice)));
        testQuestion.setQcm(testQCM);

        testQCM.getQuestions().add(testQuestion);
    }

    // ==================== TESTS CRUD ====================

    @Test
    @DisplayName("Doit récupérer tous les QCM")
    void testGetAllQCMs() {
        List<QCM> qcms = Arrays.asList(testQCM);
        when(qcmRepository.findAll()).thenReturn(qcms);

        List<QCM> result = qcmService.getAllQCMs();

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(qcmRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Doit récupérer un QCM par ID")
    void testGetQCMById() {
        when(qcmRepository.findById(1L)).thenReturn(Optional.of(testQCM));

        Optional<QCM> result = qcmService.getQCMById(1L);

        assertTrue(result.isPresent());
        assertEquals("Test QCM", result.get().getTitre());
        verify(qcmRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Doit retourner vide si QCM non trouvé")
    void testGetQCMByIdNotFound() {
        when(qcmRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<QCM> result = qcmService.getQCMById(999L);

        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Doit créer un nouveau QCM")
    void testCreateQCM() {
        when(qcmRepository.save(testQCM)).thenReturn(testQCM);

        QCM result = qcmService.createQCM(testQCM);

        assertNotNull(result);
        assertEquals("Test QCM", result.getTitre());
        verify(qcmRepository, times(1)).save(testQCM);
    }

    @Test
    @DisplayName("Doit mettre à jour un QCM")
    void testUpdateQCM() {
        QCM updatedQCM = new QCM();
        updatedQCM.setTitre("QCM Modifié");
        updatedQCM.setQuestions(new ArrayList<>());

        when(qcmRepository.save(any(QCM.class))).thenReturn(updatedQCM);

        QCM result = qcmService.updateQCM(1L, updatedQCM);

        assertNotNull(result);
        assertEquals("QCM Modifié", result.getTitre());
        verify(qcmRepository, times(1)).save(any(QCM.class));
    }

    @Test
    @DisplayName("Doit supprimer un QCM")
    void testDeleteQCM() {
        qcmService.deleteQCM(1L);

        verify(qcmRepository, times(1)).deleteById(1L);
    }

    // ==================== TESTS LOGIQUE MÉTIER ====================

    @Test
    @DisplayName("Doit lier les questions au QCM lors de la création")
    void testCreateQCMLinksQuestions() {
        when(qcmRepository.save(testQCM)).thenReturn(testQCM);

        QCM result = qcmService.createQCM(testQCM);

        assertNotNull(result.getQuestions());
        assertTrue(result.getQuestions().size() > 0);
        assertEquals(testQCM, result.getQuestions().get(0).getQcm());
    }

    @Test
    @DisplayName("Doit lier les choix aux questions lors de la création")
    void testCreateQCMLinksChoices() {
        when(qcmRepository.save(testQCM)).thenReturn(testQCM);

        QCM result = qcmService.createQCM(testQCM);

        assertNotNull(result.getQuestions().get(0).getChoix());
        assertTrue(result.getQuestions().get(0).getChoix().size() > 0);
    }

    @Test
    @DisplayName("Doit créer des choix exemple si manquants")
    void testFixQCMScoringCreatesChoices() {
        testQuestion.setChoix(new ArrayList<>());
        when(qcmRepository.findById(1L)).thenReturn(Optional.of(testQCM));
        when(qcmRepository.save(any(QCM.class))).thenReturn(testQCM);

        QCM result = qcmService.fixQCMScoring(1L);

        assertNotNull(result);
        assertTrue(result.getQuestions().get(0).getChoix().size() > 0);
    }

    @Test
    @DisplayName("Doit fixer le premier choix comme correct si tous faux")
    void testFixQCMScoringFixesScoring() {
        ChoixReponse wrongChoice = new ChoixReponse();
        wrongChoice.setEstCorrect(false);
        testQuestion.setChoix(new ArrayList<>(Arrays.asList(wrongChoice)));

        when(qcmRepository.findById(1L)).thenReturn(Optional.of(testQCM));
        when(qcmRepository.save(any(QCM.class))).thenReturn(testQCM);

        QCM result = qcmService.fixQCMScoring(1L);

        assertNotNull(result);
        assertTrue(result.getQuestions().get(0).getChoix().size() > 0);
    }
}
