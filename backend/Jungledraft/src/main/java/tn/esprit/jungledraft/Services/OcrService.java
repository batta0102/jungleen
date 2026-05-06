package tn.esprit.jungledraft.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@Slf4j
@RequiredArgsConstructor
public class OcrService {

    @Value("${app.ocr.tesseract-executable:}")
    private String tesseractExecutable;

    @Value("${app.ocr.tessdata-dir:}")
    private String tessdataDir;

    public String extraireTexte(MultipartFile photo) throws Exception {

        Path tempImage = Files.createTempFile("ocr_", ".png");
        photo.transferTo(tempImage.toFile());

        Path tempOutput = Files.createTempFile("ocr_output_", "");
        String outputBase = tempOutput.toString().replace(".txt", "");

        log.info("📸 Analyse de l'image: {}", photo.getOriginalFilename());

        ProcessBuilder pb = new ProcessBuilder(
                resolveTesseractExecutable(),
                tempImage.toString(),
                outputBase,
                "-l", "eng+fra"
        );

        if (tessdataDir != null && !tessdataDir.isBlank()) {
            pb.command().add(3, "--tessdata-dir");
            pb.command().add(4, tessdataDir.trim());
        }

        Process process = pb.start();
        int exitCode = process.waitFor();

        String texte = "";

        if (exitCode == 0) {
            File outputFile = new File(outputBase + ".txt");

            if (outputFile.exists()) {
                texte = Files.readString(outputFile.toPath()).trim();

                try {
                    Files.deleteIfExists(outputFile.toPath());
                } catch (IOException e) {
                    log.error("❌ Erreur suppression fichier OCR: {}", outputFile.getAbsolutePath(), e);
                }

                log.info("📝 Texte extrait: {}", texte);
            }
        }

        try {
            Files.deleteIfExists(tempImage);
            Files.deleteIfExists(Path.of(outputBase + ".txt"));
        } catch (IOException e) {
            log.error("❌ Erreur nettoyage fichiers temporaires", e);
        }

        return texte.isEmpty() ? "Aucun texte détecté" : texte;
    }

    private String resolveTesseractExecutable() {
        if (tesseractExecutable != null && !tesseractExecutable.isBlank()) {
            return tesseractExecutable.trim();
        }

        String[] candidates = {
                "C:/Program Files/Tesseract-OCR/tesseract.exe",
                "C:/Program Files (x86)/Tesseract-OCR/tesseract.exe",
                "tesseract"
        };

        for (String candidate : candidates) {
            if ("tesseract".equals(candidate) || Files.exists(Paths.get(candidate))) {
                return candidate;
            }
        }

        throw new IllegalStateException(
                "Tesseract n'est pas installé ou n'est pas accessible. " +
                        "Définissez app.ocr.tesseract-executable ou installez Tesseract OCR."
        );
    }
}
