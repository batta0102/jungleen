package com.example.pi4eme02.Service.Implementing;

import com.example.pi4eme02.Entity.Avatar;
import com.example.pi4eme02.Repository.AvatarRepository;
import com.example.pi4eme02.Service.interfaces.AvatarService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AvatarServiceImpl implements AvatarService {

    private final AvatarRepository repo;

    public AvatarServiceImpl(AvatarRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<Avatar> getAllAvatars() {
        return repo.findAll();
    }

    @Override
    public Avatar getAvatarById(Long id) {
        return repo.findById(id).orElseThrow();
    }

    @Override
    public Avatar createAvatar(Avatar avatar) {
        return repo.save(avatar);
    }

    @Override
    public Avatar updateAvatar(Long id, Avatar updated) {
        Avatar existing = repo.findById(id).orElseThrow();
        existing.setType(updated.getType());
        return repo.save(existing);
    }

    @Override
    public void deleteAvatar(Long id) {
        repo.deleteById(id);
    }
}