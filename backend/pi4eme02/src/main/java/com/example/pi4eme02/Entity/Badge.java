package com.example.pi4eme02.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.Base64;

@Entity
@Getter
@Setter
@ToString

@AllArgsConstructor
@NoArgsConstructor
public class Badge implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String name;
    private String description;
    private int unlockLevel;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    @JsonIgnore
    private byte[] imageData;

    private String imageType;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getUnlockLevel() { return unlockLevel; }
    public void setUnlockLevel(int unlockLevel) { this.unlockLevel = unlockLevel; }

    public byte[] getImageData() { return imageData; }
    public void setImageData(byte[] imageData) { this.imageData = imageData; }

    public String getImageType() { return imageType; }
    public void setImageType(String imageType) { this.imageType = imageType; }

    @Transient
    @JsonProperty("imageUrl")
    public String getImageUrl() {
        if (imageData == null || imageData.length == 0) return null;
        String type = (imageType == null || imageType.isBlank()) ? "image/png" : imageType;
        String base64 = Base64.getEncoder().encodeToString(imageData);
        return "data:" + type + ";base64," + base64;
    }
}
