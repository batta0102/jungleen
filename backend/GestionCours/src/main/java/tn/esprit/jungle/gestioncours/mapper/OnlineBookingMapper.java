package tn.esprit.jungle.gestioncours.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.jungle.gestioncours.dto.OnlineBookingRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnlineBookingResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnlineBooking;
import tn.esprit.jungle.gestioncours.entites.OnlineSession;

import java.util.List;
import java.util.stream.Collectors;

/**
 * OnlineBookingMapper
 * Maps between OnlineBooking entity and DTOs
 * Provides conversion methods for request and response objects
 */
@Component
public class OnlineBookingMapper {

    /**
     * Convert OnlineBookingRequestDto to OnlineBooking entity
     * 
     * @param requestDto the request DTO
     * @return the mapped OnlineBooking entity
     */
    public OnlineBooking toEntity(OnlineBookingRequestDto requestDto) {
        if (requestDto == null) {
            return null;
        }

        OnlineBooking booking = new OnlineBooking();
        booking.setBookingDate(requestDto.getBookingDate());
        booking.setStatus(requestDto.getStatus());
        booking.setStudentId(requestDto.getStudentId());
        
        // Create session reference with ID only
        if (requestDto.getSessionId() != null) {
            OnlineSession session = new OnlineSession();
            session.setId(requestDto.getSessionId());
            booking.setSession(session);
        }

        return booking;
    }

    /**
     * Convert OnlineBooking entity to OnlineBookingResponseDto
     * 
     * @param booking the OnlineBooking entity
     * @return the mapped response DTO
     */
    public OnlineBookingResponseDto toResponseDto(OnlineBooking booking) {
        if (booking == null) {
            return null;
        }

        OnlineBookingResponseDto responseDto = new OnlineBookingResponseDto();
        responseDto.setId(booking.getId());
        responseDto.setBookingDate(booking.getBookingDate());
        responseDto.setStatus(booking.getStatus());
        responseDto.setStudentId(booking.getStudentId());
        
        if (booking.getSession() != null) {
            responseDto.setSessionId(booking.getSession().getId());
        }

        return responseDto;
    }

    /**
     * Convert list of OnlineBooking entities to list of OnlineBookingResponseDto
     * 
     * @param bookings list of OnlineBooking entities
     * @return list of response DTOs
     */
    public List<OnlineBookingResponseDto> toResponseDtoList(List<OnlineBooking> bookings) {
        if (bookings == null) {
            return null;
        }

        return bookings.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Update OnlineBooking entity with values from OnlineBookingRequestDto
     * 
     * @param requestDto the request DTO
     * @param booking the OnlineBooking entity to update
     * @return the updated OnlineBooking entity
     */
    public OnlineBooking updateEntityFromDto(OnlineBookingRequestDto requestDto, OnlineBooking booking) {
        if (requestDto == null || booking == null) {
            return booking;
        }

        if (requestDto.getBookingDate() != null) {
            booking.setBookingDate(requestDto.getBookingDate());
        }
        if (requestDto.getStatus() != null) {
            booking.setStatus(requestDto.getStatus());
        }
        if (requestDto.getStudentId() != null) {
            booking.setStudentId(requestDto.getStudentId());
        }
        if (requestDto.getSessionId() != null) {
            OnlineSession session = new OnlineSession();
            session.setId(requestDto.getSessionId());
            booking.setSession(session);
        }

        return booking;
    }
}
