package tn.esprit.jungle.gestioncours.service.support;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tn.esprit.jungle.gestioncours.entites.NotificationType;
import tn.esprit.jungle.gestioncours.entites.OnSiteCourse;
import tn.esprit.jungle.gestioncours.entites.OnlineCourse;
import tn.esprit.jungle.gestioncours.service.interfaces.NotificationService;

/**
 * Notifications automatiques cours (création / mise à jour / suppression).
 * {@code notifications.course-event-recipient-user-id} : destinataire démo (ex. 1).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CourseNotificationPublisher {

    private final NotificationService notificationService;

    @Value("${notifications.course-event-recipient-user-id:1}")
    private long recipientUserId;

    public void notifyOnlineCourseCreated(OnlineCourse course) {
        publish(course.getId(), course.getTitle(), "ONLINE", NotificationType.COURSE_CREATED,
                "Cours ajouté", "Le cours %s a été ajouté", "CREATED");
    }

    public void notifyOnlineCourseUpdated(OnlineCourse course) {
        publish(course.getId(), course.getTitle(), "ONLINE", NotificationType.COURSE_UPDATED,
                "Cours mis à jour", "Le cours %s a été mis à jour", "UPDATED");
    }

    public void notifyOnlineCourseDeleted(Long courseId, String title) {
        publish(courseId, title, "ONLINE", NotificationType.COURSE_DELETED,
                "Cours supprimé", "Le cours %s a été supprimé", "DELETED");
    }

    public void notifyOnSiteCourseCreated(OnSiteCourse course) {
        publish(course.getId(), course.getTitle(), "ONSITE", NotificationType.COURSE_CREATED,
                "Cours ajouté", "Le cours %s a été ajouté", "CREATED");
    }

    public void notifyOnSiteCourseUpdated(OnSiteCourse course) {
        publish(course.getId(), course.getTitle(), "ONSITE", NotificationType.COURSE_UPDATED,
                "Cours mis à jour", "Le cours %s a été mis à jour", "UPDATED");
    }

    public void notifyOnSiteCourseDeleted(Long courseId, String title) {
        publish(courseId, title, "ONSITE", NotificationType.COURSE_DELETED,
                "Cours supprimé", "Le cours %s a été supprimé", "DELETED");
    }

    private void publish(Long courseId, String title, String kind, NotificationType type,
                         String notificationTitle, String messageFormat, String event) {
        if (courseId == null) {
            return;
        }
        String safeTitle = (title != null && !title.isBlank()) ? title : "(sans titre)";
        try {
            String message = String.format(messageFormat, safeTitle);
            String payloadJson = String.format(
                    "{\"courseKind\":\"%s\",\"courseId\":%d,\"event\":\"%s\"}",
                    kind, courseId, event);
            notificationService.createNotification(
                    recipientUserId,
                    type,
                    notificationTitle,
                    message,
                    payloadJson);
        } catch (Exception e) {
            log.warn("Notification cours non envoyée (courseId={}, event={}): {}", courseId, event, e.getMessage());
        }
    }
}
