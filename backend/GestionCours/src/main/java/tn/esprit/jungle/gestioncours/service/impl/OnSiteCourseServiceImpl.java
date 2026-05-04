package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.entites.OnSiteCourse;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteCourseRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.OnSiteCourseService;
import tn.esprit.jungle.gestioncours.service.support.CourseNotificationPublisher;

import java.util.List;

/**
 * OnSiteCourseService Implementation
 * Contains business logic for on-site course operations
 * Handles validation, mapping, and persistence coordination
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OnSiteCourseServiceImpl implements OnSiteCourseService {

    private final OnSiteCourseRepository repository;
    private final CourseNotificationPublisher courseNotificationPublisher;

    @Override
    public OnSiteCourse addCourse(OnSiteCourse course) {
        log.info("Attempting to add new on-site course with title: {}, level: {}, tutorId: {}", 
                 course.getTitle(), course.getLevel(), course.getTutorId());
        
        validateInput(course);
        OnSiteCourse savedCourse = repository.save(course);
        courseNotificationPublisher.notifyOnSiteCourseCreated(savedCourse);

        log.info("✅ On-site course successfully saved to database with ID: {} | Title: '{}' | Level: {} | Tutor ID: {}", 
                 savedCourse.getId(), savedCourse.getTitle(), savedCourse.getLevel(), savedCourse.getTutorId());
        
        return savedCourse;
    }

    @Override
    public List<OnSiteCourse> getAllCourses() {
        log.info("Fetching all on-site courses from database...");
        List<OnSiteCourse> courses = repository.findAll();
        log.info("✅ Retrieved {} on-site course(s) from database", courses.size());
        return courses;
    }

    @Override
    public OnSiteCourse getCourseById(Long id) {
        log.info("Fetching on-site course with ID: {}", id);
        validateId(id);

        OnSiteCourse course = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ On-site course with ID {} not found in database", id);
                    return new ResourceNotFoundException(
                            "OnSiteCourse with id " + id + " not found");
                });
        
        log.info("✅ On-site course found: ID={}, Title='{}', Level={}", 
                 course.getId(), course.getTitle(), course.getLevel());
        return course;
    }

    @Override
    public OnSiteCourse updateCourse(Long id, OnSiteCourse course) {
        log.info("Attempting to update on-site course with ID: {}", id);
        validateId(id);
        validateInput(course);

        OnSiteCourse existingCourse = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Update failed: On-site course with ID {} not found", id);
                    return new ResourceNotFoundException(
                            "OnSiteCourse with id " + id + " not found");
                });

        log.debug("Existing on-site course before update: Title='{}', Level={}, TutorId={}",
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

        OnSiteCourse updatedCourse = repository.save(existingCourse);
        courseNotificationPublisher.notifyOnSiteCourseUpdated(updatedCourse);

        log.info("✅ On-site course with ID {} successfully updated in database | New Title: '{}' | New Level: {}", 
                 id, updatedCourse.getTitle(), updatedCourse.getLevel());
        
        return updatedCourse;
    }

    @Override
    public void deleteCourse(Long id) {
        log.info("Attempting to delete on-site course with ID: {}", id);
        validateId(id);

        OnSiteCourse existingCourse = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Delete failed: On-site course with ID {} not found", id);
                    return new ResourceNotFoundException(
                            "OnSiteCourse with id " + id + " not found");
                });

        log.debug("On-site course to be deleted: ID={}, Title='{}', Level={}", 
                 existingCourse.getId(), existingCourse.getTitle(), existingCourse.getLevel());

        String title = existingCourse.getTitle();
        repository.deleteById(id);
        courseNotificationPublisher.notifyOnSiteCourseDeleted(id, title);

        log.info("✅ On-site course with ID {} successfully deleted from database", id);
    }

    /**
     * Validates if the provided on-site course has required fields
     * 
     * @param course the on-site course to validate
     * @throws InvalidInputException if validation fails
     */
    private void validateInput(OnSiteCourse course) {
        if (course == null) {
            log.warn("⚠️ Validation failed: On-site course object is null");
            throw new InvalidInputException("On-site course cannot be null");
        }
        if (course.getTitle() == null || course.getTitle().isBlank()) {
            log.warn("⚠️ Validation failed: On-site course title is null or blank");
            throw new InvalidInputException("On-site course title is required and cannot be blank");
        }
        if (course.getLevel() == null) {
            log.warn("⚠️ Validation failed: On-site course level is null");
            throw new InvalidInputException("On-site course level is required");
        }
        if (course.getTutorId() == null || course.getTutorId() <= 0) {
            log.warn("⚠️ Validation failed: On-site course tutorId is invalid");
            throw new InvalidInputException("Tutor ID must be a positive number");
        }
        log.debug("✅ On-site course validation passed");
    }

    /**
     * Validates if the provided ID is valid (positive)
     * 
     * @param id the ID to validate
     * @throws InvalidInputException if ID is invalid
     */
    private void validateId(Long id) {
        if (id == null || id <= 0) {
            log.warn("⚠️ Validation failed: Invalid ID provided: {}", id);
            throw new InvalidInputException("ID must be a positive number");
        }
    }
}
