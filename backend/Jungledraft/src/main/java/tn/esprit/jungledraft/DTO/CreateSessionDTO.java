package tn.esprit.jungledraft.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionDTO {
    private BuddyPairDTO buddyPair;
    private String date;
    private int duree;
    private String sujet;
    private String lieu;
    private String notes;
    private String status;


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuddyPairDTO {
        private Long idPair;
    }
}
