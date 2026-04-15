package tn.esprit.pidraft.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidraft.Repositories.ResultatRepository;
import tn.esprit.pidraft.Services.ResultatService;
import tn.esprit.pidraft.entities.Resultat;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("ResultatService - Tests CRUD")
@ExtendWith(MockitoExtension.class)
class ResultatServiceTest {

    @Mock
    private ResultatRepository resultatRepository;

    @InjectMocks
    private ResultatService resultatService;

    private Resultat testResultat;

    @BeforeEach
    void setUp() {
        testResultat = new Resultat();
        testResultat.setId(1L);
        testResultat.setScore(85.0);
    }

    @Test
    @DisplayName("Doit récupérer tous les résultats")
    void testGetAll() {
        List<Resultat> resultats = Arrays.asList(testResultat);
        when(resultatRepository.findAll()).thenReturn(resultats);

        List<Resultat> result = resultatService.getAll();

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(resultatRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Doit récupérer un résultat par ID")
    void testGetById() {
        when(resultatRepository.findById(1L)).thenReturn(Optional.of(testResultat));

        Optional<Resultat> result = resultatService.getById(1L);

        assertTrue(result.isPresent());
        assertEquals(85, result.get().getScore());
        verify(resultatRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Doit créer un résultat")
    void testCreate() {
        when(resultatRepository.save(testResultat)).thenReturn(testResultat);

        Resultat result = resultatService.create(testResultat);

        assertNotNull(result);
        assertEquals(85.0, result.getScore());
        verify(resultatRepository, times(1)).save(testResultat);
    }

    @Test
    @DisplayName("Doit mettre à jour un résultat")
    void testUpdate() {
        testResultat.setScore(90.0);
        when(resultatRepository.save(any(Resultat.class))).thenReturn(testResultat);

        Resultat result = resultatService.update(1L, testResultat);

        assertNotNull(result);
        assertEquals(90.0, result.getScore());
        verify(resultatRepository, times(1)).save(any(Resultat.class));
    }

    @Test
    @DisplayName("Doit supprimer un résultat")
    void testDelete() {
        resultatService.delete(1L);

        verify(resultatRepository, times(1)).deleteById(1L);
    }
}
