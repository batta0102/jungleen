package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.entites.Classroom;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.repositorie.ClassroomRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.ClassroomService;

import java.util.List;

/**
 * ClassroomService Implementation
 * Contains business logic for classroom operations
 * Handles validation, mapping, and persistence coordination
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository repository;

    @Override
    public Classroom addClassroom(Classroom classroom) {
        log.info("Attempting to add new classroom with name: {}, capacity: {}", 
                 classroom.getName(), classroom.getCapacity());
        
        validateInput(classroom);
        Classroom savedClassroom = repository.save(classroom);
        
        log.info("✅ Classroom successfully saved to database with ID: {} | Name: '{}' | Capacity: {}", 
                 savedClassroom.getId(), savedClassroom.getName(), savedClassroom.getCapacity());
        
        return savedClassroom;
    }

    @Override
    public List<Classroom> getAllClassrooms() {
        log.info("Fetching all classrooms from database...");
        List<Classroom> classrooms = repository.findAll();
        log.info("✅ Retrieved {} classroom(s) from database", classrooms.size());
        return classrooms;
    }

    @Override
    public Classroom getClassroomById(Long id) {
        log.info("Fetching classroom with ID: {}", id);
        validateId(id);

        Classroom classroom = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Classroom with ID {} not found in database", id);
                    return new ResourceNotFoundException(
                            "Classroom with id " + id + " not found");
                });
        
        log.info("✅ Classroom found: ID={}, Name='{}', Capacity={}", 
                 classroom.getId(), classroom.getName(), classroom.getCapacity());
        return classroom;
    }

    @Override
    public Classroom updateClassroom(Long id, Classroom classroom) {
        log.info("Attempting to update classroom with ID: {}", id);
        validateId(id);
        validateInput(classroom);

        Classroom existingClassroom = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Update failed: Classroom with ID {} not found", id);
                    return new ResourceNotFoundException(
                            "Classroom with id " + id + " not found");
                });

        log.debug("Existing classroom before update: Name='{}', Capacity={}",
                 existingClassroom.getName(), existingClassroom.getCapacity());
        
        if (classroom.getName() != null) {
            existingClassroom.setName(classroom.getName());
        }
        if (classroom.getCapacity() > 0) {
            existingClassroom.setCapacity(classroom.getCapacity());
        }
        if (classroom.getType() != null) {
            existingClassroom.setType(classroom.getType());
        }
        existingClassroom.setFeaturesDescription(classroom.getFeaturesDescription());
        existingClassroom.setSketchfabModelUid(classroom.getSketchfabModelUid());

        Classroom updatedClassroom = repository.save(existingClassroom);
        log.info("✅ Classroom with ID {} successfully updated in database | New Name: '{}' | New Capacity: {}", 
                 id, updatedClassroom.getName(), updatedClassroom.getCapacity());
        
        return updatedClassroom;
    }

    @Override
    public void deleteClassroom(Long id) {
        log.info("Attempting to delete classroom with ID: {}", id);
        validateId(id);

        Classroom existingClassroom = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Delete failed: Classroom with ID {} not found", id);
                    return new ResourceNotFoundException(
                            "Classroom with id " + id + " not found");
                });

        log.debug("Classroom to be deleted: ID={}, Name='{}', Capacity={}", 
                 existingClassroom.getId(), existingClassroom.getName(), existingClassroom.getCapacity());
        
        repository.deleteById(id);
        log.info("✅ Classroom with ID {} successfully deleted from database", id);
    }

    /**
     * Validates if the provided classroom has required fields
     * 
     * @param classroom the classroom to validate
     * @throws InvalidInputException if validation fails
     */
    private void validateInput(Classroom classroom) {
        if (classroom == null) {
            log.warn("⚠️ Validation failed: Classroom object is null");
            throw new InvalidInputException("Classroom cannot be null");
        }
        if (classroom.getName() == null || classroom.getName().isBlank()) {
            log.warn("⚠️ Validation failed: Classroom name is null or blank");
            throw new InvalidInputException("Classroom name is required and cannot be blank");
        }
        if (classroom.getCapacity() <= 0) {
            log.warn("⚠️ Validation failed: Classroom capacity is invalid");
            throw new InvalidInputException("Capacity must be a positive number");
        }
        if (classroom.getType() == null) {
            log.warn("⚠️ Validation failed: Classroom type is null");
            throw new InvalidInputException("Classroom type is required");
        }
        log.debug("✅ Classroom validation passed");
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
