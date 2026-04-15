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

    public List<ReponseDonnee> getBySessionTestId(Long sessionTestId) {
        return repository.findBySessionTestId(sessionTestId);
    }

    public ReponseDonnee create(ReponseDonnee reponseDonnee) {
        return repository.save(reponseDonnee);
    }

    public ReponseDonnee update(Long id, ReponseDonnee reponseDonnee) {
        reponseDonnee.setId(id);
        return repository.save(reponseDonnee);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
