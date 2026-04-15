package tn.esprit.pidraft.Services;

import org.springframework.stereotype.Service;
import tn.esprit.pidraft.Repositories.ReponseDonneeRepository;
import tn.esprit.pidraft.Repositories.ResultatRepository;
import tn.esprit.pidraft.dto.analytics.AdmissionAnalyticsResponseDto;
import tn.esprit.pidraft.dto.analytics.FailedQuestionStatDto;
import tn.esprit.pidraft.dto.analytics.ProgressPointDto;
import tn.esprit.pidraft.dto.analytics.TopicAverageDto;
import tn.esprit.pidraft.dto.analytics.WeakAreaStatDto;

import java.util.List;

@Service
public class AdmissionAnalyticsService {

    private final ReponseDonneeRepository reponseDonneeRepository;
    private final ResultatRepository resultatRepository;

    public AdmissionAnalyticsService(ReponseDonneeRepository reponseDonneeRepository,
                                     ResultatRepository resultatRepository) {
        this.reponseDonneeRepository = reponseDonneeRepository;
        this.resultatRepository = resultatRepository;
    }

    public AdmissionAnalyticsResponseDto getAdmissionDashboard() {
        List<FailedQuestionStatDto> failedQuestions = reponseDonneeRepository.findMostFailedQuestions();
        List<WeakAreaStatDto> weakAreas = reponseDonneeRepository.findWeakGrammarAreas();
        List<ProgressPointDto> progress = resultatRepository.findProgressOverTime();
        List<TopicAverageDto> topicAverages = resultatRepository.findAverageScoreByTopic();

        return new AdmissionAnalyticsResponseDto(
                failedQuestions,
                weakAreas,
                progress,
                topicAverages
        );
    }
}
