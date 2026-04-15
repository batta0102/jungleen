package com.example.pi4eme02.Service.Implementing;

import com.example.pi4eme02.Entity.CrosswordGame;
import com.example.pi4eme02.Repository.CrosswordGameRepository;
import com.example.pi4eme02.Service.interfaces.CrosswordGameService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class
CrosswordGameServiceImpl implements CrosswordGameService {
    private final CrosswordGameRepository repo;
    private final Random random = new Random();

    public CrosswordGameServiceImpl(CrosswordGameRepository repo) {
        this.repo = repo;
    }

    @Override
    public CrosswordGame create(CrosswordGame game) {
        return repo.save(game);
    }

    @Override
    public List<CrosswordGame> getAll() {
        return repo.findAll();
    }

    @Override
    public Optional<CrosswordGame> getById(Long id) {
        return repo.findById(id);
    }

    @Override
    public CrosswordGame update(Long id, CrosswordGame updated) {
        CrosswordGame existing = repo.findById(id).orElseThrow();
        existing.setTitle(updated.getTitle());
        existing.setDifficulty(updated.getDifficulty());
        existing.setXpReward(updated.getXpReward());
        existing.setWidth(updated.getWidth());
        existing.setHeight(updated.getHeight());
        existing.setGridRows(updated.getGridRows());
        existing.setClues(updated.getClues());
        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }

    @Override
    public Optional<CrosswordGame> getRandomByDifficulty(String difficulty) {
        List<CrosswordGame> list = repo.findByDifficultyIgnoreCase(difficulty);
        if (list.isEmpty()) return Optional.empty();
        return Optional.of(list.get(random.nextInt(list.size())));
    }
}
