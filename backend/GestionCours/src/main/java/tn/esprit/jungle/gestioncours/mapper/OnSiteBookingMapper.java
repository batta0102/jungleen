package tn.esprit.jungle.gestioncours.mapper;

import org.springframework.stereotype.Component;
import tn.esprit.jungle.gestioncours.dto.OnSiteBookingRequestDto;
import tn.esprit.jungle.gestioncours.dto.OnSiteBookingResponseDto;
import tn.esprit.jungle.gestioncours.entites.OnSiteBooking;

import java.util.List;
import java.util.stream.Collectors;

/**
 * OnSiteBookingMapper
 * Maps between OnSiteBooking entity and DTOs
 * Provides conversion methods for request and response objects
 */
@Component
public class OnSiteBookingMapper {

    /**
     * Convert OnSiteBookingRequestDto to OnSiteBooking entity
     * Note: Entity relationship (session) is set by the service
     * 
     * @param requestDto the request DTO
     * @return the mapped OnSiteBooking entity
     */
    public OnSiteBooking toEntity(OnSiteBookingRequestDto requestDto) {
        if (requestDto == null) {
            return null;
        }

        OnSiteBooking booking = new OnSiteBooking();
        booking.setBookingDate(requestDto.getBookingDate());
        booking.setStatus(requestDto.getStatus());
        booking.setStudentId(requestDto.getStudentId());

        return booking;
    }

    /**
     * Convert OnSiteBooking entity to OnSiteBookingResponseDto
     * 
     * @param booking the OnSiteBooking entity
     * @return the mapped response DTO
     */
    public OnSiteBookingResponseDto toResponseDto(OnSiteBooking booking) {
        if (booking == null) {
            return null;
        }

        OnSiteBookingResponseDto responseDto = new OnSiteBookingResponseDto();
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
     * Convert list of OnSiteBooking entities to list of OnSiteBookingResponseDto
     * 
     * @param bookings list of OnSiteBooking entities
     * @return list of response DTOs
     */
    public List<OnSiteBookingResponseDto> toResponseDtoList(List<OnSiteBooking> bookings) {
        if (bookings == null) {
            return null;
        }

        return bookings.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Update OnSiteBooking entity with values from OnSiteBookingRequestDto
     * Note: Session relationship should be updated by the service
     * 
     * @param requestDto the request DTO
     * @param booking the OnSiteBooking entity to update
     * @return the updated OnSiteBooking entity
     */
    public OnSiteBooking updateEntityFromDto(OnSiteBookingRequestDto requestDto, OnSiteBooking booking) {
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

        return booking;
    }
}
