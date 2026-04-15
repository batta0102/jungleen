package com.example.pi4eme02.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.util.Base64;

@Entity
public class Skin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category; // hoodie, glasses, hat
    private String name;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    @JsonIgnore
    private byte[] imageData;

    private String imageType; // e.g., image/png

    private int unlockLevel; // level required to unlock

    @ManyToOne
    @JoinColumn(name = "avatar_id")
    @JsonIgnoreProperties("skins")
    private Avatar avatar;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public byte[] getImageData() { return imageData; }
    public void setImageData(byte[] imageData) { this.imageData = imageData; }

    public String getImageType() { return imageType; }
    public void setImageType(String imageType) { this.imageType = imageType; }

    public int getUnlockLevel() { return unlockLevel; }
    public void setUnlockLevel(int unlockLevel) { this.unlockLevel = unlockLevel; }

    public Avatar getAvatar() { return avatar; }
    public void setAvatar(Avatar avatar) { this.avatar = avatar; }

    @Transient
    @JsonProperty("imageUrl")
    public String getImageUrl() {
        if (imageData == null || imageData.length == 0) return null;
        String type = (imageType == null || imageType.isBlank()) ? "image/png" : imageType;
        String base64 = Base64.getEncoder().encodeToString(imageData);
        return "data:" + type + ";base64," + base64;
    }
}