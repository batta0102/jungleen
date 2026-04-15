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

    public SessionTest update(Long id, SessionTest sessionTest) {
        // Find existing record and update its fields
        Optional<SessionTest> existing = repository.findById(id);
        if (existing.isPresent()) {
            SessionTest st = existing.get();
            st.setDateDebut(sessionTest.getDateDebut());
            st.setDateFin(sessionTest.getDateFin());
            st.setStatut(sessionTest.getStatut());
            st.setScoreTotal(sessionTest.getScoreTotal());
            // Also update percentage and time for certification tracking
            if (sessionTest.getPourcentage() != null) {
                st.setPourcentage(sessionTest.getPourcentage());
            }
            if (sessionTest.getTempsPasseSecondes() != null) {
                st.setTempsPasseSecondes(sessionTest.getTempsPasseSecondes());
            }
            // Preserve userEmail/userName if incoming session has them, otherwise keep existing
            if (sessionTest.getUserEmail() != null && !sessionTest.getUserEmail().isBlank()) {
                st.setUserEmail(sessionTest.getUserEmail());
            }
            if (sessionTest.getUserName() != null && !sessionTest.getUserName().isBlank()) {
                st.setUserName(sessionTest.getUserName());
            }
            return repository.save(st);
        }
        return null;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
