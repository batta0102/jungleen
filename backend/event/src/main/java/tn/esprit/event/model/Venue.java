package tn.esprit.event.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.LinkedHashSet;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "venues")
@Getter
@Setter
@NoArgsConstructor
public class Venue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    private String city;
    private String country;
    private String postalCode;

    private Integer capacity;

    // New fields for enhanced venue creation
    @Column(length = 50)
    private String venueType; // Classroom, Conference Room, Auditorium, Outdoor Space

    private Integer maxParticipants;

    // Location coordinates for map display
    private Double latitude;
    private Double longitude;

    @Lob
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "venue_equipment", joinColumns = @JoinColumn(name = "venue_id"))
    @Column(name = "equipment")
    private Set<String> equipment = new LinkedHashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "venue")
    private Set<OnsiteEvent> onsiteEvents = new HashSet<>();
}
