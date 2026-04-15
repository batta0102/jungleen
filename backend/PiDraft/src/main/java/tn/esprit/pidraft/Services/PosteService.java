package tn.esprit.pidraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidraft.Repositories.PosteRepository;
import tn.esprit.pidraft.entities.Poste;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PosteService {

    private final PosteRepository posteRepository;

    public Poste addPoste(Poste poste){
        return posteRepository.save(poste);
    }

    public List<Poste> getAllPostes(){
        return posteRepository.findAll();
    }

    public Poste getPosteById(Long id){
        return posteRepository.findById(id).orElse(null);
    }

    public Poste updatePoste(Long id, Poste poste){
        Poste p = posteRepository.findById(id).orElse(null);
        if(p != null){
            p.setTitre(poste.getTitre());
            p.setContenu(poste.getContenu());
            p.setDescription(poste.getDescription());
            p.setNiveauRequis(poste.getNiveauRequis());
            p.setExperienceRequise(poste.getExperienceRequise());
            p.setDatePublication(poste.getDatePublication()); // ✅ ajouté
            p.setActif(poste.isActif());
            return posteRepository.save(p);
        }
        return null;
    }

    public void deletePoste(Long id){
        posteRepository.deleteById(id);
    }
}