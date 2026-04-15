package tn.esprit.ressources.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.ressources.Entites.Resource;

@Repository

public interface ResourceRepository extends JpaRepository<Resource, Long> {
}
