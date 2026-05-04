package tn.esprit.jungle.gestioncours.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.OnlineCourseRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnlineCourseResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnlineCourse;
import tn.esprit.jungle.gestioncours.mapper.OnlineCourseMapper;
import tn.esprit.jungle.gestioncours.response.ApiResponse;
import tn.esprit.jungle.gestioncours.service.interfaces.OnlineCourseService;

import java.util.List;

/**
 * OnlineCourseController
 * REST API controller for online course operations
 * Handles HTTP requests and delegates to service layer
 * 
 * Base URL: /api/v1/online-courses
 * All endpoints return ResponseEntity&lt;ApiResponse&lt;T&gt;&gt; for consistent response structure
 */
@Slf4j
@RestController
@RequestMapping({
        "/onlinecourses",
        "/online-courses",
        "/api/v1/onlinecourses",
        "/api/v1/online-courses"
})
@CrossOrigin(origins = "*", maxAge = 3600)
public class OnlineCourseController {

    @Autowired
    private OnlineCourseService onlineCourseService;

    @Autowired
    private OnlineCourseMapper onlineCourseMapper;


    @PostMapping("/add")
    public ResponseEntity<ApiResponse<OnlineCourseResponseDto>> addCourse(
            @Valid @RequestBody OnlineCourseRequestDto requestDto) {
        
        log.info("📝 [POST /onlinecourses/add] Received request to create course: title='{}', level={}, tutorId={}",
                 requestDto.getTitle(), requestDto.getLevel(), requestDto.getTutorId());

        OnlineCourse course = onlineCourseMapper.toEntity(requestDto);
        OnlineCourse createdCourse = onlineCourseService.addCourse(course);
        OnlineCourseResponseDto responseDto = onlineCourseMapper.toResponseDto(createdCourse);

        log.info("🎉 [POST /onlinecourses/add] Course created successfully with ID: {}", createdCourse.getId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(responseDto, "Course created successfully"));
    }


    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<OnlineCourseResponseDto>>> getAllCourses() {
        log.info("📚 [GET /onlinecourses/all] Received request to retrieve all courses");
        
        List<OnlineCourse> courses = onlineCourseService.getAllCourses();
        List<OnlineCourseResponseDto> responseDtos = onlineCourseMapper.toResponseDtoList(courses);

        log.info("✅ [GET /onlinecourses/all] Returning {} course(s)", responseDtos.size());

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "Courses retrieved successfully"));
    }


    @GetMapping("/getCour/{id}")
    public ResponseEntity<ApiResponse<OnlineCourseResponseDto>> getCourseById(
            @PathVariable Long id) {
        
        log.info("🔍 [GET /onlinecourses/getCour/{}] Received request to retrieve course", id);

        OnlineCourse course = onlineCourseService.getCourseById(id);
        OnlineCourseResponseDto responseDto = onlineCourseMapper.toResponseDto(course);

        log.info("✅ [GET /onlinecourses/getCour/{}] Returning course: '{}'", id, course.getTitle());

        return ResponseEntity.ok(ApiResponse.success(responseDto, "Course retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OnlineCourseResponseDto>> getCourseByIdStandard(
            @PathVariable Long id) {

        log.info("🔍 [GET /onlinecourses/{}] Received request to retrieve course", id);

        OnlineCourse course = onlineCourseService.getCourseById(id);
        OnlineCourseResponseDto responseDto = onlineCourseMapper.toResponseDto(course);

        log.info("✅ [GET /onlinecourses/{}] Returning course: '{}'", id, course.getTitle());

        return ResponseEntity.ok(ApiResponse.success(responseDto, "Course retrieved successfully"));
    }


    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<OnlineCourseResponseDto>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody OnlineCourseRequestDto requestDto) {
        
        log.info("✏️ [PUT /onlinecourses/update/{}] Received request to update course", id);

        OnlineCourse existingCourse = onlineCourseService.getCourseById(id);
        OnlineCourse courseToUpdate = onlineCourseMapper.updateEntityFromDto(requestDto, existingCourse);
        OnlineCourse updatedCourse = onlineCourseService.updateCourse(id, courseToUpdate);
        OnlineCourseResponseDto responseDto = onlineCourseMapper.toResponseDto(updatedCourse);

        log.info("✅ [PUT /onlinecourses/update/{}] Course updated successfully", id);

        return ResponseEntity.ok(ApiResponse.success(responseDto, "Course updated successfully"));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        log.info("🗑️ [DELETE /onlinecourses/delete/{}] Received request to delete course", id);
        
        onlineCourseService.deleteCourse(id);
        
        log.info("✅ [DELETE /onlinecourses/delete/{}] Course deleted successfully", id);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Course deleted successfully"));
    }
}

