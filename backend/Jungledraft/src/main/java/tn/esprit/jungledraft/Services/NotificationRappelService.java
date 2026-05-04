package tn.esprit.jungledraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.jungledraft.Entities.BuddyPair;
import tn.esprit.jungledraft.Entities.BuddySession;
import tn.esprit.jungledraft.Entities.SessionStatus;
import tn.esprit.jungledraft.Repositories.BuddySessionRep;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class NotificationRappelService {

    private final BuddySessionRep buddySessionRepository;

    // Stocker les notifications déjà envoyées pour ne pas les renvoyer
    private final Set<String> notificationsEnvoyees = ConcurrentHashMap.newKeySet();

    /**
     * Obtenir l'heure locale
     */
    private LocalDateTime getNowLocal() {
        return LocalDateTime.now(ZoneId.of("Africa/Tunis"));
    }

    /**
     * SCHEDULER 1: Marquer les sessions qui nécessitent un rappel (toutes les minutes)
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void marquerSessionsProches() {
        LocalDateTime maintenant = getNowLocal();
        LocalDateTime dans5Minutes = maintenant.plusMinutes(5);

        System.out.println("🔍 [SCHEDULER] Recherche des sessions dans les 5 minutes - " + maintenant);

        List<BuddySession> toutesSessions = buddySessionRepository.findAll();

        int compteur = 0;

        for (BuddySession session : toutesSessions) {
            // 🔥 Vérification CRITIQUE : ignorer les sessions avec buddyPair null
            if (session.getBuddyPair() == null) {
                System.err.println("⚠️ Session " + session.getIdSession() + " ignorée (buddyPair = null)");
                continue;
            }

            if (session.getStatus() == SessionStatus.PLANIFIEE) {
                LocalDateTime dateSession = session.getDate();

                if (dateSession != null && dateSession.isAfter(maintenant) && dateSession.isBefore(dans5Minutes)) {
                    if (!session.isRappelEnvoye()) {
                        System.out.println("🚨 SESSION PROCHE DÉTECTÉE: " + session.getSujet() + " à " + dateSession);
                        session.setRappelEnvoye(true);
                        buddySessionRepository.save(session);
                        compteur++;
                    }
                }
            }
        }

        if (compteur > 0) {
            System.out.println("📊 " + compteur + " session(s) marquée(s) comme proches");
        }
    }

    /**
     * SCHEDULER 2: Nettoyage des anciennes notifications (tous les jours à 3h)
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void nettoyerAnciennesNotifications() {
        notificationsEnvoyees.clear();
        System.out.println("🧹 Nettoyage des notifications envoyées effectué");
    }

    /**
     * Récupérer les sessions proches (dans les 5 minutes) pour un utilisateur
     */
    public List<Map<String, Object>> getSessionsProchesPourUtilisateur(Long userId) {
        LocalDateTime maintenant = getNowLocal();
        LocalDateTime dans5Minutes = maintenant.plusMinutes(5);

        List<BuddySession> toutesSessions = buddySessionRepository.findAll();
        List<Map<String, Object>> sessionsProches = new ArrayList<>();

        for (BuddySession session : toutesSessions) {
            // 🔥 Vérification CRITIQUE : ignorer les sessions avec buddyPair null
            if (session.getBuddyPair() == null) {
                continue;
            }

            BuddyPair buddyPair = session.getBuddyPair();

            // Vérifier si l'utilisateur fait partie de cette session
            boolean estParticipant = buddyPair.getUserID_1().equals(userId) ||
                    buddyPair.getUserID_2().equals(userId);

            if (estParticipant) {
                LocalDateTime dateSession = session.getDate();

                if (dateSession != null && dateSession.isAfter(maintenant) &&
                        dateSession.isBefore(dans5Minutes) && session.isRappelEnvoye()) {

                    String key = session.getIdSession() + "_" + userId;

                    if (!notificationsEnvoyees.contains(key)) {
                        Map<String, Object> sessionInfo = new HashMap<>();
                        sessionInfo.put("sessionId", session.getIdSession());
                        sessionInfo.put("sujet", session.getSujet());
                        sessionInfo.put("date", session.getDate().toString());
                        sessionInfo.put("heure", session.getDate().toLocalTime().toString());
                        sessionInfo.put("duree", session.getDuree());
                        sessionInfo.put("lieu", session.getLieu() != null ? session.getLieu() : "À définir");
                        sessionInfo.put("notes", session.getNotes() != null ? session.getNotes() : "Aucune");

                        sessionsProches.add(sessionInfo);
                        notificationsEnvoyees.add(key);

                        System.out.println("📤 Notification préparée pour user " + userId + ": " + session.getSujet());
                    }
                }
            }
        }

        return sessionsProches;
    }

    /**
     * Marquer qu'une notification a été vue par l'utilisateur
     */
    public void marquerNotificationVue(Long sessionId, Long userId) {
        String key = sessionId + "_" + userId;
        notificationsEnvoyees.remove(key);
        System.out.println("👁️ Notification marquée comme vue pour session " + sessionId + ", user " + userId);
    }

    /**
     * Récupérer toutes les sessions à venir pour un utilisateur
     */
    public List<Map<String, Object>> getSessionsAVenirPourUtilisateur(Long userId) {
        LocalDateTime maintenant = getNowLocal();
        List<BuddySession> toutesSessions = buddySessionRepository.findAll();
        List<Map<String, Object>> sessionsAVenir = new ArrayList<>();

        for (BuddySession session : toutesSessions) {
            // 🔥 Vérification CRITIQUE : ignorer les sessions avec buddyPair null
            if (session.getBuddyPair() == null) {
                continue;
            }

            BuddyPair buddyPair = session.getBuddyPair();

            boolean estParticipant = buddyPair.getUserID_1().equals(userId) ||
                    buddyPair.getUserID_2().equals(userId);

            if (estParticipant && session.getDate() != null && session.getDate().isAfter(maintenant)) {
                Map<String, Object> sessionInfo = new HashMap<>();
                sessionInfo.put("sessionId", session.getIdSession());
                sessionInfo.put("sujet", session.getSujet());
                sessionInfo.put("date", session.getDate().toString());
                sessionInfo.put("heure", session.getDate().toLocalTime().toString());
                sessionInfo.put("duree", session.getDuree());
                sessionInfo.put("lieu", session.getLieu() != null ? session.getLieu() : "À définir");
                sessionInfo.put("estProche", session.getDate().isBefore(maintenant.plusMinutes(5)));

                sessionsAVenir.add(sessionInfo);
            }
        }

        sessionsAVenir.sort(Comparator.comparing(m -> (String) m.get("date")));
        return sessionsAVenir;
    }
}