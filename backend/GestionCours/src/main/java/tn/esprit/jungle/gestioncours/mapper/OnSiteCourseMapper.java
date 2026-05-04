package tn.esprit.jungle.gestioncours.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.jungle.gestioncours.dto.OnSiteCourseRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnSiteCourseResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnSiteCourse;

import java.util.List;
import java.util.stream.Collectors;

/**
 * OnSiteCourseMapper
 * Maps between OnSiteCourse entity and DTOs
 * Provides conversion methods for request and response objects
 */
@Component
public class OnSiteCourseMapper {

    /**
     * Convert OnSiteCourseRequestDto to OnSiteCourse entity
     * 
     * @param requestDto the request DTO
     * @return the mapped OnSiteCourse entity
     */
    public OnSiteCourse toEntity(OnSiteCourseRequestDto requestDto) {
        if (requestDto == null) {
            return null;
        }

        OnSiteCourse course = new OnSiteCourse();
        course.setTitle(requestDto.getTitle());
        course.setLevel(requestDto.getLevel());
        course.setTutorId(requestDto.getTutorId());
        course.setDescription(requestDto.getDescription());
        course.setClassroomName(requestDto.getClassroomName());

        return course;
    }

    /**
     * Convert OnSiteCourse entity to OnSiteCourseResponseDto
     * 
     * @param course the OnSiteCourse entity
     * @return the mapped response DTO
     */
    public OnSiteCourseResponseDto toResponseDto(OnSiteCourse course) {
        if (course == null) {
            return null;
        }

        OnSiteCourseResponseDto responseDto = new OnSiteCourseResponseDto();
        responseDto.setId(course.getId());
        responseDto.setTitle(course.getTitle());
        responseDto.setDescription(course.getDescription());
        responseDto.setLevel(course.getLevel());
        responseDto.setTutorId(course.getTutorId());
        responseDto.setClassroomName(course.getClassroomName());

        return responseDto;
    }

    /**
     * Convert list of OnSiteCourse entities to list of OnSiteCourseResponseDto
     * 
     * @param courses list of OnSiteCourse entities
     * @return list of response DTOs
     */
    public List<OnSiteCourseResponseDto> toResponseDtoList(List<OnSiteCourse> courses) {
        if (courses == null) {
            return null;
        }

        return courses.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Update OnSiteCourse entity with values from OnSiteCourseRequestDto
     * 
     * @param requestDto the request DTO
     * @param course the OnSiteCourse entity to update
     * @return the updated OnSiteCourse entity
     */
    public OnSiteCourse updateEntityFromDto(OnSiteCourseRequestDto requestDto, OnSiteCourse course) {
        if (requestDto == null || course == null) {
            return course;
        }

        if (requestDto.getTitle() != null) {
            course.setTitle(requestDto.getTitle());
        }
        if (requestDto.getLevel() != null) {
            course.setLevel(requestDto.getLevel());
        }
        if (requestDto.getTutorId() != null) {
            course.setTutorId(requestDto.getTutorId());
        }
        if (requestDto.getDescription() != null) {
            course.setDescription(requestDto.getDescription());
        }
        if (requestDto.getClassroomName() != null) {
            course.setClassroomName(requestDto.getClassroomName());
        }

        return course;
    }
}
