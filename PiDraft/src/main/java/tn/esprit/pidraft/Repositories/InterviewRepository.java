package tn.esprit.pidraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidraft.entities.Interview;

@Repository
public interface InterviewRepository
        extends JpaRepository<Interview, Long> {
}
