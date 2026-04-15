package com.example.pi4eme02.Service.interfaces;

import com.example.pi4eme02.Entity.Badge;
import java.util.List;
import java.util.Optional;

public interface BadgeService {
    Badge createBadge(Badge badge);
    List<Badge> getAllBadges();
    Optional<Badge> getBadge(Long id);
    List<Badge> getBadgesByUnlockLevel(int level);
    Badge updateBadge(Long id, Badge updated);
    void deleteBadge(Long id);
}
