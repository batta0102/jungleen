package tn.esprit.pidraft.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidraft.Repositories.CandidatureRepository;
import tn.esprit.pidraft.Services.CandidatureService;
import tn.esprit.pidraft.entities.Candidature;
import tn.esprit.pidraft.entities.StatutCandidature;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("CandidatureService - Tests CRUD")
@ExtendWith(MockitoExtension.class)
class CandidatureServiceTest {

    @Mock
    private CandidatureRepository candidatureRepository;

    @InjectMocks
    private CandidatureService candidatureService;

    private Candidature testCandidature;

    @BeforeEach
    void setUp() {
        testCandidature = new Candidature();
        testCandidature.setId(1L);
        testCandidature.setNom("John Doe");
        testCandidature.setEmail("john@example.com");
        testCandidature.setCv("CV content");
        testCandidature.setStatut(StatutCandidature.EN_ATTENTE);
    }

    // ==================== TESTS CRUD ====================

    @Test
    @DisplayName("Doit ajouter une candidature avec statut EN_ATTENTE")
    void testAddCandidature() {
        when(candidatureRepository.save(any(Candidature.class))).thenReturn(testCandidature);

        Candidature result = candidatureService.add(testCandidature);

        assertNotNull(result);
        assertEquals(StatutCandidature.EN_ATTENTE, result.getStatut());
        assertNotNull(result.getDateSoumission());
        assertEquals(LocalDate.now(), result.getDateSoumission());
        verify(candidatureRepository, times(1)).save(testCandidature);
    }

    @Test
    @DisplayName("Doit récupérer tous les candidatures")
    void testGetAll() {
        List<Candidature> candidatures = Arrays.asList(testCandidature);
        when(candidatureRepository.findAll()).thenReturn(candidatures);

        List<Candidature> result = candidatureService.getAll();

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(candidatureRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Doit récupérer une candidature par ID")
    void testGetById() {
        when(candidatureRepository.findById(1L)).thenReturn(Optional.of(testCandidature));

        Candidature result = candidatureService.getById(1L);

        assertNotNull(result);
        assertEquals("John Doe", result.getNom());
        verify(candidatureRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Doit lever exception si candidature non trouvée")
    void testGetByIdNotFound() {
        when(candidatureRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> candidatureService.getById(999L));
    }

    @Test
    @DisplayName("Doit mettre à jour le commentaire admin")
    void testUpdateCandidature() {
        testCandidature.setCommentaireAdmin("Bon candidat");
        when(candidatureRepository.findById(1L)).thenReturn(Optional.of(testCandidature));
        when(candidatureRepository.save(any(Candidature.class))).thenReturn(testCandidature);

        Candidature result = candidatureService.update(1L, testCandidature);

        assertNotNull(result);
        assertEquals("Bon candidat", result.getCommentaireAdmin());
        verify(candidatureRepository, times(1)).save(any(Candidature.class));
    }

    @Test
    @DisplayName("Doit mettre à jour le statut")
    void testUpdateStatut() {
        when(candidatureRepository.findById(1L)).thenReturn(Optional.of(testCandidature));
        when(candidatureRepository.save(any(Candidature.class))).thenReturn(testCandidature);

        Candidature result = candidatureService.updateStatut(1L, StatutCandidature.CV_VALIDE);

        assertNotNull(result);
        assertEquals(StatutCandidature.CV_VALIDE, result.getStatut());
        verify(candidatureRepository, times(1)).save(any(Candidature.class));
    }

    @Test
    @DisplayName("Doit supprimer une candidature")
    void testDelete() {
        candidatureService.delete(1L);

        verify(candidatureRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Doit traiter tous les statuts possibles")
    void testAllStatusTransitions() {
        StatutCandidature[] statuts = {
            StatutCandidature.EN_ATTENTE,
            StatutCandidature.CV_VALIDE,
            StatutCandidature.INTERVIEW_PLANIFIEE,
            StatutCandidature.INTERVIEW_ACCEPTEE,
            StatutCandidature.INTERVIEW_REFUSEE,
            StatutCandidature.TEST_EN_ATTENTE,
            StatutCandidature.CERTIFIE,
            StatutCandidature.REFUSE
        };

        for (StatutCandidature statut : statuts) {
            when(candidatureRepository.findById(1L)).thenReturn(Optional.of(testCandidature));
            when(candidatureRepository.save(any(Candidature.class))).thenReturn(testCandidature);

            Candidature result = candidatureService.updateStatut(1L, statut);
            assertEquals(statut, result.getStatut());
        }
    }
}
