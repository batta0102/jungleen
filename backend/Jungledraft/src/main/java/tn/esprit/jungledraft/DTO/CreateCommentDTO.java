package tn.esprit.jungledraft.DTO;

import lombok.Data;

@Data
public class CreateCommentDTO {
    private String comment;
    private Long userId;
    private Long messageId;
}
