package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.dto.AttendanceRequestDto;
import tn.esprit.jungle.gestioncours.dto.AttendanceResponseDto;
import tn.esprit.jungle.gestioncours.entites.SessionType;

import java.util.List;

public interface AttendanceService {

    AttendanceResponseDto markAttendance(AttendanceRequestDto request);

    List<AttendanceResponseDto> getBySession(SessionType type, Long sessionId);
}
