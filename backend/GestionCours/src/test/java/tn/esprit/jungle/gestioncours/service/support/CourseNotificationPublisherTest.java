package tn.esprit.jungle.gestioncours.service.support;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tn.esprit.jungle.gestioncours.entites.Level;
import tn.esprit.jungle.gestioncours.entites.NotificationType;
import tn.esprit.jungle.gestioncours.entites.OnlineCourse;
import tn.esprit.jungle.gestioncours.service.interfaces.NotificationService;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CourseNotificationPublisherTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CourseNotificationPublisher courseNotificationPublisher;

    @Test
    void notifyOnlineCourseCreated_callsCreateNotificationWithExpectedArguments() {
        ReflectionTestUtils.setField(courseNotificationPublisher, "recipientUserId", 1L);

        OnlineCourse course = new OnlineCourse();
        course.setId(10L);
        course.setTitle("Spring Boot");
        course.setLevel(Level.B1);
        course.setTutorId(5L);

        courseNotificationPublisher.notifyOnlineCourseCreated(course);

        verify(notificationService).createNotification(
                eq(1L),
                eq(NotificationType.COURSE_CREATED),
                eq("Cours ajouté"),
                eq("Le cours Spring Boot a été ajouté"),
                eq("{\"courseKind\":\"ONLINE\",\"courseId\":10,\"event\":\"CREATED\"}")
        );
    }
}
