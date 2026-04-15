package tn.esprit.pidraft.dto.analytics;

public class FailedQuestionStatDto {

    private final Long questionId;
    private final String questionContent;
    private final String quizTitle;
    private final Long failCount;
    private final Long totalAttempts;
    private final Double failureRate;

    public FailedQuestionStatDto(Long questionId,
                                 String questionContent,
                                 String quizTitle,
                                 Long failCount,
                                 Long totalAttempts,
                                 Double failureRate) {
        this.questionId = questionId;
        this.questionContent = questionContent;
        this.quizTitle = quizTitle;
        this.failCount = failCount;
        this.totalAttempts = totalAttempts;
        this.failureRate = failureRate;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public String getQuestionContent() {
        return questionContent;
    }

    public String getQuizTitle() {
        return quizTitle;
    }

    public Long getFailCount() {
        return failCount;
    }

    public Long getTotalAttempts() {
        return totalAttempts;
    }

    public Double getFailureRate() {
        return failureRate;
    }
}
