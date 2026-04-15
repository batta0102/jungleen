package tn.esprit.pidraft;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
@SpringBootApplication
@EnableDiscoveryClient
public class PiDraftApplication {

    public static void main(String[] args) {
        SpringApplication.run(PiDraftApplication.class, args);
    }

}
