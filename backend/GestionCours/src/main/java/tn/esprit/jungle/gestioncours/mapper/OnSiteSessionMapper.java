package tn.esprit.jungle.gestioncours.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.jungle.gestioncours.dto.OnSiteSessionRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnSiteSessionResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnSiteSession;

import java.util.List;
import java.util.stream.Collectors;

/**
 * OnSiteSessionMapper
 * Maps between OnSiteSession entity and DTOs
 * Provides conversion methods for request and response objects
 */
@Component
public class OnSiteSessionMapper {

    /**
     * Convert OnSiteSessionRequestDto to OnSiteSession entity
     * Note: Entity relationships (course, classroom) are set by the service
     * 
     * @param requestDto the request DTO
     * @return the mapped OnSiteSession entity
     */
    public OnSiteSession toEntity(OnSiteSessionRequestDto requestDto) {
        if (requestDto == null) {
            return null;
        }

        OnSiteSession session = new OnSiteSession();
        session.setDate(requestDto.getDate());
        session.setCapacity(requestDto.getCapacity());

        return session;
    }

    /**
     * Convert OnSiteSession entity to OnSiteSessionResponseDto
     * 
     * @param session the OnSiteSession entity
     * @return the mapped response DTO
     */
    public OnSiteSessionResponseDto toResponseDto(OnSiteSession session) {
        if (session == null) {
            return null;
        }

        OnSiteSessionResponseDto responseDto = new OnSiteSessionResponseDto();
        responseDto.setId(session.getId());
        responseDto.setDate(session.getDate());
        responseDto.setCapacity(session.getCapacity());
        
        if (session.getCourse() != null) {
            responseDto.setCourseId(session.getCourse().getId());
        }
        if (session.getClassroom() != null) {
            responseDto.setClassroomId(session.getClassroom().getId());
        }

        return responseDto;
    }

    /**
     * Convert list of OnSiteSession entities to list of OnSiteSessionResponseDto
     * 
     * @param sessions list of OnSiteSession entities
     * @return list of response DTOs
     */
    public List<OnSiteSessionResponseDto> toResponseDtoList(List<OnSiteSession> sessions) {
        if (sessions == null) {
            return null;
        }

        return sessions.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Update OnSiteSession entity with values from OnSiteSessionRequestDto
     * Note: Relationships (course, classroom) should be updated by the service
     * 
     * @param requestDto the request DTO
     * @param session the OnSiteSession entity to update
     * @return the updated OnSiteSession entity
     */
    public OnSiteSession updateEntityFromDto(OnSiteSessionRequestDto requestDto, OnSiteSession session) {
        if (requestDto == null || session == null) {
            return session;
        }

        if (requestDto.getDate() != null) {
            session.setDate(requestDto.getDate());
        }
        if (requestDto.getCapacity() != null) {
            session.setCapacity(requestDto.getCapacity());
        }

        return session;
    }
}
