package tn.esprit.pidraft.Controllers;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.entities.ReponseDonnee;
import tn.esprit.pidraft.Services.ReponseDonneeService;

import java.util.List;

@RestController
@RequestMapping("/api/reponses")
public class ReponseDonneeController {

    private final ReponseDonneeService service;

    public ReponseDonneeController(ReponseDonneeService service) {
        this.service = service;
    }

    @GetMapping
    public List<ReponseDonnee> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReponseDonnee> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ReponseDonnee create(@RequestBody ReponseDonnee reponseDonnee) {
        return service.create(reponseDonnee);
    }

    @PutMapping("/{id}")
    public ReponseDonnee update(@PathVariable Long id, @RequestBody ReponseDonnee reponseDonnee) {
        return service.update(id, reponseDonnee);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
