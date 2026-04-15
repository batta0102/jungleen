package tn.esprit.userservice.web.dto;

public record UserSummaryResponse(
        String id,
        String username,
        String email,
        String firstName,
        String lastName,
        Boolean enabled,
        Boolean emailVerified,
        Long createdTimestamp
) {
}
