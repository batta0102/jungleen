package tn.esprit.jungle.gestioncours.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.jungle.gestioncours.entites.Level;
import tn.esprit.jungle.gestioncours.entites.OnlineCourse;
import tn.esprit.jungle.gestioncours.repositorie.OnlineCourseRepository;
import tn.esprit.jungle.gestioncours.service.support.CourseNotificationPublisher;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OnlineCourseServiceImplTest {

    @Mock
    private OnlineCourseRepository repository;

    @Mock
    private CourseNotificationPublisher courseNotificationPublisher;

    @InjectMocks
    private OnlineCourseServiceImpl onlineCourseService;

    @Test
    void addCourse_savesAndNotifiesCreated() {
        OnlineCourse input = new OnlineCourse();
        input.setTitle("Python");
        input.setLevel(Level.B1);
        input.setTutorId(5L);

        when(repository.save(any(OnlineCourse.class))).thenAnswer(invocation -> {
            OnlineCourse c = invocation.getArgument(0);
            c.setId(100L);
            return c;
        });

        OnlineCourse result = onlineCourseService.addCourse(input);

        assertThat(result.getId()).isEqualTo(100L);
        assertThat(result.getTitle()).isEqualTo("Python");

        verify(repository).save(any(OnlineCourse.class));
        verify(courseNotificationPublisher).notifyOnlineCourseCreated(result);
    }

    @Test
    void updateCourse_persistsChangesAndNotifiesUpdated() {
        OnlineCourse existing = new OnlineCourse();
        existing.setId(7L);
        existing.setTitle("Ancien");
        existing.setLevel(Level.A2);
        existing.setTutorId(3L);

        when(repository.findById(7L)).thenReturn(Optional.of(existing));
        when(repository.save(any(OnlineCourse.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OnlineCourse patch = new OnlineCourse();
        patch.setTitle("Nouveau titre");

        OnlineCourse updated = onlineCourseService.updateCourse(7L, patch);

        assertThat(updated.getTitle()).isEqualTo("Nouveau titre");
        assertThat(updated.getLevel()).isEqualTo(Level.A2);
        assertThat(updated.getTutorId()).isEqualTo(3L);

        verify(repository).save(existing);
        verify(courseNotificationPublisher).notifyOnlineCourseUpdated(updated);
    }

    @Test
    void deleteCourse_deletesAndNotifiesDeleted() {
        long id = 9L;
        OnlineCourse existing = new OnlineCourse();
        existing.setId(id);
        existing.setTitle("À supprimer");
        existing.setLevel(Level.C1);
        existing.setTutorId(2L);

        when(repository.findById(id)).thenReturn(Optional.of(existing));

        onlineCourseService.deleteCourse(id);

        verify(repository).deleteById(id);
        verify(courseNotificationPublisher).notifyOnlineCourseDeleted(id, "À supprimer");
    }
}
