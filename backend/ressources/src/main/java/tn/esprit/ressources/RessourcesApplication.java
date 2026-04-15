    package tn.esprit.ressources;

    import org.springframework.boot.SpringApplication;
    import org.springframework.boot.autoconfigure.SpringBootApplication;
    import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
    import org.springframework.cloud.openfeign.EnableFeignClients;

    @EnableDiscoveryClient
    @EnableFeignClients
    @SpringBootApplication
    public class    RessourcesApplication {

        public static void main(String[] args) {
            SpringApplication.run(RessourcesApplication.class, args);
        }

    }
