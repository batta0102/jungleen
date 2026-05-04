package tn.esprit.jungle.gestioncours.entites;

public enum NotificationType {
    ATTENDANCE_UPDATED,
    SESSION_CANCELLED,
    WAITLIST_PROMOTED,
    RISK_ALERT,
    /** Cours (en ligne ou présentiel) créé avec succès. */
    COURSE_CREATED,
    /** Cours (en ligne ou présentiel) mis à jour avec succès. */
    COURSE_UPDATED,
    /** Cours (en ligne ou présentiel) supprimé. */
    COURSE_DELETED
}
