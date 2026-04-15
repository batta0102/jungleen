package tn.esprit.pidraft.dto.analytics;

public class TopicAverageDto {

    private final String topic;
    private final Double averageScore;
    private final Long attempts;

    public TopicAverageDto(String topic, Double averageScore, Long attempts) {
        this.topic = topic;
        this.averageScore = averageScore;
        this.attempts = attempts;
    }

    public String getTopic() {
        return topic;
    }

    public Double getAverageScore() {
        return averageScore;
    }

    public Long getAttempts() {
        return attempts;
    }
}
