package com.example.pi4eme02.Controller;

import com.example.pi4eme02.Entity.CrosswordClue;
import com.example.pi4eme02.Entity.CrosswordGame;
import com.example.pi4eme02.Service.interfaces.CrosswordGameService;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/crosswords")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
public class CrosswordGameController {
    private final CrosswordGameService service;

    public CrosswordGameController(CrosswordGameService service) {
        this.service = service;
    }

    @GetMapping
    public List<CrosswordGame> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public CrosswordGame getById(@PathVariable Long id) {
        return service.getById(id).orElseThrow();
    }

    @GetMapping("/random")
    public CrosswordGame getRandom(@RequestParam("difficulty") String difficulty) {
        return service.getRandomByDifficulty(difficulty).orElseThrow();
    }

    @PostMapping
    public CrosswordGame create(@RequestBody CrosswordGame game) {
        return service.create(game);
    }

    @PutMapping("/{id}")
    public CrosswordGame update(@PathVariable Long id, @RequestBody CrosswordGame updated) {
        return service.update(id, updated);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/{id}/validate")
    public ValidateResponse validate(@PathVariable Long id, @RequestBody ValidateRequest request) {
        CrosswordGame game = service.getById(id).orElseThrow();
        Map<String, String> answers = new HashMap<>();
        if (request.answers != null) {
            for (AnswerAttempt a : request.answers) {
                if (a.clueId != null && a.answer != null) {
                    answers.put(a.clueId, a.answer.trim().toLowerCase());
                }
            }
        }

        List<String> correctIds = new ArrayList<>();
        int correct = 0;
        for (CrosswordClue clue : game.getClues()) {
            String expected = clue.getAnswer() == null ? "" : clue.getAnswer().trim().toLowerCase();
            String got = answers.getOrDefault(clue.getId(), "");
            if (!expected.isBlank() && expected.equals(got)) {
                correct += 1;
                correctIds.add(clue.getId());
            }
        }

        ValidateResponse res = new ValidateResponse();
        res.total = game.getClues().size();
        res.correct = correct;
        res.allCorrect = correct == res.total && res.total > 0;
        res.correctClueIds = correctIds;
        return res;
    }

    public static class ValidateRequest {
        public List<AnswerAttempt> answers;
    }

    public static class AnswerAttempt {
        public String clueId;
        public String answer;
    }

    public static class ValidateResponse {
        public int total;
        public int correct;
        public boolean allCorrect;
        public List<String> correctClueIds;
    }
}
