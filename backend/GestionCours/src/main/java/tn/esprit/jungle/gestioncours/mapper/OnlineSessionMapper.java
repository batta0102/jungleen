package tn.esprit.jungle.gestioncours.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.jungle.gestioncours.dto.OnlineSessionRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnlineSessionResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnlineCourse;
import tn.esprit.jungle.gestioncours.entites.OnlineSession;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class OnlineSessionMapper {

    public OnlineSession toEntity(OnlineSessionRequestDto requestDto) {
        if (requestDto == null) return null;

        OnlineSession session = new OnlineSession();
        session.setDate(requestDto.getDate());
        session.setCapacity(requestDto.getCapacity());
        session.setMeetingLink(requestDto.getMeetingLink());

        // Set course by ID only
        OnlineCourse course = new OnlineCourse();
        course.setId(requestDto.getCourseId());
        session.setCourse(course);

        return session;
    }

    public OnlineSessionResponseDto toResponseDto(OnlineSession session) {
        if (session == null) return null;

        OnlineSessionResponseDto dto = new OnlineSessionResponseDto();
        dto.setId(session.getId());
        dto.setDate(session.getDate());
        dto.setCapacity(session.getCapacity());
        dto.setMeetingLink(session.getMeetingLink());
        if (session.getCourse() != null) {
            dto.setCourseId(session.getCourse().getId());
        }
        return dto;
    }

    public List<OnlineSessionResponseDto> toResponseDtoList(List<OnlineSession> sessions) {
        if (sessions == null) return null;
        return sessions.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    public OnlineSession updateEntityFromDto(OnlineSessionRequestDto requestDto, OnlineSession session) {
        if (requestDto == null || session == null) return session;

        if (requestDto.getDate() != null) session.setDate(requestDto.getDate());
        if (requestDto.getCapacity() > 0) session.setCapacity(requestDto.getCapacity());
        if (requestDto.getMeetingLink() != null) session.setMeetingLink(requestDto.getMeetingLink());

        OnlineCourse course = new OnlineCourse();
        course.setId(requestDto.getCourseId());
        session.setCourse(course);

        return session;
    }
}
