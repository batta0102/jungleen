package tn.esprit.jungle.gestioncours.dto;

import java.util.Date;

/**
 * DTO pour les réponses d'une session
 */
public class OnlineSessionResponseDto {

    private Long id;
    private Date date;
    private int capacity;
    private String meetingLink;
    private Long courseId;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Date getDate() { return date; }
    public void setDate(Date date) { this.date = date; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
}
