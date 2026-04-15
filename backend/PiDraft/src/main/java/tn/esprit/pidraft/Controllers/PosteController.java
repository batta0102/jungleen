package tn.esprit.pidraft.Controllers;


import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.Services.PosteService;
import tn.esprit.pidraft.entities.Poste;

import java.util.List;

@RestController
@RequestMapping({"/poste", "/api/poste"})
@RequiredArgsConstructor
public class PosteController {

    private final PosteService posteService;

    @PostMapping("/add")
    public Poste addPoste(@RequestBody Poste poste){
        return posteService.addPoste(poste);
    }

    @GetMapping("/all")
    public List<Poste> getAllPostes(){
        return posteService.getAllPostes();
    }

    @GetMapping("/{id}")
    public Poste getPoste(@PathVariable Long id){
        return posteService.getPosteById(id);
    }

    @PutMapping("/update/{id}")
    public Poste updatePoste(@PathVariable Long id,@RequestBody Poste poste){
        return posteService.updatePoste(id,poste);
    }

    @DeleteMapping("/delete/{id}")
    public void deletePoste(@PathVariable Long id){
        posteService.deletePoste(id);
    }
}
