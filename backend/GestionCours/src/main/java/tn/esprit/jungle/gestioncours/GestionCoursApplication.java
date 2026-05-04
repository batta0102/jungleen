package tn.esprit.jungle.gestioncours;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * GestionCours Microservice Application
 * 
 * This service is responsible for managing online and on-site courses.
 * It registers with Eureka Server for service discovery and can be accessed
 * through the API Gateway.
 * 
 * Service Name: GestionCours
 * Port: 9090
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class GestionCoursApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestionCoursApplication.class, args);
    }

}
