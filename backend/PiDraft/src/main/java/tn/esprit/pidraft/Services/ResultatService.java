package tn.esprit.pidraft.Services;


import org.springframework.stereotype.Service;
import tn.esprit.pidraft.entities.Resultat;
import tn.esprit.pidraft.Repositories.ResultatRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ResultatService {

    private final ResultatRepository repository;

    public ResultatService(ResultatRepository repository) {
        this.repository = repository;
    }

    public List<Resultat> getAll() {
        return repository.findAll();
    }

    public Optional<Resultat> getById(Long id) {
        return repository.findById(id);
    }

    public Resultat create(Resultat resultat) {
        return repository.save(resultat);
    }

    public Resultat update(Long id, Resultat resultat) {
        resultat.setId(id);
        return repository.save(resultat);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
