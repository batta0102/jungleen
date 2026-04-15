package com.example.pi4eme02.Controller;

import com.example.pi4eme02.Entity.Avatar;
import com.example.pi4eme02.Entity.Skin;
import com.example.pi4eme02.Repository.AvatarRepository;
import com.example.pi4eme02.Repository.SkinRepository;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/skins")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
public class SkinController {

    private final SkinRepository skinRepo;
    private final AvatarRepository avatarRepo;

    public SkinController(SkinRepository skinRepo, AvatarRepository avatarRepo) {
        this.skinRepo = skinRepo;
        this.avatarRepo = avatarRepo;
    }

    @GetMapping
    public List<Skin> getAll() {
        return skinRepo.findAll();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Skin create(@RequestParam("category") String category,
                       @RequestParam("name") String name,
                       @RequestParam(value = "unlockLevel", required = false) Integer unlockLevel,
                       @RequestParam(value = "avatarId", required = false) Long avatarId,
                       @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        Skin skin = new Skin();
        skin.setCategory(category);
        skin.setName(name);
        skin.setUnlockLevel(unlockLevel == null ? 0 : unlockLevel);

        if (avatarId != null) {
            Avatar avatar = avatarRepo.findById(avatarId).orElseThrow();
            skin.setAvatar(avatar);
        }

        if (file != null && !file.isEmpty()) {
            skin.setImageData(file.getBytes());
            skin.setImageType(file.getContentType());
        }

        return skinRepo.save(skin);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Skin update(@PathVariable Long id,
                       @RequestParam("category") String category,
                       @RequestParam("name") String name,
                       @RequestParam(value = "unlockLevel", required = false) Integer unlockLevel,
                       @RequestParam(value = "avatarId", required = false) Long avatarId,
                       @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        Skin existing = skinRepo.findById(id).orElseThrow();
        existing.setCategory(category);
        existing.setName(name);
        existing.setUnlockLevel(unlockLevel == null ? 0 : unlockLevel);

        if (avatarId != null) {
            Avatar avatar = avatarRepo.findById(avatarId).orElseThrow();
            existing.setAvatar(avatar);
        } else {
            existing.setAvatar(null);
        }

        if (file != null && !file.isEmpty()) {
            existing.setImageData(file.getBytes());
            existing.setImageType(file.getContentType());
        }

        return skinRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        skinRepo.deleteById(id);
    }
}