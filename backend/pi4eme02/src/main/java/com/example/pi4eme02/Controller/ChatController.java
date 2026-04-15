package com.example.pi4eme02.Controller;

import com.example.pi4eme02.Service.interfaces.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @SuppressWarnings("unchecked")
    @PostMapping
    public Map<String, Object> chat(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");
        List<Map<String, String>> history = (List<Map<String, String>>) request.getOrDefault("history", new ArrayList<>());
        String memoryContext = (String) request.getOrDefault("memoryContext", "");
        return chatService.chat(message, history, memoryContext);
    }

    @PostMapping("/script")
    public Map<String, Object> generateScript(@RequestBody Map<String, Object> request) {
        String topic = (String) request.getOrDefault("topic", "daily conversation");
        String level = (String) request.getOrDefault("level", "beginner");
        String userName = (String) request.getOrDefault("userName", "Student");
        String memoryContext = (String) request.getOrDefault("memoryContext", "");
        return chatService.generateScript(topic, level, userName, memoryContext);
    }

    @PostMapping("/score-reading")
    public Map<String, Object> scoreReading(@RequestBody Map<String, Object> request) {
        String expected = (String) request.getOrDefault("expected", "");
        String spoken = (String) request.getOrDefault("spoken", "");
        String memoryContext = (String) request.getOrDefault("memoryContext", "");
        return chatService.scoreReading(expected, spoken, memoryContext);
    }

    @PostMapping("/tts")
    public ResponseEntity<byte[]> textToSpeech(@RequestBody Map<String, Object> request) {
        String text = (String) request.getOrDefault("text", "");
        String voice = (String) request.getOrDefault("voice", "nova");

        if (text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            byte[] audio = chatService.textToSpeech(text, voice);
            if (audio == null || audio.length == 0) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            headers.setContentLength(audio.length);
            return new ResponseEntity<>(audio, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
