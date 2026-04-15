package tn.esprit.pidraft.Repositories;


import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.pidraft.entities.QCM;
import tn.esprit.pidraft.entities.TypeCible;

import java.util.List;

public interface QCMRepository extends JpaRepository<QCM, Long> {
    List<QCM> findByCible(TypeCible cible);
}