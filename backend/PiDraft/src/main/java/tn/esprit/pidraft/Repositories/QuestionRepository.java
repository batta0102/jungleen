package tn.esprit.pidraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.pidraft.entities.Question;

public interface QuestionRepository extends JpaRepository<Question, Long> {
}
