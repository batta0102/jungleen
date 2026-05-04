package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.dto.RealtimeNotificationResponse;
import tn.esprit.jungle.gestioncours.entites.NotificationType;
import tn.esprit.jungle.gestioncours.entites.RealtimeNotification;

import java.util.List;

public interface NotificationService {

    List<RealtimeNotificationResponse> getMyNotifications(Long userId);

    void markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);

    RealtimeNotification createNotification(Long userId, NotificationType type, String title, String message, String payloadJson);
}
