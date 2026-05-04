package tn.esprit.pidraft.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tn.esprit.pidraft.Repositories.QCMRepository;
import tn.esprit.pidraft.Repositories.QuestionRepository;
import tn.esprit.pidraft.Repositories.ReponseDonneeRepository;
import tn.esprit.pidraft.Repositories.ResultatRepository;
import tn.esprit.pidraft.Repositories.SessionTestRepository;
import tn.esprit.pidraft.entities.QCM;
import tn.esprit.pidraft.entities.Question;
import tn.esprit.pidraft.entities.ReponseDonnee;
import tn.esprit.pidraft.entities.Resultat;
import tn.esprit.pidraft.entities.SessionTest;
import tn.esprit.pidraft.entities.StatutSession;
import tn.esprit.pidraft.entities.TypeCible;
import tn.esprit.pidraft.entities.TypeQCM;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class AnalyticsSeedConfig {

    private final QCMRepository qcmRepository;
    private final QuestionRepository questionRepository;
    private final SessionTestRepository sessionTestRepository;
    private final ResultatRepository resultatRepository;
    private final ReponseDonneeRepository reponseDonneeRepository;

    // Disabled seed config due to Lombok processing issue
    // This will be re-enabled after Lombok configuration is fixed
    /*
    @Bean
    CommandLineRunner seedAnalyticsData() {
        return args -> {
            if (resultatRepository.count() > 0 || reponseDonneeRepository.count() > 0) {
                return;
            }

            LocalDateTime now = LocalDateTime.now();

            QCM grammarQcm = new QCM();
            grammarQcm.setTitre("Grammar Fundamentals");
            grammarQcm.setContenu("Core grammar diagnostic");
            grammarQcm.setType(TypeQCM.QCM_SINGLE);
            grammarQcm.setCible(TypeCible.STUDENT);
            grammarQcm.setDureeMinutes(30);
            grammarQcm.setTentativesMax(3);
            grammarQcm.setNoteMax(20.0);
            grammarQcm.setDatePublication(now.minusDays(15));

            QCM workplaceQcm = new QCM();
            workplaceQcm.setTitre("Workplace English");
            workplaceQcm.setContenu("Professional English assessment");
            workplaceQcm.setType(TypeQCM.QCM_SINGLE);
            workplaceQcm.setCible(TypeCible.CANDIDATE);
            workplaceQcm.setDureeMinutes(25);
            workplaceQcm.setTentativesMax(2);
            workplaceQcm.setNoteMax(20.0);
            workplaceQcm.setDatePublication(now.minusDays(12));

            qcmRepository.saveAll(List.of(grammarQcm, workplaceQcm));

            Question qVerb = createQuestion(grammarQcm, "Choose the correct verb tense in this sentence.");
            Question qArticle = createQuestion(grammarQcm, "Select the correct article for the noun phrase.");
            Question qPreposition = createQuestion(grammarQcm, "Pick the correct preposition in the sentence.");
            Question qPronoun = createQuestion(grammarQcm, "Choose the right pronoun in context.");
            Question qTrueFalse = createQuestion(workplaceQcm, "Vrai or false: this business email sentence is correct.");

            questionRepository.saveAll(List.of(qVerb, qArticle, qPreposition, qPronoun, qTrueFalse));

            SessionTest s1 = createSession(grammarQcm, now.minusDays(10), 45.0);
            SessionTest s2 = createSession(grammarQcm, now.minusDays(8), 58.0);
            SessionTest s3 = createSession(grammarQcm, now.minusDays(6), 72.0);
            SessionTest s4 = createSession(workplaceQcm, now.minusDays(4), 63.0);
            SessionTest s5 = createSession(workplaceQcm, now.minusDays(2), 79.0);
            SessionTest s6 = createSession(workplaceQcm, now.minusDays(1), 85.0);

            sessionTestRepository.saveAll(List.of(s1, s2, s3, s4, s5, s6));

            resultatRepository.saveAll(List.of(
                    createResultat(s1, now.minusDays(10), 9.0, 20.0, 45.0),
                    createResultat(s2, now.minusDays(8), 11.6, 20.0, 58.0),
                    createResultat(s3, now.minusDays(6), 14.4, 20.0, 72.0),
                    createResultat(s4, now.minusDays(4), 12.6, 20.0, 63.0),
                    createResultat(s5, now.minusDays(2), 15.8, 20.0, 79.0),
                    createResultat(s6, now.minusDays(1), 17.0, 20.0, 85.0)
            ));

            List<ReponseDonnee> reponses = new ArrayList<>();
            addResponses(reponses, s1, qVerb, false, false, true);
            addResponses(reponses, s1, qArticle, false, true);
            addResponses(reponses, s1, qPreposition, false, false, true);
            addResponses(reponses, s1, qPronoun, true, false);

            addResponses(reponses, s2, qVerb, false, true);
            addResponses(reponses, s2, qArticle, false, false, true);
            addResponses(reponses, s2, qPreposition, true, false);
            addResponses(reponses, s2, qPronoun, true, true);

            addResponses(reponses, s3, qVerb, true, true);
            addResponses(reponses, s3, qArticle, false, true);
            addResponses(reponses, s3, qPreposition, false, true);
            addResponses(reponses, s3, qPronoun, true, true);

            addResponses(reponses, s4, qTrueFalse, false, false, true);
            addResponses(reponses, s5, qTrueFalse, false, true, true);
            addResponses(reponses, s6, qTrueFalse, true, true, true);

            reponseDonneeRepository.saveAll(reponses);
        };
    }
    */
}