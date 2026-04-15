package tn.esprit.ressources.RestController;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tn.esprit.ressources.Entites.Resource;
import tn.esprit.ressources.Service.Interface.RessourceInterface;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResourceController {
    @Autowired
    private  RessourceInterface resourceService;

    // CREATE
        @PostMapping("/addResource")
    public Resource createResource(@RequestBody Resource resource) {
        resource.setUploadDate(LocalDateTime.now()); // <-- sets current time

        return resourceService.createResource(resource);
    }

    // READ ALL
    @GetMapping("/displayResources")
    public List<Resource> getAllResources() {
        return resourceService.getAllResources();
    }

    // READ BY ID
    @GetMapping("/getResource/{id}")
    public Resource getResource(@PathVariable Long id) {
        return resourceService.getResourceById(id);
    }

    // UPDATE
    @PutMapping("/updateResource/{id}")
    public Resource updateResource(@PathVariable Long id, @RequestBody Resource resource) {
        return resourceService.updateResource(id, resource);
    }

    // DELETE
    @DeleteMapping("/deleteResource/{id}")
    public void deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
    }
}
