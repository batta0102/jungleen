package tn.esprit.pidraft.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.Services.InterviewService;
import tn.esprit.pidraft.entities.Interview;

import java.util.List;

@RestController
@RequestMapping({"/interview", "/api/interview"})
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService service;

    @PostMapping("/add")
    public Interview add(
            @RequestBody Interview i){

        return service.add(i);
    }

    @GetMapping("/all")
    public List<Interview> getAll(){
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Interview getById(
            @PathVariable Long id){

        return service.getById(id);
    }

    @PutMapping("/update/{id}")
    public Interview update(
            @PathVariable Long id,
            @RequestBody Interview i){

        return service.update(id,i);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(
            @PathVariable Long id){

        service.delete(id);
    }
}
