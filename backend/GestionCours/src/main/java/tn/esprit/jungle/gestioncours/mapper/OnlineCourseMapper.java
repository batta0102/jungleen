package tn.esprit.jungle.gestioncours.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.jungle.gestioncours.dto.OnlineCourseRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnlineCourseResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnlineCourse;

import java.util.List;
import java.util.stream.Collectors;

/**
 * OnlineCourseMapper
 * Maps between OnlineCourse entity and DTOs
 * Provides conversion methods for request and response objects
 */
@Component
public class OnlineCourseMapper {

    /**
     * Convert OnlineCourseRequestDto to OnlineCourse entity
     * 
     * @param requestDto the request DTO
     * @return the mapped OnlineCourse entity
     */
    public OnlineCourse toEntity(OnlineCourseRequestDto requestDto) {
        if (requestDto == null) {
            return null;
        }

        OnlineCourse course = new OnlineCourse();
        course.setTitle(requestDto.getTitle());
        course.setDescription(requestDto.getDescription());
        course.setLevel(requestDto.getLevel());
        course.setTutorId(requestDto.getTutorId());

        return course;
    }

    /**
     * Convert OnlineCourse entity to OnlineCourseResponseDto
     * 
     * @param course the OnlineCourse entity
     * @return the mapped response DTO
     */
    public OnlineCourseResponseDto toResponseDto(OnlineCourse course) {
        if (course == null) {
            return null;
        }

        OnlineCourseResponseDto responseDto = new OnlineCourseResponseDto();
        responseDto.setId(course.getId());
        responseDto.setTitle(course.getTitle());
        responseDto.setDescription(course.getDescription());
        responseDto.setLevel(course.getLevel());
        responseDto.setTutorId(course.getTutorId());

        return responseDto;
    }

    /**
     * Convert list of OnlineCourse entities to list of OnlineCourseResponseDto
     * 
     * @param courses list of OnlineCourse entities
     * @return list of response DTOs
     */
    public List<OnlineCourseResponseDto> toResponseDtoList(List<OnlineCourse> courses) {
        if (courses == null) {
            return null;
        }

        return courses.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Update OnlineCourse entity with values from OnlineCourseRequestDto
     * 
     * @param requestDto the request DTO
     * @param course the OnlineCourse entity to update
     * @return the updated OnlineCourse entity
     */
    public OnlineCourse updateEntityFromDto(OnlineCourseRequestDto requestDto, OnlineCourse course) {
        if (requestDto == null || course == null) {
            return course;
        }

        if (requestDto.getTitle() != null) {
            course.setTitle(requestDto.getTitle());
        }
        if (requestDto.getDescription() != null) {
            course.setDescription(requestDto.getDescription());
        }
        if (requestDto.getLevel() != null) {
            course.setLevel(requestDto.getLevel());
        }
        if (requestDto.getTutorId() != null) {
            course.setTutorId(requestDto.getTutorId());
        }

        return course;
    }
}
