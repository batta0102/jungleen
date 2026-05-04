package tn.esprit.jungle.gestioncours.service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result of overload checks before confirming a booking.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentOverloadCheckResult {

    private String dailyWarningMessage;

    public boolean hasDailyWarning() {
        return dailyWarningMessage != null && !dailyWarningMessage.isBlank();
    }
}
