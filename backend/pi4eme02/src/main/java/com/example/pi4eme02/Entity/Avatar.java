package com.example.pi4eme02.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.util.Base64;
import java.util.List;

@Entity
public class Avatar {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // Warrior, Mage, Explorer

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    @JsonIgnore
    private byte[] imageData;

    private String imageType; // e.g., image/png

    @OneToMany(mappedBy = "avatar", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("avatar")
    private List<Skin> skins;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public byte[] getImageData() { return imageData; }
    public void setImageData(byte[] imageData) { this.imageData = imageData; }

    public String getImageType() { return imageType; }
    public void setImageType(String imageType) { this.imageType = imageType; }

    public List<Skin> getSkins() { return skins; }
    public void setSkins(List<Skin> skins) { this.skins = skins; }

    @Transient
    @JsonProperty("imageUrl")
    public String getImageUrl() {
        if (imageData == null || imageData.length == 0) return null;
        String type = (imageType == null || imageType.isBlank()) ? "image/png" : imageType;
        String base64 = Base64.getEncoder().encodeToString(imageData);
        return "data:" + type + ";base64," + base64;
    }
}