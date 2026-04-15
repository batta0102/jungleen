package com.example.pi4eme02.Service.Implementing;



import com.example.pi4eme02.Entity.Skin;
import com.example.pi4eme02.Repository.SkinRepository;
import com.example.pi4eme02.Service.interfaces.SkinService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkinServiceImpl implements SkinService {

    private final SkinRepository repo;

    public SkinServiceImpl(SkinRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<Skin> getAllSkins() {
        return repo.findAll();
    }

    @Override
    public Skin getSkinById(Long id) {
        return repo.findById(id).orElseThrow();
    }

    @Override
    public Skin createSkin(Skin skin) {
        return repo.save(skin);
    }

    @Override
    public Skin updateSkin(Long id, Skin updated) {
        Skin existing = repo.findById(id).orElseThrow();
        existing.setCategory(updated.getCategory());
        existing.setName(updated.getName());
        existing.setUnlockLevel(updated.getUnlockLevel());
        return repo.save(existing);
    }

    @Override
    public void deleteSkin(Long id) {
        repo.deleteById(id);
    }
}