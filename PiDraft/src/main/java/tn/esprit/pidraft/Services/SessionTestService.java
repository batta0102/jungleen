package tn.esprit.pidraft.Services;


import org.springframework.stereotype.Service;
import tn.esprit.pidraft.entities.SessionTest;
import tn.esprit.pidraft.Repositories.SessionTestRepository;

import java.util.List;
import java.util.Optional;

@Service
public class SessionTestService {

    private final SessionTestRepository repository;

    public SessionTestService(SessionTestRepository repository) {
        this.repository = repository;
    }

    public List<SessionTest> getAll() {
        return repository.findAll();
    }

    public Optional<SessionTest> getById(Long id) {
        return repository.findById(id);
    }

    public SessionTest create(SessionTest sessionTest) {
        return repository.save(sessionTest);
    }

    public SessionTest update(Long id, SessionTest updatedSessionTest) {
        return repository.findById(id).map(existingSession -> {
            // Only update fields that are provided (not null)
            if (updatedSessionTest.getDateDebut() != null) {
                existingSession.setDateDebut(updatedSessionTest.getDateDebut());
            }
            if (updatedSessionTest.getDateFin() != null) {
                existingSession.setDateFin(updatedSessionTest.getDateFin());
            }
            if (updatedSessionTest.getStatut() != null) {
                existingSession.setStatut(updatedSessionTest.getStatut());
            }
            if (updatedSessionTest.getScoreTotal() != null) {
                existingSession.setScoreTotal(updatedSessionTest.getScoreTotal());
            }
            if (updatedSessionTest.getPourcentage() != null) {
                existingSession.setPourcentage(updatedSessionTest.getPourcentage());
            }
            if (updatedSessionTest.getTempsPasseSecondes() != null) {
                existingSession.setTempsPasseSecondes(updatedSessionTest.getTempsPasseSecondes());
            }
            if (updatedSessionTest.getTabSwitchCount() != null) {
                existingSession.setTabSwitchCount(updatedSessionTest.getTabSwitchCount());
            }
            if (updatedSessionTest.getSuspiciousBehavior() != null) {
                existingSession.setSuspiciousBehavior(updatedSessionTest.getSuspiciousBehavior());
            }
            
            System.out.println("✅ Updating session " + id + " with: " + updatedSessionTest);
            return repository.save(existingSession);
        }).orElseThrow(() -> new RuntimeException("Session not found with id: " + id));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
