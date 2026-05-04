package tn.esprit.jungledraft.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateMessageDTO {
    private String contenu;
    private Long clubId;
    private Long userId;
}