package tn.esprit.jungle.gestioncours.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.ClassroomResponseDto;
import tn.esprit.jungle.gestioncours.dto.OnSiteSessionRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnSiteSessionResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnSiteSession;
import tn.esprit.jungle.gestioncours.entites.OnSiteCourse;
import tn.esprit.jungle.gestioncours.entites.Classroom;
import tn.esprit.jungle.gestioncours.entites.ClassroomType;
import tn.esprit.jungle.gestioncours.mapper.ClassroomMapper;
import tn.esprit.jungle.gestioncours.mapper.OnSiteSessionMapper;
import tn.esprit.jungle.gestioncours.response.ApiResponse;
import tn.esprit.jungle.gestioncours.service.interfaces.OnSiteSessionService;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteCourseRepository;
import tn.esprit.jungle.gestioncours.repositorie.ClassroomRepository;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;

import java.util.List;
import java.util.Date;
import java.util.Optional;

/**
 * OnSiteSessionController
 * REST API controller for on-site session operations
 * Handles HTTP requests and delegates to service layer
 * 
 * Base URL: /api/v1/onsite-sessions
 * All endpoints return ResponseEntity&lt;ApiResponse&lt;T&gt;&gt; for consistent response structure
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/onsite-sessions", "/v1/onsite-sessions"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class OnSiteSessionController {

    @Autowired
    private OnSiteSessionService onSiteSessionService;

    @Autowired
    private OnSiteSessionMapper onSiteSessionMapper;

    @Autowired
    private OnSiteCourseRepository courseRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private ClassroomMapper classroomMapper;


    @PostMapping("/add")
    public ResponseEntity<ApiResponse<OnSiteSessionResponseDto>> addSession(
            @Valid @RequestBody OnSiteSessionRequestDto requestDto) {
        
        log.info("📝 [POST /api/v1/onsite-sessions/add] Received request to create on-site session: date='{}', capacity={}, courseId={}, classroomId={}",
                 requestDto.getDate(), requestDto.getCapacity(), requestDto.getCourseId(), requestDto.getClassroomId());

        // Verify course exists
        OnSiteCourse course = courseRepository.findById(requestDto.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("OnSiteCourse with id " + requestDto.getCourseId() + " not found"));

        // Verify classroom exists
        Classroom classroom = classroomRepository.findById(requestDto.getClassroomId())
                .orElseThrow(() -> new ResourceNotFoundException("Classroom with id " + requestDto.getClassroomId() + " not found"));

        OnSiteSession session = onSiteSessionMapper.toEntity(requestDto);
        session.setCourse(course);
        session.setClassroom(classroom);
        
        OnSiteSession createdSession = onSiteSessionService.addSession(session);
        OnSiteSessionResponseDto responseDto = onSiteSessionMapper.toResponseDto(createdSession);

        log.info("🎉 [POST /api/v1/onsite-sessions/add] On-site session created successfully with ID: {}", createdSession.getId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(responseDto, "On-site session created successfully"));
    }


    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<OnSiteSessionResponseDto>>> getAllSessions() {
        log.info("📚 [GET /api/v1/onsite-sessions/all] Received request to retrieve all on-site sessions");
        
        List<OnSiteSession> sessions = onSiteSessionService.getAllSessions();
        List<OnSiteSessionResponseDto> responseDtos = onSiteSessionMapper.toResponseDtoList(sessions);

        log.info("✅ [GET /api/v1/onsite-sessions/all] Returning {} on-site session(s)", responseDtos.size());

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "On-site sessions retrieved successfully"));
    }


    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OnSiteSessionResponseDto>> getSessionById(
            @PathVariable Long id) {
        
        log.info("🔍 [GET /api/v1/onsite-sessions/{}] Received request to retrieve on-site session", id);

        OnSiteSession session = onSiteSessionService.getSessionById(id);
        OnSiteSessionResponseDto responseDto = onSiteSessionMapper.toResponseDto(session);

        log.info("✅ [GET /api/v1/onsite-sessions/{}] Returning on-site session: date={}, capacity={}", id, session.getDate(), session.getCapacity());

        return ResponseEntity.ok(ApiResponse.success(responseDto, "On-site session retrieved successfully"));
    }


    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<OnSiteSessionResponseDto>> updateSession(
            @PathVariable Long id,
            @Valid @RequestBody OnSiteSessionRequestDto requestDto) {
        
        log.info("✏️ [PUT /api/v1/onsite-sessions/update/{}] Received request to update on-site session", id);

        OnSiteSession existingSession = onSiteSessionService.getSessionById(id);

        // Verify course exists if provided
        OnSiteCourse course = courseRepository.findById(requestDto.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("OnSiteCourse with id " + requestDto.getCourseId() + " not found"));

        // Verify classroom exists if provided
        Classroom classroom = classroomRepository.findById(requestDto.getClassroomId())
                .orElseThrow(() -> new ResourceNotFoundException("Classroom with id " + requestDto.getClassroomId() + " not found"));

        OnSiteSession sessionToUpdate = onSiteSessionMapper.updateEntityFromDto(requestDto, existingSession);
        sessionToUpdate.setCourse(course);
        sessionToUpdate.setClassroom(classroom);
        
        OnSiteSession updatedSession = onSiteSessionService.updateSession(id, sessionToUpdate);
        OnSiteSessionResponseDto responseDto = onSiteSessionMapper.toResponseDto(updatedSession);

        log.info("✅ [PUT /api/v1/onsite-sessions/update/{}] On-site session updated successfully", id);

        return ResponseEntity.ok(ApiResponse.success(responseDto, "On-site session updated successfully"));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable Long id) {
        log.info("🗑️ [DELETE /api/v1/onsite-sessions/delete/{}] Received request to delete on-site session", id);
        
        onSiteSessionService.deleteSession(id);
        
        log.info("✅ [DELETE /api/v1/onsite-sessions/delete/{}] On-site session deleted successfully", id);
        
        return ResponseEntity.ok(ApiResponse.success(null, "On-site session deleted successfully"));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<OnSiteSessionResponseDto>>> getSessionsByCourse(
            @PathVariable Long courseId) {
        log.info("🔍 [GET /api/v1/onsite-sessions/course/{}] Received request to retrieve sessions for course", courseId);

        List<OnSiteSession> sessions = onSiteSessionService.getSessionsByCourse(courseId);
        List<OnSiteSessionResponseDto> responseDtos = onSiteSessionMapper.toResponseDtoList(sessions);

        log.info("✅ [GET /api/v1/onsite-sessions/course/{}] Returning {} session(s)", courseId, responseDtos.size());

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "Sessions retrieved successfully"));
    }

    @GetMapping("/recommend-classroom")
    public ResponseEntity<ApiResponse<ClassroomResponseDto>> recommendClassroom(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Date date,
            @RequestParam Integer requiredCapacity,
            @RequestParam(required = false) ClassroomType preferredType) {
        log.info("🔎 [GET /api/v1/onsite-sessions/recommend-classroom] date={}, requiredCapacity={}, preferredType={}",
                date, requiredCapacity, preferredType);

        Optional<Classroom> recommendation = onSiteSessionService.recommendClassroom(date, requiredCapacity, preferredType);
        if (recommendation.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No available classroom matches the criteria"));
        }

        ClassroomResponseDto responseDto = classroomMapper.toResponseDto(recommendation.get());
        return ResponseEntity.ok(ApiResponse.success(responseDto, "Classroom recommendation found"));
    }
}
