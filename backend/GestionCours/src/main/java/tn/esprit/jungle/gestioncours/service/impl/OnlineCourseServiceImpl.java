package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.client.UserClient;
import tn.esprit.jungle.gestioncours.entites.OnlineCourse;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.repositorie.OnlineCourseRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.OnlineCourseService;
import tn.esprit.jungle.gestioncours.service.support.CourseNotificationPublisher;

import java.util.List;

/**
 * OnlineCourseService Implementation
 * Contains business logic for online course operations
 * Handles validation, mapping, and persistence coordination
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OnlineCourseServiceImpl implements OnlineCourseService {

    private final OnlineCourseRepository repository;
    private final CourseNotificationPublisher courseNotificationPublisher;
    private final UserClient userClient;

    @Override
    public OnlineCourse addCourse(OnlineCourse course) {
        log.info("Attempting to add new course with title: {}, level: {}, tutorId: {}", 
                 course.getTitle(), course.getLevel(), course.getTutorId());
        
        validateInput(course);
        OnlineCourse savedCourse = repository.save(course);
        courseNotificationPublisher.notifyOnlineCourseCreated(savedCourse);

        log.info("✅ Course successfully saved to database with ID: {} | Title: '{}' | Level: {} | Tutor ID: {}", 
                 savedCourse.getId(), savedCourse.getTitle(), savedCourse.getLevel(), savedCourse.getTutorId());
        
        return savedCourse;
    }

    @Override
    public List<OnlineCourse> getAllCourses() {
        log.info("Fetching all courses from database...");
        List<OnlineCourse> courses = repository.findAll();
        log.info("✅ Retrieved {} course(s) from database", courses.size());
        return courses;
    }

    @Override
    public OnlineCourse getCourseById(Long id) {
        log.info("Fetching course with ID: {}", id);
        validateId(id);

        OnlineCourse course = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Course with ID {} not found in database", id);
                    return new ResourceNotFoundException(
                            "OnlineCourse with id " + id + " not found");
                });
        
        log.info("✅ Course found: ID={}, Title='{}', Level={}", 
                 course.getId(), course.getTitle(), course.getLevel());
        return course;
    }

    @Override
    public OnlineCourse updateCourse(Long id, OnlineCourse course) {
        log.info("Attempting to update course with ID: {}", id);
        validateId(id);
        validateInput(course);

        OnlineCourse existingCourse = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Update failed: Course with ID {} not found", id);
                    return new ResourceNotFoundException(
                            "OnlineCourse with id " + id + " not found");
                });

        log.debug("Existing course before update: Title='{}', Level={}, TutorId={}",
                 existingCourse.getTitle(), existingCourse.getLevel(), existingCourse.getTutorId());
        
        if (course.getTitle() != null) {
            existingCourse.setTitle(course.getTitle());
        }
        if (course.getLevel() != null) {
            existingCourse.setLevel(course.getLevel());
        }
        if (course.getTutorId() != null) {
            existingCourse.setTutorId(course.getTutorId());
        }

        OnlineCourse updatedCourse = repository.save(existingCourse);
        courseNotificationPublisher.notifyOnlineCourseUpdated(updatedCourse);

        log.info("✅ Course with ID {} successfully updated in database | New Title: '{}' | New Level: {}", 
                 id, updatedCourse.getTitle(), updatedCourse.getLevel());
        
        return updatedCourse;
    }

    @Override
    public void deleteCourse(Long id) {
        log.info("Attempting to delete course with ID: {}", id);
        validateId(id);

        OnlineCourse existing = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Delete failed: Course with ID {} not found in database", id);
                    return new ResourceNotFoundException(
                            "OnlineCourse with id " + id + " not found");
                });

        String title = existing.getTitle();
        repository.deleteById(id);
        courseNotificationPublisher.notifyOnlineCourseDeleted(id, title);

        log.info("✅ Course with ID {} successfully deleted from database", id);
    }

    /**
     * Validates the course input
     * 
     * @param course the course to validate
     * @throws InvalidInputException if validation fails
     */
    private void validateInput(OnlineCourse course) {
        if (course == null) {
            log.error("❌ Validation failed: Course object is null");
            throw new InvalidInputException("Course cannot be null");
        }
        if (course.getTitle() == null || course.getTitle().isEmpty()) {
            log.error("❌ Validation failed: Course title is null or empty");
            throw new InvalidInputException("Course title is required");
        }
        if (course.getLevel() == null) {
            log.error("❌ Validation failed: Course level is null");
            throw new InvalidInputException("Course level is required");
        }
        if (course.getTutorId() == null || course.getTutorId() <= 0) {
            log.error("❌ Validation failed: Tutor ID is {} (must be positive)", course.getTutorId());
            throw new InvalidInputException("Course tutor id must be a positive number");
        }

        try {
            userClient.getUserEmail(String.valueOf(course.getTutorId()));
        } catch (Exception ex) {
            log.error("❌ Validation failed: Tutor ID {} not found in user-service", course.getTutorId(), ex);
            throw new InvalidInputException("Course tutor must exist in the user service");
        }
        log.debug("✅ Validation passed for course: title='{}', level={}, tutorId={}",
                 course.getTitle(), course.getLevel(), course.getTutorId());
    }

    /**
     * Validates the id
     * 
     * @param id the id to validate
     * @throws InvalidInputException if id is invalid
     */
    private void validateId(Long id) {
        if (id == null || id <= 0) {
            log.error("❌ Validation failed: Course ID is {} (must be positive)", id);
            throw new InvalidInputException("Course id must be a positive number");
        }
    }
}
