package tn.esprit.jungle.gestioncours.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.jungle.gestioncours.dto.AttendanceRequestDto;
import tn.esprit.jungle.gestioncours.dto.AttendanceResponseDto;
import tn.esprit.jungle.gestioncours.entites.Attendance;

import java.time.LocalDateTime;

@Component
public class AttendanceMapper {

    public Attendance toEntity(AttendanceRequestDto dto, LocalDateTime markedAt) {
        if (dto == null) {
            return null;
        }
        Attendance entity = new Attendance();
        entity.setSessionType(dto.getSessionType());
        entity.setSessionId(dto.getSessionId());
        entity.setStudentId(dto.getStudentId());
        entity.setStatus(dto.getStatus());
        entity.setNote(dto.getNote());
        entity.setMarkedAt(markedAt != null ? markedAt : LocalDateTime.now());
        return entity;
    }

    public AttendanceResponseDto toResponseDto(Attendance entity) {
        if (entity == null) {
            return null;
        }
        AttendanceResponseDto dto = new AttendanceResponseDto();
        dto.setId(entity.getId());
        dto.setSessionType(entity.getSessionType());
        dto.setSessionId(entity.getSessionId());
        dto.setStudentId(entity.getStudentId());
        dto.setStatus(entity.getStatus());
        dto.setMarkedAt(entity.getMarkedAt());
        dto.setNote(entity.getNote());
        return dto;
    }
}
