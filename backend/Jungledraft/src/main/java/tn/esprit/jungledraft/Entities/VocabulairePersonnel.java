// VocabulairePersonnel.java
package tn.esprit.jungledraft.Entities;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "club_id", "mot"})
})
public class VocabulairePersonnel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long clubId;
    private String mot;
    private String traduction;
    private int foisVu;
    private Date dateDernierScan;
}