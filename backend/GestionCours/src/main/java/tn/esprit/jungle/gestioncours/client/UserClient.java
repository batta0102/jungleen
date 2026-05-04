package tn.esprit.jungle.gestioncours.client;

import java.util.Map;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", path = "/api/users")
public interface UserClient {

    @GetMapping("/{userId}/email")
    Map<String, String> getUserEmail(@PathVariable("userId") String userId);

    @GetMapping("/me")
    Map<String, Object> getCurrentUser();
}