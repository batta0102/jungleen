package tn.esprit.pidraft.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.Services.CertificatService;
import tn.esprit.pidraft.entities.Certificat;

import java.util.List;

@RestController
@RequestMapping("/certificat")
@RequiredArgsConstructor
public class CertificatController {

    private final CertificatService service;

    @PostMapping("/add")
    public Certificat add(
            @RequestBody Certificat c){

        return service.add(c);
    }

    @GetMapping("/all")
    public List<Certificat> getAll(){
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Certificat getById(
            @PathVariable Long id){

        return service.getById(id);
    }

    @PutMapping("/update/{id}")
    public Certificat update(
            @PathVariable Long id,
            @RequestBody Certificat c){

        return service.update(id,c);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(
            @PathVariable Long id){

        service.delete(id);
    }
}
