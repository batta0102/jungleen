package tn.esprit.pidraft.dto.analytics;

import java.util.List;

public class AdmissionAnalyticsResponseDto {

    private final List<FailedQuestionStatDto> mostFailedQuestions;
    private final List<WeakAreaStatDto> weakGrammarAreas;
    private final List<ProgressPointDto> progressOverTime;
    private final List<TopicAverageDto> averageScoreByTopic;

    public AdmissionAnalyticsResponseDto(List<FailedQuestionStatDto> mostFailedQuestions,
                                         List<WeakAreaStatDto> weakGrammarAreas,
                                         List<ProgressPointDto> progressOverTime,
                                         List<TopicAverageDto> averageScoreByTopic) {
        this.mostFailedQuestions = mostFailedQuestions;
        this.weakGrammarAreas = weakGrammarAreas;
        this.progressOverTime = progressOverTime;
        this.averageScoreByTopic = averageScoreByTopic;
    }

    public List<FailedQuestionStatDto> getMostFailedQuestions() {
        return mostFailedQuestions;
    }

    public List<WeakAreaStatDto> getWeakGrammarAreas() {
        return weakGrammarAreas;
    }

    public List<ProgressPointDto> getProgressOverTime() {
        return progressOverTime;
    }

    public List<TopicAverageDto> getAverageScoreByTopic() {
        return averageScoreByTopic;
    }
}
