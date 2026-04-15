package com.example.pi4eme02.Service.interfaces;

import com.example.pi4eme02.Entity.Skin;
import java.util.List;

public interface SkinService {
    List<Skin> getAllSkins();
    Skin getSkinById(Long id);
    Skin createSkin(Skin skin);
    Skin updateSkin(Long id, Skin skin);
    void deleteSkin(Long id);
}