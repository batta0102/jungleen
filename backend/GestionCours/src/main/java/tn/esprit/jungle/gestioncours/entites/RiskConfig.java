package tn.esprit.jungle.gestioncours.entites;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "risk_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RiskConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long courseId;

    @Column(nullable = false)
    private Double highThreshold = 60.0;

    @Column(nullable = false)
    private Double mediumThreshold = 75.0;

    @Convert(converter = RiskConfigMapConverter.class)
    @Column(name = "session_overrides", columnDefinition = "TEXT")
    private Map<Long, Double> sessionOverrides = new HashMap<>();

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touchUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
