package com.example.pi4eme02.Entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class CrosswordGame {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String difficulty; // Beginner | Medium | Hard
    private int xpReward;
    private int width;
    private int height;

    @ElementCollection
    @CollectionTable(name = "crossword_rows", joinColumns = @JoinColumn(name = "game_id"))
    @Column(name = "row_text", length = 2000)
    private List<String> gridRows = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "crossword_clues", joinColumns = @JoinColumn(name = "game_id"))
    private List<CrosswordClue> clues = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public int getXpReward() { return xpReward; }
    public void setXpReward(int xpReward) { this.xpReward = xpReward; }

    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }

    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }

    public List<String> getGridRows() { return gridRows; }
    public void setGridRows(List<String> gridRows) { this.gridRows = gridRows; }

    public List<CrosswordClue> getClues() { return clues; }
    public void setClues(List<CrosswordClue> clues) { this.clues = clues; }
}
