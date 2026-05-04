package tn.esprit.jungle.gestioncours.event;

import tn.esprit.jungle.gestioncours.dto.AttendanceResponseDto;

public record AttendanceMarkedEvent(AttendanceResponseDto attendance) {
}
