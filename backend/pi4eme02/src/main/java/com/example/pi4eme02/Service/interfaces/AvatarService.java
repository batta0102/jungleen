package com.example.pi4eme02.Service.interfaces;

import com.example.pi4eme02.Entity.Avatar;
import java.util.List;

public interface AvatarService {
    List<Avatar> getAllAvatars();
    Avatar getAvatarById(Long id);
    Avatar createAvatar(Avatar avatar);
    Avatar updateAvatar(Long id, Avatar avatar);
    void deleteAvatar(Long id);
}