package tn.esprit.jungledraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.jungledraft.Entities.Club;
import tn.esprit.jungledraft.Entities.ClubMessage;
import tn.esprit.jungledraft.Repositories.ClubMessageRep;
import tn.esprit.jungledraft.Repositories.ClubRep;

import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MessageEpingleService {

    private final ClubMessageRep messageRepository;
    private final ClubRep clubRepository;

    // Nombre maximum de messages épinglés par club
    private static final int MAX_EPINGLES_PAR_CLUB = 3;

    // Nombre minimum de likes pour être épinglé automatiquement
    private static final int MIN_LIKES_AUTO_EPINGLE = 10;

    // Durée d'épinglage en jours
    private static final int DUREE_EPINGLE_JOURS = 7;

    /**
     * 1. Épingler manuellement un message (par un admin/modérateur)
     */
    @Transactional
    public ClubMessage epinglerManuellement(Long messageId, String raison) {
        ClubMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé"));

        Long clubId = message.getClub().getIdClub();

        // 🔥 CORRECTION : Utiliser la bonne méthode
        long nbEpingle = messageRepository.countMessagesEpingle(clubId);

        if (nbEpingle >= MAX_EPINGLES_PAR_CLUB) {
            // Désépingler le plus ancien pour faire de la place
            desepinglerLePlusAncien(clubId);
        }

        // Épingler le nouveau message
        message.setEpingle(true);
        message.setDateEpingle(new Date());
        message.setRaisonEpingle(raison != null ? raison : "Épinglé manuellement par un modérateur");

        System.out.println("📌 Message " + messageId + " épinglé manuellement");

        return messageRepository.save(message);
    }

    /**
     * 2. Désépingler un message
     */
    @Transactional
    public ClubMessage desepingler(Long messageId) {
        ClubMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé"));

        message.setEpingle(false);
        message.setDateEpingle(null);
        message.setRaisonEpingle(null);

        System.out.println("📍 Message " + messageId + " désépinglé");

        return messageRepository.save(message);
    }

    /**
     * 3. SCHEDULER : Épinglage automatique des messages viraux (toutes les heures)
     */
    @Scheduled(cron = "0 0 * * * *") // Toutes les heures
    @Transactional
    public void autoEpinglerMessagesViraux() {
        System.out.println("🔍 [AUTO-ÉPINGLE] Recherche des messages viraux...");

        List<Club> tousLesClubs = clubRepository.findAll();
        Date dateLimite = new Date(System.currentTimeMillis() - TimeUnit.HOURS.toMillis(24)); // dernières 24h

        for (Club club : tousLesClubs) {
            Long clubId = club.getIdClub();  // 🔥 CORRECTION : Déclarer clubId

            // Chercher les messages populaires dans ce club
            List<ClubMessage> messagesViraux = messageRepository.findMessagesViraux(
                    clubId, MIN_LIKES_AUTO_EPINGLE, dateLimite);

            for (ClubMessage message : messagesViraux) {
                // Vérifier la limite d'épingles
                long nbEpingle = messageRepository.countMessagesEpingle(clubId);

                if (nbEpingle < MAX_EPINGLES_PAR_CLUB) {
                    message.setEpingle(true);
                    message.setDateEpingle(new Date());
                    message.setRaisonEpingle("Auto-épinglé : " + message.getLikes() + " likes en 24h");
                    messageRepository.save(message);

                    System.out.println("📌 AUTO-ÉPINGLE : Message " + message.getIdMessage() +
                            " (" + message.getLikes() + " likes)");
                }
            }
        }
    }

    /**
     * 4. SCHEDULER : Désépingler les messages trop vieux (tous les jours à 1h)
     */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void desepinglerMessagesAnciens() {
        Date dateLimite = new Date(System.currentTimeMillis() -
                TimeUnit.DAYS.toMillis(DUREE_EPINGLE_JOURS));

        int nbDesepingles = messageRepository.desepinglerMessagesAnciens(dateLimite);

        if (nbDesepingles > 0) {
            System.out.println("🧹 " + nbDesepingles + " message(s) désépinglé(s) (trop anciens)");
        }
    }

    /**
     * 5. Désépingler le message le plus ancien d'un club
     */
    private void desepinglerLePlusAncien(Long clubId) {
        // 🔥 CORRECTION : Utiliser la bonne méthode
        List<ClubMessage> messagesEpingle = messageRepository.getMessagesEpingle(clubId);

        if (!messagesEpingle.isEmpty()) {
            // Trier par date d'épinglage (le plus ancien d'abord)
            messagesEpingle.sort((a, b) -> a.getDateEpingle().compareTo(b.getDateEpingle()));
            ClubMessage plusAncien = messagesEpingle.get(0);

            plusAncien.setEpingle(false);
            plusAncien.setDateEpingle(null);
            messageRepository.save(plusAncien);

            System.out.println("📍 Désépinglé (ancien) : Message " + plusAncien.getIdMessage());
        }
    }

    /**
     * 6. Récupérer tous les messages épinglés d'un club
     */
    public List<ClubMessage> getMessagesEpingle(Long clubId) {
        // 🔥 CORRECTION : Utiliser la bonne méthode
        return messageRepository.getMessagesEpingle(clubId);
    }

    /**
     * 7. Vérifier si un club peut encore épingler des messages
     */
    public boolean peutEpingle(Long clubId) {
        // 🔥 CORRECTION : Utiliser la bonne méthode
        long nbEpingle = messageRepository.countMessagesEpingle(clubId);
        return nbEpingle < MAX_EPINGLES_PAR_CLUB;
    }

    /**
     * 8. Obtenir le nombre d'épingles restantes
     */
    public long getEpingleRestantes(Long clubId) {
        // 🔥 CORRECTION : Utiliser la bonne méthode
        long nbEpingle = messageRepository.countMessagesEpingle(clubId);
        return MAX_EPINGLES_PAR_CLUB - nbEpingle;
    }
}