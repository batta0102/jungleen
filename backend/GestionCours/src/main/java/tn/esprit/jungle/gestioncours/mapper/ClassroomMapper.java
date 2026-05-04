package tn.esprit.jungle.gestioncours.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.jungle.gestioncours.dto.ClassroomRequestDto;
import tn.esprit.jungle.gestioncours.dto.ClassroomResponseDto;
import tn.esprit.jungle.gestioncours.entites.Classroom;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ClassroomMapper
 * Maps between Classroom entity and DTOs
 * Provides conversion methods for request and response objects
 */
@Component
public class ClassroomMapper {

    /**
     * Convert ClassroomRequestDto to Classroom entity
     * 
     * @param requestDto the request DTO
     * @return the mapped Classroom entity
    */
    public Classroom toEntity(ClassroomRequestDto requestDto) {
        if (requestDto == null) {
            return null;
        }

        Classroom classroom = new Classroom();
        classroom.setName(requestDto.getName());
        classroom.setCapacity(requestDto.getCapacity());
        classroom.setType(requestDto.getType());
        classroom.setFeaturesDescription(requestDto.getFeaturesDescription());
        classroom.setSketchfabModelUid(requestDto.getSketchfabModelUid());

        return classroom;
    }

    /**
     * Convert Classroom entity to ClassroomResponseDto
     * 
     * @param classroom the Classroom entity
     * @return the mapped response DTO
     */
    public ClassroomResponseDto toResponseDto(Classroom classroom) {
        if (classroom == null) {
            return null;
        }

        ClassroomResponseDto responseDto = new ClassroomResponseDto();
        responseDto.setId(classroom.getId());
        responseDto.setName(classroom.getName());
        responseDto.setCapacity(classroom.getCapacity());
        responseDto.setType(classroom.getType());
        responseDto.setFeaturesDescription(classroom.getFeaturesDescription());
        responseDto.setSketchfabModelUid(classroom.getSketchfabModelUid());

        return responseDto;
    }

    /**
     * Convert list of Classroom entities to list of ClassroomResponseDto
     * 
     * @param classrooms list of Classroom entities
     * @return list of response DTOs
     */
    public List<ClassroomResponseDto> toResponseDtoList(List<Classroom> classrooms) {
        if (classrooms == null) {
            return null;
        }

        return classrooms.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Update Classroom entity with values from ClassroomRequestDto
     * 
     * @param requestDto the request DTO
     * @param classroom the Classroom entity to update
     * @return the updated Classroom entity
     */
    public Classroom updateEntityFromDto(ClassroomRequestDto requestDto, Classroom classroom) {
        if (requestDto == null || classroom == null) {
            return classroom;
        }

        if (requestDto.getName() != null) {
            classroom.setName(requestDto.getName());
        }
        if (requestDto.getCapacity() != null) {
            classroom.setCapacity(requestDto.getCapacity());
        }
        if (requestDto.getType() != null) {
            classroom.setType(requestDto.getType());
        }
        classroom.setFeaturesDescription(requestDto.getFeaturesDescription());
        classroom.setSketchfabModelUid(requestDto.getSketchfabModelUid());

        return classroom;
    }
}
