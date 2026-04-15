package com.example.pi4eme02.Repository;

import com.example.pi4eme02.Entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByCategory(String category);
}