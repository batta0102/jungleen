package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.entites.OnlineSession;

import java.util.List;

/**
 * OnlineSessionService Interface
 * Defines the business logic contract for online session operations
 * Manages online session CRUD operations and business rules
 */
public interface OnlineSessionService {

    /**
     * Creates a new online session
     * 
     * @param session the session object containing session details
     * @return the created session
     */
    OnlineSession addSession(OnlineSession session);

    /**
     * Retrieves all online sessions
     * 
     * @return list of all sessions
     */
    List<OnlineSession> getAllSessions();

    /**
     * Retrieves a specific session by id
     * 
     * @param id the session id
     * @return the session with the given id
     */
    OnlineSession getSessionById(Long id);

    /**
     * Updates an existing session
     * 
     * @param id the session id
     * @param session the updated session data
     * @return the updated session
     */
    OnlineSession updateSession(Long id, OnlineSession session);

    /**
     * Deletes a session
     * 
     * @param id the session id
     */
    void deleteSession(Long id);

    /**
     * Get all sessions for a specific course
     * 
     * @param courseId the course id
     * @return list of sessions for the course
     */
    List<OnlineSession> getSessionsByCourse(Long courseId);
}
