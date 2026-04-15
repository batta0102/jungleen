package tn.esprit.event.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class OnlineEvent extends Event {

    @Column(length = 2048)
    private String meetingUrl;
}
