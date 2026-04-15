package com.example.pi4eme02.Repository;

import com.example.pi4eme02.Entity.CrosswordGame;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CrosswordGameRepository extends JpaRepository<CrosswordGame, Long> {
    List<CrosswordGame> findByDifficultyIgnoreCase(String difficulty);
}
