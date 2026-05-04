package tn.esprit.jungledraft.Services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class TranslationService {

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String traduireEnFrancais(String texte) throws Exception {
        if (texte == null || texte.isEmpty()) {
            return texte;
        }

        // Limiter le texte pour éviter les erreurs
        String textToTranslate = texte;
        if (texte.length() > 1000) {
            textToTranslate = texte.substring(0, 1000);
            log.info("Texte tronqué à 1000 caractères");
        }

        // Nettoyer le texte
        String cleanedText = textToTranslate
                .replace("\n", " ")
                .replace("\r", " ")
                .replace("\"", "'")
                .replace("“", "\"")
                .replace("”", "\"");

        String encodedTexte = URLEncoder.encode(cleanedText, StandardCharsets.UTF_8.toString());

        // API Lingva
        String url = "https://lingva.ml/api/v1/en/fr/" + encodedTexte;

        log.info("🌐 Appel traduction Lingva");

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                String traduction = json.path("translation").asText();

                // 🔥 CORRECTION : Décoder les caractères encodés (+ devient espace)
                String decodedTraduction = URLDecoder.decode(traduction, StandardCharsets.UTF_8.toString());

                // Nettoyer les guillemets
                decodedTraduction = decodedTraduction
                        .replace("+", " ")
                        .replace("%2C", ",")
                        .replace("%3F", "?")
                        .replace("%21", "!")
                        .replace("%27", "'")
                        .replace("%22", "\"");

                log.info("✅ Traduction réussie");
                return decodedTraduction;
            } else {
                log.error("Erreur Lingva: {}", response.statusCode());
            }
        } catch (Exception e) {
            log.error("Erreur: {}", e.getMessage());
        }

        return "Traduction temporairement indisponible";
    }
}