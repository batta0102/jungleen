package com.example.pi4eme02.Service.Implementing;

import com.example.pi4eme02.Entity.Badge;
import com.example.pi4eme02.Repository.BadgeRepository;
import com.example.pi4eme02.Service.interfaces.BadgeService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BadgeServiceImpl implements BadgeService {
    private final BadgeRepository repo;

    public BadgeServiceImpl(BadgeRepository repo) {
        this.repo = repo;
    }

    @Override
    public Badge createBadge(Badge badge) {
        return repo.save(badge);
    }

    @Override
    public List<Badge> getAllBadges() {
        return repo.findAll();
    }

    @Override
    public Optional<Badge> getBadge(Long id) {
        return repo.findById(id);
    }

    @Override
    public List<Badge> getBadgesByUnlockLevel(int level) {
        return repo.findByUnlockLevelLessThanEqual(level);
    }

    @Override
    public Badge updateBadge(Long id, Badge updated) {
        Badge badge = repo.findById(id).orElseThrow();
        badge.setName(updated.getName());
        badge.setDescription(updated.getDescription());
        badge.setUnlockLevel(updated.getUnlockLevel());
        if (updated.getImageData() != null) {
            badge.setImageData(updated.getImageData());
            badge.setImageType(updated.getImageType());
        }
        return repo.save(badge);
    }

    @Override
    public void deleteBadge(Long id) {
        repo.deleteById(id);
    }
}
