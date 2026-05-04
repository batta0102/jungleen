package tn.esprit.jungle.gestioncours.config;

import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

import java.security.Principal;

/**
 * Associe le principal STOMP au header {@code userId} du frame CONNECT.
 * <p>
 * Permet à {@code convertAndSendToUser(String.valueOf(userId), ...)} de cibler la bonne session
 * sans Spring Security (usage dev / projet étudiant). Le client doit envoyer le même identifiant
 * que celui utilisé côté API (ex. aligné sur {@code notifications.debug-user-id}).
 * </p>
 */
public class StompConnectUserIdChannelInterceptor implements ChannelInterceptor {

    public static final String USER_ID_HEADER = "userId";

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }
        String userId = accessor.getFirstNativeHeader(USER_ID_HEADER);
        if (userId == null || userId.isBlank()) {
            return message;
        }
        final String name = userId.trim();
        Principal user = () -> name;
        accessor.setUser(user);
        return message;
    }
}
