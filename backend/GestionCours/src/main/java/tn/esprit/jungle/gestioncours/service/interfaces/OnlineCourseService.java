package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.entites.OnlineCourse;

import java.util.List;

/**
 * OnlineCourseService Interface
 * Defines the business logic contract for online course operations
 */
public interface OnlineCourseService {
    OnlineCourse addCourse(OnlineCourse course);
    List<OnlineCourse> getAllCourses();
    OnlineCourse getCourseById(Long id);
    OnlineCourse updateCourse(Long id, OnlineCourse course);
    void deleteCourse(Long id);
}
