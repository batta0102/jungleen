package tn.esprit.pidraft.Controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.pidraft.Services.AdmissionAnalyticsService;
import tn.esprit.pidraft.dto.analytics.AdmissionAnalyticsResponseDto;

@RestController
@RequestMapping("/api/analytics/admission")
public class AdmissionAnalyticsController {

    private final AdmissionAnalyticsService admissionAnalyticsService;

    public AdmissionAnalyticsController(AdmissionAnalyticsService admissionAnalyticsService) {
        this.admissionAnalyticsService = admissionAnalyticsService;
    }

    @GetMapping
    public AdmissionAnalyticsResponseDto getDashboard() {
        return admissionAnalyticsService.getAdmissionDashboard();
    }
}
