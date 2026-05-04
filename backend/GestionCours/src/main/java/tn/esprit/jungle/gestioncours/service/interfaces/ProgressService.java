package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.dto.ProgressResponse;
import tn.esprit.jungle.gestioncours.entites.SessionType;

public interface ProgressService {

    ProgressResponse calcProgress(SessionType courseType, Long courseId, Long studentId, int minRateDefault);

    default ProgressResponse calcProgress(SessionType courseType, Long courseId, Long studentId) {
        return calcProgress(courseType, courseId, studentId, 80);
    }
}
