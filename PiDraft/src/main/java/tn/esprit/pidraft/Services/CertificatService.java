package tn.esprit.pidraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidraft.Repositories.CandidatureRepository;
import tn.esprit.pidraft.Repositories.CertificatRepository;
import tn.esprit.pidraft.Repositories.ResultatRepository;
import tn.esprit.pidraft.entities.Candidature;
import tn.esprit.pidraft.entities.Certificat;
import tn.esprit.pidraft.entities.Resultat;
import tn.esprit.pidraft.entities.StatutCandidature;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class CertificatService {

    private final CertificatRepository repository;

    public Certificat add(Certificat c){
        return repository.save(c);
    }

    public List<Certificat> getAll(){
        return repository.findAll();
    }

    public Certificat getById(Long id){
        return repository.findById(id)
                .orElseThrow();
    }

    public Certificat update(Long id,
                             Certificat c){

        Certificat cert = getById(id);

        cert.setNumeroCertificat(
                c.getNumeroCertificat());
        cert.setScoreFinal(
                c.getScoreFinal());
        cert.setMatiere(
                c.getMatiere());
        cert.setDateDelivrance(
                c.getDateDelivrance());

        return repository.save(cert);
    }

    public void delete(Long id){
        repository.deleteById(id);
    }
}