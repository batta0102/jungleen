package tn.esprit.pidraft.Services;


import org.springframework.stereotype.Service;
import tn.esprit.pidraft.entities.ReponseDonnee;
import tn.esprit.pidraft.Repositories.ReponseDonneeRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ReponseDonneeService {

    private final ReponseDonneeRepository repository;

    public ReponseDonneeService(ReponseDonneeRepository repository) {
        this.repository = repository;
    }

    public List<ReponseDonnee> getAll() {
        return repository.findAll();
    }

    public Optional<ReponseDonnee> getById(Long id) {
        return repository.findById(id);
    }

    public ReponseDonnee create(ReponseDonnee reponseDonnee) {
        return repository.save(reponseDonnee);
    }

    public ReponseDonnee update(Long id, ReponseDonnee reponseDonnee) {
        Optional<ReponseDonnee> existing = repository.findById(id);
        if (existing.isPresent()) {
            ReponseDonnee rd = existing.get();
            rd.setEstCorrect(reponseDonnee.getEstCorrect());
            rd.setScoreObtenu(reponseDonnee.getScoreObtenu());
            rd.setQuestion(reponseDonnee.getQuestion());
            rd.setSessionTest(reponseDonnee.getSessionTest());
            return repository.save(rd);
        }
        return null;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
