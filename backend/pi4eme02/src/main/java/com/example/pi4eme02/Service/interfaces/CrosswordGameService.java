package com.example.pi4eme02.Service.interfaces;

import com.example.pi4eme02.Entity.CrosswordGame;

import java.util.List;
import java.util.Optional;

public interface CrosswordGameService {
    CrosswordGame create(CrosswordGame game);
    List<CrosswordGame> getAll();
    Optional<CrosswordGame> getById(Long id);
    CrosswordGame update(Long id, CrosswordGame updated);
    void delete(Long id);
    Optional<CrosswordGame> getRandomByDifficulty(String difficulty);
}
