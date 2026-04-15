package tn.esprit.pidraft.dto.analytics;

public class WeakAreaStatDto {

    private final String area;
    private final Long attempts;
    private final Double accuracy;

    public WeakAreaStatDto(String area, Long attempts, Double accuracy) {
        this.area = area;
        this.attempts = attempts;
        this.accuracy = accuracy;
    }

    public String getArea() {
        return area;
    }

    public Long getAttempts() {
        return attempts;
    }

    public Double getAccuracy() {
        return accuracy;
    }
}
