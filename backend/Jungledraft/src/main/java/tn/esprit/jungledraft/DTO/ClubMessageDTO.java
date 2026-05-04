package tn.esprit.jungledraft.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClubMessageDTO {
    private Long userId;
    private String contenu;
    private Long clubId;  // ← Simple ID, pas un objet Club
}