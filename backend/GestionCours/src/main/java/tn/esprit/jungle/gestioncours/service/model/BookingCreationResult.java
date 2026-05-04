package tn.esprit.jungle.gestioncours.service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Service result for booking creation.
 * Carries the created booking and an optional warning.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingCreationResult<T> {

    private T booking;
    private String warningMessage;

    public boolean hasWarning() {
        return warningMessage != null && !warningMessage.isBlank();
    }
}
