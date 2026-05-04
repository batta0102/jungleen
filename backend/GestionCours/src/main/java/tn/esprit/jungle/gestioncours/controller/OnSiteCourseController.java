package tn.esprit.jungle.gestioncours.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.OnSiteCourseRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnSiteCourseResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnSiteCourse;
import tn.esprit.jungle.gestioncours.mapper.OnSiteCourseMapper;
import tn.esprit.jungle.gestioncours.response.ApiResponse;
import tn.esprit.jungle.gestioncours.service.interfaces.OnSiteCourseService;

import java.util.List;

/**
 * OnSiteCourseController
 * REST API controller for on-site course operations
 * Handles HTTP requests and delegates to service layer
 * 
 * Base URL: /api/v1/onsite-courses
 * All endpoints return ResponseEntity&lt;ApiResponse&lt;T&gt;&gt; for consistent response structure
 */
@Slf4j
@RestController
@RequestMapping({"/onsitecourses", "/api/v1/onsitecourses"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class OnSiteCourseController {

    @Autowired
    private OnSiteCourseService onSiteCourseService;

    @Autowired
    private OnSiteCourseMapper onSiteCourseMapper;


    @PostMapping("/add")
    public ResponseEntity<ApiResponse<OnSiteCourseResponseDto>> addCourse(
            @Valid @RequestBody OnSiteCourseRequestDto requestDto) {
        
        log.info("📝 [POST /api/v1/onsite-courses/add] Received request to create on-site course: title='{}', level={}, tutorId={}",
                 requestDto.getTitle(), requestDto.getLevel(), requestDto.getTutorId());

        OnSiteCourse course = onSiteCourseMapper.toEntity(requestDto);
        OnSiteCourse createdCourse = onSiteCourseService.addCourse(course);
        OnSiteCourseResponseDto responseDto = onSiteCourseMapper.toResponseDto(createdCourse);

        log.info("🎉 [POST /api/v1/onsite-courses/add] On-site course created successfully with ID: {}", createdCourse.getId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(responseDto, "On-site course created successfully"));
    }


    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<OnSiteCourseResponseDto>>> getAllCourses() {
        log.info("📚 [GET /api/v1/onsite-courses/all] Received request to retrieve all on-site courses");
        
        List<OnSiteCourse> courses = onSiteCourseService.getAllCourses();
        List<OnSiteCourseResponseDto> responseDtos = onSiteCourseMapper.toResponseDtoList(courses);

        log.info("✅ [GET /api/v1/onsite-courses/all] Returning {} on-site course(s)", responseDtos.size());

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "On-site courses retrieved successfully"));
    }


    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OnSiteCourseResponseDto>> getCourseById(
            @PathVariable Long id) {
        
        log.info("🔍 [GET /api/v1/onsite-courses/{}] Received request to retrieve on-site course", id);

        OnSiteCourse course = onSiteCourseService.getCourseById(id);
        OnSiteCourseResponseDto responseDto = onSiteCourseMapper.toResponseDto(course);

        log.info("✅ [GET /api/v1/onsite-courses/{}] Returning on-site course: '{}'", id, course.getTitle());

        return ResponseEntity.ok(ApiResponse.success(responseDto, "On-site course retrieved successfully"));
    }


    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<OnSiteCourseResponseDto>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody OnSiteCourseRequestDto requestDto) {
        
        log.info("✏️ [PUT /api/v1/onsite-courses/update/{}] Received request to update on-site course", id);

        OnSiteCourse existingCourse = onSiteCourseService.getCourseById(id);
        OnSiteCourse courseToUpdate = onSiteCourseMapper.updateEntityFromDto(requestDto, existingCourse);
        OnSiteCourse updatedCourse = onSiteCourseService.updateCourse(id, courseToUpdate);
        OnSiteCourseResponseDto responseDto = onSiteCourseMapper.toResponseDto(updatedCourse);

        log.info("✅ [PUT /api/v1/onsite-courses/update/{}] On-site course updated successfully", id);

        return ResponseEntity.ok(ApiResponse.success(responseDto, "On-site course updated successfully"));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        log.info("🗑️ [DELETE /api/v1/onsite-courses/delete/{}] Received request to delete on-site course", id);
        
        onSiteCourseService.deleteCourse(id);
        
        log.info("✅ [DELETE /api/v1/onsite-courses/delete/{}] On-site course deleted successfully", id);
        
        return ResponseEntity.ok(ApiResponse.success(null, "On-site course deleted successfully"));
    }
}
