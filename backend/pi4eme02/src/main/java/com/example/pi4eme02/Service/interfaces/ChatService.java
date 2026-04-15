package com.example.pi4eme02.Service.interfaces;

import java.util.List;
import java.util.Map;

public interface ChatService {
    Map<String, Object> chat(String message, List<Map<String, String>> history);
    Map<String, Object> chat(String message, List<Map<String, String>> history, String memoryContext);
    Map<String, Object> generateScript(String topic, String level, String userName, String memoryContext);
    Map<String, Object> scoreReading(String expected, String spoken, String memoryContext);
    byte[] textToSpeech(String text, String voice);
}
