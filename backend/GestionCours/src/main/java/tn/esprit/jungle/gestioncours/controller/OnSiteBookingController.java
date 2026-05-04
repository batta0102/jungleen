package tn.esprit.jungle.gestioncours.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.OnSiteBookingRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnSiteBookingResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnSiteBooking;
import tn.esprit.jungle.gestioncours.entites.OnSiteSession;
import tn.esprit.jungle.gestioncours.mapper.OnSiteBookingMapper;
import tn.esprit.jungle.gestioncours.response.ApiResponse;
import tn.esprit.jungle.gestioncours.service.interfaces.OnSiteBookingService;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteSessionRepository;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.service.model.BookingCreationResult;

import java.util.List;

/**
 * OnSiteBookingController
 * REST API controller for on-site booking operations
 * Handles HTTP requests and delegates to service layer
 * 
 * Base URL: /api/v1/onsite-bookings
 * All endpoints return ResponseEntity&lt;ApiResponse&lt;T&gt;&gt; for consistent response structure
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/onsite-bookings")
@CrossOrigin(origins = "*", maxAge = 3600)
public class OnSiteBookingController {

    @Autowired
    private OnSiteBookingService onSiteBookingService;

    @Autowired
    private OnSiteBookingMapper onSiteBookingMapper;

    @Autowired
    private OnSiteSessionRepository sessionRepository;


    @PostMapping("/add")
    public ResponseEntity<ApiResponse<OnSiteBookingResponseDto>> addBooking(
            @Valid @RequestBody OnSiteBookingRequestDto requestDto) {
        
        log.info("📝 [POST /api/v1/onsite-bookings/add] Received request to create on-site booking: bookingDate='{}', status={}, studentId={}, sessionId={}",
                 requestDto.getBookingDate(), requestDto.getStatus(), requestDto.getStudentId(), requestDto.getSessionId());

        // Verify session exists
        OnSiteSession session = sessionRepository.findById(requestDto.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("OnSiteSession with id " + requestDto.getSessionId() + " not found"));

        OnSiteBooking booking = onSiteBookingMapper.toEntity(requestDto);
        booking.setSession(session);
        
        BookingCreationResult<OnSiteBooking> creationResult = onSiteBookingService.addBooking(booking);
        OnSiteBooking createdBooking = creationResult.getBooking();
        OnSiteBookingResponseDto responseDto = onSiteBookingMapper.toResponseDto(createdBooking);

        log.info("🎉 [POST /api/v1/onsite-bookings/add] On-site booking created successfully with ID: {}", createdBooking.getId());

        if (creationResult.hasWarning()) {
            return ResponseEntity.ok(ApiResponse.success(responseDto, creationResult.getWarningMessage()));
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(responseDto, "On-site booking created successfully"));
    }


    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<OnSiteBookingResponseDto>>> getAllBookings() {
        log.info("📚 [GET /api/v1/onsite-bookings/all] Received request to retrieve all on-site bookings");
        
        List<OnSiteBooking> bookings = onSiteBookingService.getAllBookings();
        List<OnSiteBookingResponseDto> responseDtos = onSiteBookingMapper.toResponseDtoList(bookings);

        log.info("✅ [GET /api/v1/onsite-bookings/all] Returning {} on-site booking(s)", responseDtos.size());

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "On-site bookings retrieved successfully"));
    }


    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OnSiteBookingResponseDto>> getBookingById(
            @PathVariable Long id) {
        
        log.info("🔍 [GET /api/v1/onsite-bookings/{}] Received request to retrieve on-site booking", id);

        OnSiteBooking booking = onSiteBookingService.getBookingById(id);
        OnSiteBookingResponseDto responseDto = onSiteBookingMapper.toResponseDto(booking);

        log.info("✅ [GET /api/v1/onsite-bookings/{}] Returning on-site booking: status={}, studentId={}", id, booking.getStatus(), booking.getStudentId());

        return ResponseEntity.ok(ApiResponse.success(responseDto, "On-site booking retrieved successfully"));
    }


    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<OnSiteBookingResponseDto>> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody OnSiteBookingRequestDto requestDto) {
        
        log.info("✏️ [PUT /api/v1/onsite-bookings/update/{}] Received request to update on-site booking", id);

        OnSiteBooking existingBooking = onSiteBookingService.getBookingById(id);

        // Verify session exists
        OnSiteSession session = sessionRepository.findById(requestDto.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("OnSiteSession with id " + requestDto.getSessionId() + " not found"));

        OnSiteBooking bookingToUpdate = onSiteBookingMapper.updateEntityFromDto(requestDto, existingBooking);
        bookingToUpdate.setSession(session);
        
        OnSiteBooking updatedBooking = onSiteBookingService.updateBooking(id, bookingToUpdate);
        OnSiteBookingResponseDto responseDto = onSiteBookingMapper.toResponseDto(updatedBooking);

        log.info("✅ [PUT /api/v1/onsite-bookings/update/{}] On-site booking updated successfully", id);

        return ResponseEntity.ok(ApiResponse.success(responseDto, "On-site booking updated successfully"));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(@PathVariable Long id) {
        log.info("🗑️ [DELETE /api/v1/onsite-bookings/delete/{}] Received request to delete on-site booking", id);
        
        onSiteBookingService.deleteBooking(id);
        
        log.info("✅ [DELETE /api/v1/onsite-bookings/delete/{}] On-site booking deleted successfully", id);
        
        return ResponseEntity.ok(ApiResponse.success(null, "On-site booking deleted successfully"));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ApiResponse<List<OnSiteBookingResponseDto>>> getBookingsBySession(
            @PathVariable Long sessionId) {
        log.info("🔍 [GET /api/v1/onsite-bookings/session/{}] Received request to retrieve bookings for session", sessionId);

        List<OnSiteBooking> bookings = onSiteBookingService.getBookingsBySession(sessionId);
        List<OnSiteBookingResponseDto> responseDtos = onSiteBookingMapper.toResponseDtoList(bookings);

        log.info("✅ [GET /api/v1/onsite-bookings/session/{}] Returning {} booking(s)", sessionId, responseDtos.size());

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "Bookings retrieved successfully"));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<OnSiteBookingResponseDto>>> getBookingsByStudent(
            @PathVariable Long studentId) {
        log.info("🔍 [GET /api/v1/onsite-bookings/student/{}] Received request to retrieve bookings for student", studentId);

        List<OnSiteBooking> bookings = onSiteBookingService.getBookingsByStudent(studentId);
        List<OnSiteBookingResponseDto> responseDtos = onSiteBookingMapper.toResponseDtoList(bookings);

        log.info("✅ [GET /api/v1/onsite-bookings/student/{}] Returning {} booking(s)", studentId, responseDtos.size());

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "Bookings retrieved successfully"));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<OnSiteBookingResponseDto>>> getBookingsByStatus(
            @PathVariable String status) {
        log.info("🔍 [GET /api/v1/onsite-bookings/status/{}] Received request to retrieve bookings by status", status);

        List<OnSiteBooking> bookings = onSiteBookingService.getBookingsByStatus(status);
        List<OnSiteBookingResponseDto> responseDtos = onSiteBookingMapper.toResponseDtoList(bookings);

        log.info("✅ [GET /api/v1/onsite-bookings/status/{}] Returning {} booking(s)", status, responseDtos.size());

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "Bookings retrieved successfully"));
    }
}
