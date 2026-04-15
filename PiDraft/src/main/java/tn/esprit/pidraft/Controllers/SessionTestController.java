package tn.esprit.pidraft.Controllers;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.entities.SessionTest;
import tn.esprit.pidraft.Services.SessionTestService;

import java.util.List;

@RestController
@RequestMapping("/api/session-tests")
public class SessionTestController {

    private final SessionTestService service;

    public SessionTestController(SessionTestService service) {
        this.service = service;
    }

    @GetMapping
    public List<SessionTest> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionTest> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public SessionTest create(@RequestBody SessionTest sessionTest) {
        return service.create(sessionTest);
    }

    @PutMapping("/{id}")
    public SessionTest update(@PathVariable Long id, @RequestBody SessionTest sessionTest) {
        return service.update(id, sessionTest);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
