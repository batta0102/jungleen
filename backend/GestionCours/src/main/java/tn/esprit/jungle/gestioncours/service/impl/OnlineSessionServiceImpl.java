package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.entites.OnlineSession;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.repositorie.OnlineCourseRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnlineSessionRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.OnlineSessionService;

import java.util.List;

/**
 * OnlineSessionService Implementation
 * Contains business logic for online session operations
 * Handles validation, mapping, and persistence coordination
 */
@Service
@RequiredArgsConstructor
public class OnlineSessionServiceImpl implements OnlineSessionService {

    private final OnlineSessionRepository repository;
    private final OnlineCourseRepository courseRepository;

    @Override
    public OnlineSession addSession(OnlineSession session) {
        validateInput(session);
        // Verify that the course exists
        if (session.getCourse() != null && session.getCourse().getId() != null) {
            if (!courseRepository.existsById(session.getCourse().getId())) {
                throw new ResourceNotFoundException(
                        "OnlineCourse with id " + session.getCourse().getId() + " not found");
            }
        }
        return repository.save(session);
    }

    @Override
    public List<OnlineSession> getAllSessions() {
        return repository.findAll();
    }

    @Override
    public OnlineSession getSessionById(Long id) {
        validateId(id);

        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OnlineSession with id " + id + " not found"));
    }

    @Override
    public OnlineSession updateSession(Long id, OnlineSession session) {
        validateId(id);
        validateInput(session);

        OnlineSession existingSession = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OnlineSession with id " + id + " not found"));

        // Verify that the course exists when updating
        if (session.getCourse() != null && session.getCourse().getId() != null) {
            if (!courseRepository.existsById(session.getCourse().getId())) {
                throw new ResourceNotFoundException(
                        "OnlineCourse with id " + session.getCourse().getId() + " not found");
            }
        }

        if (session.getDate() != null) {
            existingSession.setDate(session.getDate());
        }
        if (session.getCapacity() > 0) {
            existingSession.setCapacity(session.getCapacity());
        }
        if (session.getMeetingLink() != null) {
            existingSession.setMeetingLink(session.getMeetingLink());
        }
        if (session.getCourse() != null) {
            existingSession.setCourse(session.getCourse());
        }

        return repository.save(existingSession);
    }

    @Override
    public void deleteSession(Long id) {
        validateId(id);

        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "OnlineSession with id " + id + " not found");
        }

        repository.deleteById(id);
    }

    @Override
    public List<OnlineSession> getSessionsByCourse(Long courseId) {
        validateId(courseId);
        return repository.findByCourseId(courseId);
    }

    /**
     * Validates the session input
     * 
     * @param session the session to validate
     * @throws InvalidInputException if validation fails
     */
    private void validateInput(OnlineSession session) {
        if (session == null) {
            throw new InvalidInputException("Session cannot be null");
        }
        if (session.getDate() == null) {
            throw new InvalidInputException("Session date is required");
        }
        if (session.getCapacity() <= 0) {
            throw new InvalidInputException("Session capacity must be a positive integer");
        }
        if (session.getMeetingLink() == null || session.getMeetingLink().isEmpty()) {
            throw new InvalidInputException("Session meeting link is required");
        }
        // Validate URL format
        if (!session.getMeetingLink().matches("^(https?://)([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=]*)?$")) {
            throw new InvalidInputException("Meeting link must be a valid URL");
        }
        if (session.getCourse() == null) {
            throw new InvalidInputException("Session must be associated with a course");
        }
    }

    /**
     * Validates the id
     * 
     * @param id the id to validate
     * @throws InvalidInputException if id is invalid
     */
    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new InvalidInputException("Session id must be a positive number");
        }
    }
}
