package tn.esprit.pidraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidraft.entities.Certificat;

import java.util.List;

@Repository
public interface CertificatRepository
        extends JpaRepository<Certificat, Long> {

    List<Certificat> findByUserEmail(String userEmail);
    boolean existsByUserEmail(String userEmail);
}
