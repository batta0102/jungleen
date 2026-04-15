package com.example.pi4eme02.Service.Implementing;

import com.example.pi4eme02.Entity.Game;
import com.example.pi4eme02.Repository.GameRepository;
import com.example.pi4eme02.Service.interfaces.GameService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GameServiceImpl implements GameService {
    private final GameRepository repo;

    public GameServiceImpl(GameRepository repo) {
        this.repo = repo;
    }

    @Override
    public Game createGame(Game game) {
        return repo.save(game);
    }

    @Override
    public List<Game> getAllGames() {
        return repo.findAll();
    }

    @Override
    public Optional<Game> getGame(Long id) {
        return repo.findById(id);
    }

    @Override
    public Game updateGame(Long id, Game updated) {
        Game game = repo.findById(id).orElseThrow();
        game.setTitle(updated.getTitle());
        game.setDescription(updated.getDescription());
        game.setXpReward(updated.getXpReward());
        game.setCategory(updated.getCategory());
        game.setTimerDuration(updated.getTimerDuration());
        return repo.save(game);
    }

    @Override
    public void deleteGame(Long id) {
        repo.deleteById(id);
    }
}