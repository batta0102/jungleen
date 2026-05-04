package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.jungle.gestioncours.dto.RealtimeNotificationResponse;
import tn.esprit.jungle.gestioncours.entites.NotificationType;
import tn.esprit.jungle.gestioncours.entites.RealtimeNotification;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.repositorie.RealtimeNotificationRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.NotificationService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Notifications persistées (REST inchangé) + envoi temps réel optionnel via STOMP utilisateur.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    /** Destination relative au préfixe utilisateur : abonnement client typique {@code /user/queue/notifications}. */
    private static final String USER_NOTIFICATIONS_DESTINATION = "/queue/notifications";

    private final RealtimeNotificationRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public List<RealtimeNotificationResponse> getMyNotifications(Long userId) {
        validateUserId(userId);
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        validateId(notificationId, "Notification ID");
        validateUserId(userId);

        RealtimeNotification notification = repository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RealtimeNotification with id " + notificationId + " not found for user " + userId));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            repository.save(notification);
            log.info("Marked notification id={} as read for userId={}", notificationId, userId);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        validateUserId(userId);

        LocalDateTime now = LocalDateTime.now();
        List<RealtimeNotification> notifications = repository.findByUserIdOrderByCreatedAtDesc(userId);
        for (RealtimeNotification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                notification.setReadAt(now);
            }
        }
        repository.saveAll(notifications);
        log.info("Marked all notifications as read for userId={}, total={}", userId, notifications.size());
    }

    @Override
    public RealtimeNotification createNotification(Long userId, NotificationType type, String title, String message, String payloadJson) {
        validateUserId(userId);
        if (type == null) {
            throw new InvalidInputException("Notification type is required");
        }
        if (title == null || title.isBlank()) {
            throw new InvalidInputException("Notification title is required");
        }
        if (message == null || message.isBlank()) {
            throw new InvalidInputException("Notification message is required");
        }

        RealtimeNotification notification = new RealtimeNotification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setPayloadJson(payloadJson);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setReadAt(null);

        RealtimeNotification saved = repository.save(notification);
        log.info("Created notification id={} for userId={} type={}", saved.getId(), userId, type);

        pushToUserWebSocket(userId, toResponse(saved));

        return saved;
    }

    /**
     * Envoie la notification au client STOMP abonné pour cet utilisateur.
     * Ne modifie pas la persistance : en cas d'échec (broker, session), le REST reste la source de vérité.
     */
    private void pushToUserWebSocket(Long userId, RealtimeNotificationResponse payload) {
        try {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(userId),
                    USER_NOTIFICATIONS_DESTINATION,
                    payload);
            log.debug("STOMP push userId={} destination={}", userId, USER_NOTIFICATIONS_DESTINATION);
        } catch (Exception e) {
            log.warn("STOMP push skipped for userId={}: {}", userId, e.getMessage());
        }
    }

    private RealtimeNotificationResponse toResponse(RealtimeNotification entity) {
        return new RealtimeNotificationResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getPayloadJson(),
                entity.isRead(),
                entity.getCreatedAt(),
                entity.getReadAt()
        );
    }

    private void validateUserId(Long userId) {
        validateId(userId, "User ID");
    }

    private void validateId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new InvalidInputException(fieldName + " must be a positive number");
        }
    }
}
