package tn.esprit.pidraft.Controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.entities.ChoixReponse;
import tn.esprit.pidraft.Services.ChoixReponseService;

import java.util.List;

@RestController
@RequestMapping("/api/choix-reponses")
public class ChoixReponseController {

    private final ChoixReponseService service;

    public ChoixReponseController(ChoixReponseService service) {
        this.service = service;
    }

    @GetMapping
    public List<ChoixReponse> getAllChoix() {
        return service.getAllChoix();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChoixReponse> getChoixById(@PathVariable Long id) {
        return service.getChoixById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ChoixReponse createChoix(@RequestBody ChoixReponse choix) {
        return service.createChoix(choix);
    }

    @PutMapping("/{id}")
    public ChoixReponse updateChoix(@PathVariable Long id, @RequestBody ChoixReponse choix) {
        return service.updateChoix(id, choix);
    }

    @DeleteMapping("/{id}")
    public void deleteChoix(@PathVariable Long id) {
        service.deleteChoix(id);
    }
}
