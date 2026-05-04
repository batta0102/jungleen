package tn.esprit.jungle.gestioncours.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.OnlineSessionRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnlineSessionResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnlineSession;
import tn.esprit.jungle.gestioncours.mapper.OnlineSessionMapper;
import tn.esprit.jungle.gestioncours.response.ApiResponse;
import tn.esprit.jungle.gestioncours.service.interfaces.OnlineSessionService;

import java.util.List;

@RestController
@RequestMapping(value = { "/online-sessions", "/api/v1/online-sessions" })
@CrossOrigin(origins = "*", maxAge = 3600)
public class OnlineSessionController {

    @Autowired
    private OnlineSessionService onlineSessionService;

    @Autowired
    private OnlineSessionMapper onlineSessionMapper;

    /**
     * Add a new online session
     * POST /api/v1/online-sessions/add
     */
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<OnlineSessionResponseDto>> addSession(
            @Valid @RequestBody OnlineSessionRequestDto requestDto) {

        OnlineSession session = onlineSessionMapper.toEntity(requestDto);
        OnlineSession createdSession = onlineSessionService.addSession(session);
        OnlineSessionResponseDto responseDto = onlineSessionMapper.toResponseDto(createdSession);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(responseDto, "Session created successfully"));
    }

    /**
     * Get all sessions
     * GET /api/v1/online-sessions/getAll
     */
    @GetMapping("/getAll")
    public ResponseEntity<ApiResponse<List<OnlineSessionResponseDto>>> getAllSessions() {

        List<OnlineSession> sessions = onlineSessionService.getAllSessions();
        List<OnlineSessionResponseDto> responseDtos = onlineSessionMapper.toResponseDtoList(sessions);

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "Sessions retrieved successfully"));
    }

    /**
     * Get session by ID
     * GET /api/v1/online-sessions/getById/{id}
     */
    @GetMapping("/getById/{id}")
    public ResponseEntity<ApiResponse<OnlineSessionResponseDto>> getSessionById(
            @PathVariable Long id) {

        OnlineSession session = onlineSessionService.getSessionById(id);
        OnlineSessionResponseDto responseDto = onlineSessionMapper.toResponseDto(session);

        return ResponseEntity.ok(ApiResponse.success(responseDto, "Session retrieved successfully"));
    }

    /**
     * Update session
     * PUT /api/v1/online-sessions/update/{id}
     */
    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<OnlineSessionResponseDto>> updateSession(
            @PathVariable Long id,
            @Valid @RequestBody OnlineSessionRequestDto requestDto) {

        OnlineSession existingSession = onlineSessionService.getSessionById(id);
        OnlineSession sessionToUpdate = onlineSessionMapper.updateEntityFromDto(requestDto, existingSession);
        OnlineSession updatedSession = onlineSessionService.updateSession(id, sessionToUpdate);
        OnlineSessionResponseDto responseDto = onlineSessionMapper.toResponseDto(updatedSession);

        return ResponseEntity.ok(ApiResponse.success(responseDto, "Session updated successfully"));
    }

    /**
     * Delete session
     * DELETE /api/v1/online-sessions/delete/{id}
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable Long id) {

        onlineSessionService.deleteSession(id);

        return ResponseEntity.ok(ApiResponse.success(null, "Session deleted successfully"));
    }

    /**
     * Get sessions by course ID
     * GET /api/v1/online-sessions/getByCourse/{courseId}
     */
    @GetMapping("/getByCourse/{courseId}")
    public ResponseEntity<ApiResponse<List<OnlineSessionResponseDto>>> getSessionsByCourse(
            @PathVariable Long courseId) {

        List<OnlineSession> sessions = onlineSessionService.getSessionsByCourse(courseId);
        List<OnlineSessionResponseDto> responseDtos = onlineSessionMapper.toResponseDtoList(sessions);

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "Sessions retrieved successfully"));
    }
}
