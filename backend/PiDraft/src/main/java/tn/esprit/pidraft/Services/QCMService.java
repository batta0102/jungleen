package tn.esprit.pidraft.Services;

import org.springframework.stereotype.Service;
import tn.esprit.pidraft.entities.QCM;
import tn.esprit.pidraft.Repositories.QCMRepository;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@Service
public class QCMService {

    private final QCMRepository repository;

    public QCMService(QCMRepository repository) {
        this.repository = repository;
    }

    public List<QCM> getAllQCMs() {
        return repository.findAll();
    }

    public Optional<QCM> getQCMById(Long id) {
        return repository.findById(id);
    }

    public QCM createQCM(QCM qcm) {
        if (qcm.getQuestions() != null) {
            qcm.getQuestions().forEach(q -> {
                q.setQcm(qcm);
                if (q.getChoix() != null) {
                    q.getChoix().forEach(c -> c.setQuestion(q));
                }
            });
        }
        return repository.save(qcm);
    }

    public QCM updateQCM(Long id, QCM qcm) {
        qcm.setId(id);
        if (qcm.getQuestions() != null) {
            qcm.getQuestions().forEach(q -> {
                q.setQcm(qcm);
                if (q.getChoix() != null) {
                    q.getChoix().forEach(c -> c.setQuestion(q));
                }
            });
        }
        return repository.save(qcm);
    }

    public void deleteQCM(Long id) {
        repository.deleteById(id);
    }

    public QCM fixQCMScoring(Long id) {
        Optional<QCM> qcmOpt = repository.findById(id);
        if (qcmOpt.isEmpty()) {
            throw new RuntimeException("QCM not found with id: " + id);
        }
        
        QCM qcm = qcmOpt.get();
        boolean hasChanges = false;
        
        // Fix each question to ensure at least one correct choice
        for (var question : qcm.getQuestions()) {
            if (question.getChoix() == null || question.getChoix().isEmpty()) {
                // Add sample choices if none exist
                question.setChoix(createSampleChoices(question));
                hasChanges = true;
                System.out.println("Added sample choices to question " + question.getId());
            } else {
                // Count current correct choices
                long correctCount = question.getChoix().stream()
                    .mapToLong(c -> Boolean.TRUE.equals(c.getEstCorrect()) ? 1L : 0L)
                    .sum();
                
                // If no correct choices, set the first one as correct
                if (correctCount == 0) {
                    question.getChoix().get(0).setEstCorrect(true);
                    hasChanges = true;
                    System.out.println("Fixed question " + question.getId() + " - set first choice as correct");
                }
            }
        }
        
        if (hasChanges) {
            return repository.save(qcm);
        }
        
        return qcm;
    }
    
    private List<tn.esprit.pidraft.entities.ChoixReponse> createSampleChoices(tn.esprit.pidraft.entities.Question question) {
        List<tn.esprit.pidraft.entities.ChoixReponse> choices = new ArrayList<>();
        
        // Create sample choices based on question content
        String contenu = question.getContenu().toLowerCase();
        List<String> sampleChoices;
        
        if (contenu.contains("verb") || contenu.contains("tense")) {
            sampleChoices = List.of("Present Simple", "Past Simple", "Future Simple", "Present Perfect");
        } else if (contenu.contains("article")) {
            sampleChoices = List.of("a", "an", "the", "no article");
        } else if (contenu.contains("preposition")) {
            sampleChoices = List.of("in", "on", "at", "for");
        } else if (contenu.contains("pronoun")) {
            sampleChoices = List.of("he", "she", "it", "they");
        } else {
            sampleChoices = List.of("Option A", "Option B", "Option C", "Option D");
        }
        
        for (int i = 0; i < sampleChoices.size(); i++) {
            tn.esprit.pidraft.entities.ChoixReponse choice = new tn.esprit.pidraft.entities.ChoixReponse();
            choice.setContenu(sampleChoices.get(i));
            choice.setOrdre(i + 1);
            choice.setEstCorrect(i == 0); // First option is correct
            choice.setQuestion(question);
            choices.add(choice);
        }
        
        return choices;
    }
}
