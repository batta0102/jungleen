package com.example.pi4eme02.Repository;

import com.example.pi4eme02.Entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByUnlockLevelLessThanEqual(int level);
}
