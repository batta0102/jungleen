package tn.esprit.pidraft.dto.analytics;

public class ProgressPointDto {

    private final String period;
    private final Double averageScore;
    private final Long attempts;

    public ProgressPointDto(Object period, Double averageScore, Long attempts) {
        this.period = period == null ? null : period.toString();
        this.averageScore = averageScore;
        this.attempts = attempts;
    }

    public String getPeriod() {
        return period;
    }

    public Double getAverageScore() {
        return averageScore;
    }

    public Long getAttempts() {
        return attempts;
    }
}
