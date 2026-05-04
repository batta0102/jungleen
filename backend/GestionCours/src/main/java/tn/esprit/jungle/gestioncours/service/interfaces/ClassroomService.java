package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.entites.Classroom;

import java.util.List;

/**
 * ClassroomService Interface
 * Defines the business logic contract for classroom operations
 */
public interface ClassroomService {
    Classroom addClassroom(Classroom classroom);
    List<Classroom> getAllClassrooms();
    Classroom getClassroomById(Long id);
    Classroom updateClassroom(Long id, Classroom classroom);
    void deleteClassroom(Long id);
}
