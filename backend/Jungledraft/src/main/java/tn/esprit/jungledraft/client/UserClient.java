package tn.esprit.jungledraft.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "user-service", path = "/api/users")
public interface UserClient {

    @GetMapping("/{userId}/email")
    Map<String, String> getUserEmail(@PathVariable("userId") String userId);
}
