package tn.esprit.event;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.ServletWebSecurityAutoConfiguration;
import org.springframework.boot.security.oauth2.server.resource.autoconfigure.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.event.config.SecurityConfig;
import tn.esprit.event.model.OnlineEvent;
import tn.esprit.event.service.EventSchedulingService;
import tn.esprit.event.service.EventService;
import tn.esprit.event.web.EventController;

@WebMvcTest(EventController.class)
@Import({SecurityConfig.class, MockJwtDecoderConfig.class})
@ImportAutoConfiguration({
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class,
        ServletWebSecurityAutoConfiguration.class
})
// ✅ Désactiver l'auto-config OAuth2 qui nécessite HttpSecurity
@EnableAutoConfiguration(exclude = {
        OAuth2ResourceServerAutoConfiguration.class
})
class EventControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventService eventService;

    @MockitoBean
    private EventSchedulingService schedulingService;

    @Test
    void createOnlineEvent_shouldRejectStudentRole() throws Exception {
        mockMvc.perform(post("/api/events/online")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_student")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void createOnlineEvent_shouldAllowAdminRole() throws Exception {
        when(eventService.createOnlineEvent(any())).thenReturn(new OnlineEvent());

        mockMvc.perform(post("/api/events/online")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_admin")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
    }

    @Test
    void optimizeSchedule_shouldBePublic() throws Exception {
        when(schedulingService.optimizeSchedule(any())).thenReturn(List.of());

        mockMvc.perform(post("/api/events/optimize-schedule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"events\":[]}"))
                .andExpect(status().isOk());
    }
}
