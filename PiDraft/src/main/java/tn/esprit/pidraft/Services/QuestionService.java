package tn.esprit.pidraft.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.esprit.pidraft.entities.Question;
import tn.esprit.pidraft.entities.QCM;
import tn.esprit.pidraft.Repositories.QuestionRepository;
import tn.esprit.pidraft.Repositories.QCMRepository;

import java.util.List;
import java.util.Optional;

@Service
public class QuestionService {
    @Autowired
    private QCMRepository qcmRepository;
    @Autowired
    private final QuestionRepository repository;

    public QuestionService(QuestionRepository repository, QCMRepository qcmRepository) {
        this.repository = repository;
        this.qcmRepository = qcmRepository;
    }

    public List<Question> getAllQuestions() {
        return repository.findAll();
    }

    public Optional<Question> getQuestionById(Long id) {
        return repository.findById(id);
    }

    public Question createQuestion(Question question) {

        if (question.getQcm() == null || question.getQcm().getId() == null) {
            throw new RuntimeException("QCM ID obligatoire !");
        }

        QCM qcm = qcmRepository.findById(question.getQcm().getId())
                .orElseThrow(() -> new RuntimeException("QCM non trouvé"));

        question.setQcm(qcm);

        return repository.save(question);
    }
    public Question updateQuestion(Long id, Question question) {

        Long qcmId = question.getQcm().getId();

        QCM qcm = qcmRepository.findById(qcmId)
                .orElseThrow(() -> new RuntimeException("QCM not found"));

        question.setId(id);
        question.setQcm(qcm);

        return repository.save(question);
    }

    public void deleteQuestion(Long id) {
        repository.deleteById(id);
    }
}
