package tn.esprit.pidraft.Controllers;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.entities.Resultat;
import tn.esprit.pidraft.Services.ResultatService;

import java.util.List;

@RestController
@RequestMapping("/api/resultats")
public class ResultatController {

    private final ResultatService service;

    public ResultatController(ResultatService service) {
        this.service = service;
    }

    @GetMapping
    public List<Resultat> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resultat> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Resultat create(@RequestBody Resultat resultat) {
        return service.create(resultat);
    }

    @PutMapping("/{id}")
    public Resultat update(@PathVariable Long id, @RequestBody Resultat resultat) {
        return service.update(id, resultat);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
