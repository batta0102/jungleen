package tn.esprit.jungle.gestioncours.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.ClassroomRequestDto;
import tn.esprit.jungle.gestioncours.dto.ClassroomResponseDto;
import tn.esprit.jungle.gestioncours.entites.Classroom;
import tn.esprit.jungle.gestioncours.mapper.ClassroomMapper;
import tn.esprit.jungle.gestioncours.response.ApiResponse;
import tn.esprit.jungle.gestioncours.service.interfaces.ClassroomService;

import java.util.List;

/**
 * ClassroomController
 * REST API controller for classroom operations
 * Handles HTTP requests and delegates to service layer
 * 
 * Base URL: /api/v1/classrooms
 * All endpoints return ResponseEntity&lt;ApiResponse&lt;T&gt;&gt; for consistent response structure
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/classrooms", "/v1/classrooms"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class ClassroomController {

    @Autowired
    private ClassroomService classroomService;

    @Autowired
    private ClassroomMapper classroomMapper;


    @PostMapping("/add")
    public ResponseEntity<ApiResponse<ClassroomResponseDto>> addClassroom(
            @Valid @RequestBody ClassroomRequestDto requestDto) {
        
        log.info("📝 [POST /api/v1/classrooms/add] Received request to create classroom: name='{}', capacity={}",
                 requestDto.getName(), requestDto.getCapacity());

        Classroom classroom = classroomMapper.toEntity(requestDto);
        Classroom createdClassroom = classroomService.addClassroom(classroom);
        ClassroomResponseDto responseDto = classroomMapper.toResponseDto(createdClassroom);

        log.info("🎉 [POST /api/v1/classrooms/add] Classroom created successfully with ID: {}", createdClassroom.getId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(responseDto, "Classroom created successfully"));
    }


    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ClassroomResponseDto>>> getAllClassrooms() {
        log.info("📚 [GET /api/v1/classrooms/all] Received request to retrieve all classrooms");
        
        List<Classroom> classrooms = classroomService.getAllClassrooms();
        List<ClassroomResponseDto> responseDtos = classroomMapper.toResponseDtoList(classrooms);

        log.info("✅ [GET /api/v1/classrooms/all] Returning {} classroom(s)", responseDtos.size());

        return ResponseEntity.ok(ApiResponse.success(responseDtos, "Classrooms retrieved successfully"));
    }


    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassroomResponseDto>> getClassroomById(
            @PathVariable Long id) {
        
        log.info("🔍 [GET /api/v1/classrooms/{}] Received request to retrieve classroom", id);

        Classroom classroom = classroomService.getClassroomById(id);
        ClassroomResponseDto responseDto = classroomMapper.toResponseDto(classroom);

        log.info("✅ [GET /api/v1/classrooms/{}] Returning classroom: '{}'", id, classroom.getName());

        return ResponseEntity.ok(ApiResponse.success(responseDto, "Classroom retrieved successfully"));
    }


    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<ClassroomResponseDto>> updateClassroom(
            @PathVariable Long id,
            @Valid @RequestBody ClassroomRequestDto requestDto) {
        
        log.info("✏️ [PUT /api/v1/classrooms/update/{}] Received request to update classroom", id);

        Classroom existingClassroom = classroomService.getClassroomById(id);
        Classroom classroomToUpdate = classroomMapper.updateEntityFromDto(requestDto, existingClassroom);
        Classroom updatedClassroom = classroomService.updateClassroom(id, classroomToUpdate);
        ClassroomResponseDto responseDto = classroomMapper.toResponseDto(updatedClassroom);

        log.info("✅ [PUT /api/v1/classrooms/update/{}] Classroom updated successfully", id);

        return ResponseEntity.ok(ApiResponse.success(responseDto, "Classroom updated successfully"));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteClassroom(@PathVariable Long id) {
        log.info("🗑️ [DELETE /api/v1/classrooms/delete/{}] Received request to delete classroom", id);
        
        classroomService.deleteClassroom(id);
        
        log.info("✅ [DELETE /api/v1/classrooms/delete/{}] Classroom deleted successfully", id);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Classroom deleted successfully"));
    }
}
