package tn.esprit.event;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.event.config.SecurityConfig;
import tn.esprit.event.model.OnlineEvent;
import tn.esprit.event.service.EventSchedulingService;
import tn.esprit.event.service.EventService;
import tn.esprit.event.web.EventController;
import tn.esprit.event.web.dto.OptimizedEventDto;

@WebMvcTest(EventController.class)
@Import(SecurityConfig.class)
class EventControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventService eventService;

    @MockBean
    private EventSchedulingService schedulingService;

    @MockBean
    private JwtDecoder jwtDecoder;

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
