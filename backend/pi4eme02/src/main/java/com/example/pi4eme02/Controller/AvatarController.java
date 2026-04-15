package com.example.pi4eme02.Controller;

import com.example.pi4eme02.Entity.Avatar;
import com.example.pi4eme02.Repository.AvatarRepository;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/avatars")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
public class AvatarController {

    private final AvatarRepository avatarRepo;

    public AvatarController(AvatarRepository avatarRepo) {
        this.avatarRepo = avatarRepo;
    }

    // ✅ CRUD
    @GetMapping
    public List<Avatar> getAll() {
        return avatarRepo.findAll();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Avatar create(@RequestParam("type") String type,
                         @RequestParam("file") MultipartFile file) throws IOException {
        Avatar avatar = new Avatar();
        avatar.setType(type);
        avatar.setImageData(file.getBytes());
        avatar.setImageType(file.getContentType());
        return avatarRepo.save(avatar);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Avatar update(@PathVariable Long id,
                         @RequestParam("type") String type,
                         @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        Avatar existing = avatarRepo.findById(id).orElseThrow();
        existing.setType(type);
        if (file != null && !file.isEmpty()) {
            existing.setImageData(file.getBytes());
            existing.setImageType(file.getContentType());
        }
        return avatarRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        avatarRepo.deleteById(id);
    }
}