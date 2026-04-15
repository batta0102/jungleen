package com.example.pi4eme02.Service.interfaces;

import com.example.pi4eme02.Entity.Game;
import java.util.List;
import java.util.Optional;

public interface GameService {
    Game createGame(Game game);
    List<Game> getAllGames();
    Optional<Game> getGame(Long id);
    Game updateGame(Long id, Game updated);
    void deleteGame(Long id);
}