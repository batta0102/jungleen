package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.entites.Classroom;
import tn.esprit.jungle.gestioncours.entites.ClassroomType;
import tn.esprit.jungle.gestioncours.entites.OnSiteSession;

import java.util.Date;
import java.util.List;
import java.util.Optional;

/**
 * OnSiteSessionService Interface
 * Defines the business logic contract for on-site session operations
 */
public interface OnSiteSessionService {
    OnSiteSession addSession(OnSiteSession session);
    List<OnSiteSession> getAllSessions();
    OnSiteSession getSessionById(Long id);
    OnSiteSession updateSession(Long id, OnSiteSession session);
    void deleteSession(Long id);
    List<OnSiteSession> getSessionsByCourse(Long courseId);
    Optional<Classroom> recommendClassroom(Date date, Integer requiredCapacity, ClassroomType preferredType);
}
