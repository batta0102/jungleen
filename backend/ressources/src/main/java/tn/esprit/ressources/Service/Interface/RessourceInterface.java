package tn.esprit.ressources.Service.Interface;

import tn.esprit.ressources.Entites.Resource;

import java.util.List;

public interface RessourceInterface {
    Resource createResource(Resource resource);

    Resource updateResource(Long id, Resource resource);

    Resource getResourceById(Long id);

    List<Resource> getAllResources();

    void deleteResource(Long id);
}
