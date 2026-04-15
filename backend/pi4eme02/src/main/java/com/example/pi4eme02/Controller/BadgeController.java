package com.example.pi4eme02.Controller;

import com.example.pi4eme02.Entity.Badge;
import com.example.pi4eme02.Repository.BadgeRepository;
import com.example.pi4eme02.Service.interfaces.BadgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    @Autowired
    private BadgeRepository repo;

    @Autowired
    private BadgeService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Badge create(@RequestParam("name") String name,
                        @RequestParam("description") String description,
                        @RequestParam("unlockLevel") int unlockLevel,
                        @RequestParam("file") MultipartFile file) throws IOException {
        Badge badge = new Badge();
        badge.setName(name);
        badge.setDescription(description);
        badge.setUnlockLevel(unlockLevel);
        badge.setImageData(file.getBytes());
        badge.setImageType(file.getContentType());
        return repo.save(badge);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Badge update(@PathVariable Long id,
                        @RequestParam("name") String name,
                        @RequestParam("description") String description,
                        @RequestParam("unlockLevel") int unlockLevel,
                        @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        Badge existing = repo.findById(id).orElseThrow();
        existing.setName(name);
        existing.setDescription(description);
        existing.setUnlockLevel(unlockLevel);
        if (file != null && !file.isEmpty()) {
            existing.setImageData(file.getBytes());
            existing.setImageType(file.getContentType());
        }
        return repo.save(existing);
    }

    @GetMapping
    public List<Badge> getAll() {
        return service.getAllBadges();
    }

    @GetMapping("/{id}")
    public Badge getById(@PathVariable Long id) {
        return repo.findById(id).orElseThrow();
    }

    @GetMapping("/unlock-level/{level}")
    public List<Badge> getByUnlockLevel(@PathVariable int level) {
        return service.getBadgesByUnlockLevel(level);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
