package tn.esprit.pidraft.Services;

import org.springframework.stereotype.Service;
import tn.esprit.pidraft.entities.ChoixReponse;
import tn.esprit.pidraft.entities.Question;
import tn.esprit.pidraft.Repositories.ChoixReponseRepository;
import tn.esprit.pidraft.Repositories.QuestionRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ChoixReponseService {

    private final ChoixReponseRepository repository;
    private final QuestionRepository questionRepository;

    public ChoixReponseService(ChoixReponseRepository repository, QuestionRepository questionRepository) {
        this.repository = repository;
        this.questionRepository = questionRepository;
    }

    public List<ChoixReponse> getAllChoix() {
        return repository.findAll();
    }

    public Optional<ChoixReponse> getChoixById(Long id) {
        return repository.findById(id);
    }

    public ChoixReponse createChoix(ChoixReponse choix) {

        Long questionId = choix.getQuestion().getId();

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        choix.setQuestion(question);

        return repository.save(choix);
    }

    public ChoixReponse updateChoix(Long id, ChoixReponse choix) {

        Long questionId = choix.getQuestion().getId();

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        choix.setId(id);
        choix.setQuestion(question);

        return repository.save(choix);
    }

    public void deleteChoix(Long id) {
        repository.deleteById(id);
    }
}