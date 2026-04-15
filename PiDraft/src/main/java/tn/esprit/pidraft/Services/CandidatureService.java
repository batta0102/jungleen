package tn.esprit.pidraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidraft.Repositories.CandidatureRepository;
import tn.esprit.pidraft.entities.Candidature;
import tn.esprit.pidraft.entities.StatutCandidature;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CandidatureService {

    private final CandidatureRepository repository;

    public Candidature add(Candidature c){
        c.setDateSoumission(LocalDate.now());
        c.setStatut(StatutCandidature.EN_ATTENTE);
        return repository.save(c);
    }

    public List<Candidature> getAll(){
        return repository.findAll();
    }

    public Candidature getById(Long id){
        return repository.findById(id)
                .orElseThrow();
    }

    public Candidature update(Long id, Candidature c){

        Candidature cand = getById(id);

        cand.setCommentaireAdmin(
                c.getCommentaireAdmin());

        return repository.save(cand);
    }

    public Candidature updateStatut
            (Long id,
             StatutCandidature statut){

        Candidature cand = getById(id);
        cand.setStatut(statut);
        return repository.save(cand);
    }

    public void delete(Long id){
        repository.deleteById(id);
    }
}
