package com.example.pi4eme02.Controller;

import com.example.pi4eme02.Entity.Game;
import com.example.pi4eme02.Repository.GameRepository;
import com.example.pi4eme02.Service.interfaces.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


import java.util.List;
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})

@RestController
@RequestMapping("/api/games")
public class GameController {

    @Autowired
    private GameRepository repo;

    @Autowired
    private GameService service;

    @PostMapping
    public Game create(@RequestBody Game game) {
        return repo.save(game);
    }
    @PutMapping("/{id}")
    public Game update(@PathVariable Long id, @RequestBody Game updatedGame) {
        Game existing = repo.findById(id).orElseThrow();
        existing.setTitle(updatedGame.getTitle());
        existing.setDescription(updatedGame.getDescription());
        existing.setCategory(updatedGame.getCategory());
        existing.setXpReward(updatedGame.getXpReward());
        existing.setTimerDuration(updatedGame.getTimerDuration());
        return repo.save(existing);
    }



    @GetMapping
    public List<Game> getAll() {
        return service.getAllGames();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

}