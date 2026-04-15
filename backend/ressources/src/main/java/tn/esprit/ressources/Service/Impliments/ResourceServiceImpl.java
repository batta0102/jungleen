package tn.esprit.ressources.Service.Impliments;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.ressources.Entites.Resource;
import tn.esprit.ressources.Repository.ResourceRepository;
import tn.esprit.ressources.Service.Interface.RessourceInterface;

import java.time.LocalDateTime;
import java.util.List;
@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements RessourceInterface {
    private final ResourceRepository resourceRepository;

    @Override
    public Resource createResource(Resource resource) {

        return resourceRepository.save(resource);
    }

    @Override
    public Resource updateResource(Long id, Resource resource) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        existing.setTitle(resource.getTitle());
        existing.setDescription(resource.getDescription());
        existing.setType(resource.getType());
        existing.setFileUrl(resource.getFileUrl());

        return resourceRepository.save(existing);
    }

    @Override
    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
    }

    @Override
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    @Override
    public void deleteResource(Long id) {
        resourceRepository.deleteById(id);
    }
}
