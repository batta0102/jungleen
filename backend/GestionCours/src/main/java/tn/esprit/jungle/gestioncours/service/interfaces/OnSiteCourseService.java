package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.entites.OnSiteCourse;

import java.util.List;

/**
 * OnSiteCourseService Interface
 * Defines the business logic contract for on-site course operations
 */
public interface OnSiteCourseService {
    OnSiteCourse addCourse(OnSiteCourse course);
    List<OnSiteCourse> getAllCourses();
    OnSiteCourse getCourseById(Long id);
    OnSiteCourse updateCourse(Long id, OnSiteCourse course);
    void deleteCourse(Long id);
}
