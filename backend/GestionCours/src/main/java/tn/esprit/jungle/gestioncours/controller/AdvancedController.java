package tn.esprit.jungle.gestioncours.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.AttendanceRequestDto;
import tn.esprit.jungle.gestioncours.dto.AttendanceResponseDto;
import tn.esprit.jungle.gestioncours.dto.ProgressResponse;
import tn.esprit.jungle.gestioncours.entites.SessionType;
import tn.esprit.jungle.gestioncours.service.interfaces.AttendanceService;
import tn.esprit.jungle.gestioncours.service.interfaces.ProgressService;

import java.util.List;

@RestController
@RequestMapping({"/advanced", "/api/advanced"})
@CrossOrigin(origins = {"http://localhost:4300", "http://localhost:4200"}, maxAge = 3600)
@RequiredArgsConstructor
@Tag(name = "Advanced", description = "Advanced endpoints: attendance marking, session attendances, progress")
public class AdvancedController {

    private final AttendanceService attendanceService;
    private final ProgressService progressService;

    @PostMapping("/attendance/mark")
    @Operation(summary = "Mark or update attendance", description = "Creates or updates attendance for a student in a session. If a record exists for (sessionType, sessionId, studentId), updates status/note/markedAt; otherwise creates a new record.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Attendance saved",
                    content = @Content(schema = @Schema(implementation = AttendanceResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request (e.g. null sessionId/studentId)")
    })
    public ResponseEntity<AttendanceResponseDto> markAttendance(
            @Valid @RequestBody AttendanceRequestDto request) {
        AttendanceResponseDto response = attendanceService.markAttendance(request);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/attendance/session")
    @Operation(summary = "List attendances by session", description = "Returns all attendance records for a given session (type + id).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of attendances for the session",
                    content = @Content(schema = @Schema(implementation = AttendanceResponseDto.class)))
    })
    public ResponseEntity<List<AttendanceResponseDto>> getAttendanceBySession(
            @Parameter(description = "Session type: ONLINE or ONSITE", required = true) @RequestParam SessionType type,
            @Parameter(description = "Session ID", required = true) @RequestParam Long id) {
        List<AttendanceResponseDto> list = attendanceService.getBySession(type, id);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/progress")
    @Operation(summary = "Calculate progress", description = "Computes attendance progress for a student in a course: total sessions, present/excused count, rate and eligibility (default threshold 80%).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Progress result",
                    content = @Content(schema = @Schema(implementation = ProgressResponse.class)))
    })
    public ResponseEntity<ProgressResponse> getProgress(
            @Parameter(description = "Course type: ONLINE or ONSITE", required = true) @RequestParam SessionType courseType,
            @Parameter(description = "Course ID", required = true) @RequestParam Long courseId,
            @Parameter(description = "Student ID", required = true) @RequestParam Long studentId) {
        ProgressResponse response = progressService.calcProgress(courseType, courseId, studentId);
        return ResponseEntity.ok(response);
    }
}
