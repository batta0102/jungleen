package tn.esprit.jungle.gestioncours.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.util.Date;

/**
 * DTO pour la création et mise à jour des sessions
 */
public class OnlineSessionRequestDto {

    @NotNull(message = "Session date is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private Date date;

    @Positive(message = "Capacity must be a positive integer")
    private int capacity;

    @NotBlank(message = "Meeting link is required")
    @Pattern(regexp = "^(https?://)([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=]*)?$", 
             message = "Meeting link must be a valid URL")
    private String meetingLink;

    @NotNull(message = "Course ID is required")
    @Positive(message = "Course ID must be a positive integer")
    private Long courseId;

    // Getters & Setters
    public Date getDate() { return date; }
    public void setDate(Date date) { this.date = date; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
}
