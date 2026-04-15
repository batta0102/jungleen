package tn.esprit.pidraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.pidraft.entities.Poste;

public interface PosteRepository extends JpaRepository<Poste, Long> {
}
