package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.jungle.gestioncours.entites.RealtimeNotification;

import java.util.List;
import java.util.Optional;

public interface RealtimeNotificationRepository extends JpaRepository<RealtimeNotification, Long> {

    List<RealtimeNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<RealtimeNotification> findByIdAndUserId(Long id, Long userId);
}
