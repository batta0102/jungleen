package tn.esprit.userservice.web.dto;

import java.util.List;

public record CurrentUserResponse(
        String id,
        String username,
        String email,
        String fullName,
        List<String> roles
) {
}
