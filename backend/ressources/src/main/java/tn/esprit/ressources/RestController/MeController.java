package tn.esprit.ressources.RestController;

import java.util.HashMap;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("sub", jwt.getSubject());
        userInfo.put("email", jwt.getClaimAsString("email"));
        userInfo.put("preferred_username", jwt.getClaimAsString("preferred_username"));
        userInfo.put("iss", jwt.getClaimAsString("iss"));
        userInfo.put("name", jwt.getClaimAsString("name"));
        userInfo.put("given_name", jwt.getClaimAsString("given_name"));
        userInfo.put("family_name", jwt.getClaimAsString("family_name"));
        userInfo.put("authorities", jwt.getClaim("realm_access"));
        userInfo.put("resource_access", jwt.getClaim("resource_access"));
        return userInfo;
    }
}
