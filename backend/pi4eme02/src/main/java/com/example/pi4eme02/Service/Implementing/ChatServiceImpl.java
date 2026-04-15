package com.example.pi4eme02.Service.Implementing;

import com.example.pi4eme02.Service.interfaces.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class ChatServiceImpl implements ChatService {

    @Value("${openai.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Random random = new Random();

    private static final String SYSTEM_PROMPT = """
            You are a friendly English tutor named "Jungle Tutor". Your job:
            1. Have natural English conversations with the student
            2. If they make grammar, spelling, or phrasing errors, correct them kindly
            3. Keep conversations engaging and ask follow-up questions
            4. Be encouraging and supportive
            5. ALWAYS remember the student's name and refer to them by name occasionally
            6. Reference past conversations and topics when relevant
            7. Track the student's progress and celebrate improvements

            ALWAYS respond in this exact JSON format (raw JSON, no markdown code fences):
            {
              "reply": "Your conversational response here",
              "corrections": [
                {
                  "original": "what the student wrote wrong",
                  "corrected": "the correct version",
                  "explanation": "brief explanation"
                }
              ]
            }
            If there are no mistakes, use an empty corrections array.
            Keep replies concise (2-3 sentences max).
            """;

    private static final String SCRIPT_PROMPT = """
            You are a script writer for English language learning. Generate a dialogue script for reading practice.
            The script should be between a "tutor" and a "student" character.
            Make it natural, engaging, and appropriate for the specified difficulty level.

            IMPORTANT: Respond ONLY in this exact JSON format (raw JSON, no markdown code fences):
            {
              "script": {
                "id": "unique-id-here",
                "title": "Emoji + Script Title",
                "description": "Brief description of the scenario",
                "difficulty": "beginner|intermediate|advanced",
                "lines": [
                  {"speaker": "tutor", "text": "What the tutor says"},
                  {"speaker": "student", "text": "What the student should read", "hint": "Brief hint about what to say"}
                ]
              }
            }

            Requirements:
            - 8-12 lines of dialogue, alternating between tutor and student
            - Student lines should have a "hint" field
            - Match vocabulary and grammar complexity to the difficulty level
            - Make it feel like a real conversation
            """;

    private static final String SCORE_PROMPT = """
            You are an English pronunciation and reading evaluator.
            Compare what was expected vs what the student actually said.
            Score accuracy from 0-100 and provide brief, encouraging feedback.

            IMPORTANT: Respond ONLY in this exact JSON format (raw JSON, no markdown code fences):
            {
              "score": 85,
              "feedback": "Brief encouraging feedback",
              "corrections": [
                {
                  "original": "what they said wrong",
                  "corrected": "what they should have said",
                  "explanation": "brief tip"
                }
              ]
            }
            Be generous with scoring - speech recognition isn't perfect.
            If the meaning is correct even if wording differs slightly, give a high score.
            """;

    /* ═══════════ CHAT ═══════════ */

    @Override
    public Map<String, Object> chat(String message, List<Map<String, String>> history) {
        return chat(message, history, "");
    }

    @Override
    public Map<String, Object> chat(String message, List<Map<String, String>> history, String memoryContext) {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String systemPrompt = SYSTEM_PROMPT;
                if (memoryContext != null && !memoryContext.isBlank()) {
                    systemPrompt += "\n\n== STUDENT MEMORY (use this to personalize) ==\n" + memoryContext;
                }
                return callOpenAI(systemPrompt, message, history);
            } catch (Exception e) {
                System.err.println("OpenAI API error: " + e.getMessage());
            }
        }
        return fallbackResponse(message);
    }

    /* ═══════════ SCRIPT GENERATION ═══════════ */

    @Override
    public Map<String, Object> generateScript(String topic, String level, String userName, String memoryContext) {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String prompt = SCRIPT_PROMPT;
                if (memoryContext != null && !memoryContext.isBlank()) {
                    prompt += "\n\n== STUDENT MEMORY ==\n" + memoryContext;
                }

                String userMessage = String.format(
                    "Generate a %s level dialogue script about: %s. The student's name is %s.",
                    level, topic, userName
                );

                return callOpenAIRaw(prompt, userMessage);
            } catch (Exception e) {
                System.err.println("OpenAI script generation error: " + e.getMessage());
            }
        }
        return fallbackScript(topic, level);
    }

    /* ═══════════ READING SCORE ═══════════ */

    @Override
    public Map<String, Object> scoreReading(String expected, String spoken, String memoryContext) {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String prompt = SCORE_PROMPT;
                if (memoryContext != null && !memoryContext.isBlank()) {
                    prompt += "\n\n== STUDENT CONTEXT ==\n" + memoryContext;
                }

                String userMessage = String.format(
                    "Expected text: \"%s\"\nStudent said: \"%s\"",
                    expected, spoken
                );

                return callOpenAIRaw(prompt, userMessage);
            } catch (Exception e) {
                System.err.println("OpenAI score error: " + e.getMessage());
            }
        }
        return fallbackScore(expected, spoken);
    }

    /* ═══════════ OpenAI Integration ═══════════ */

    /* ═══════════ TEXT-TO-SPEECH (OpenAI TTS) ═══════════ */

    @Override
    public byte[] textToSpeech(String text, String voice) {
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }

        try {
            // Validate voice parameter
            String safeVoice = switch (voice != null ? voice.toLowerCase() : "nova") {
                case "alloy", "echo", "fable", "onyx", "nova", "shimmer" -> voice.toLowerCase();
                default -> "nova";
            };

            Map<String, Object> body = new HashMap<>();
            body.put("model", "tts-1");
            body.put("input", text);
            body.put("voice", safeVoice);
            body.put("response_format", "mp3");
            body.put("speed", 0.95);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    "https://api.openai.com/v1/audio/speech",
                    HttpMethod.POST, entity, byte[].class);

            return response.getBody();
        } catch (Exception e) {
            System.err.println("OpenAI TTS error: " + e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callOpenAI(String systemPrompt, String message, List<Map<String, String>> history) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (history != null) {
            for (Map<String, String> msg : history) {
                messages.add(Map.of("role", msg.get("role"), "content", msg.get("content")));
            }
        }
        messages.add(Map.of("role", "user", "content", message));

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-3.5-turbo");
        body.put("messages", messages);
        body.put("temperature", 0.7);
        body.put("max_tokens", 500);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.openai.com/v1/chat/completions",
                HttpMethod.POST, entity, Map.class);

        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
        String content = (String) messageObj.get("content");

        try {
            return objectMapper.readValue(content, Map.class);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("reply", content);
            result.put("corrections", List.of());
            return result;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callOpenAIRaw(String systemPrompt, String userMessage) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-3.5-turbo");
        body.put("messages", messages);
        body.put("temperature", 0.7);
        body.put("max_tokens", 800);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.openai.com/v1/chat/completions",
                HttpMethod.POST, entity, Map.class);

        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
        String content = (String) messageObj.get("content");

        try {
            return objectMapper.readValue(content, Map.class);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("reply", content);
            return result;
        }
    }

    /* ═══════════ Fallback Script (offline) ═══════════ */

    private Map<String, Object> fallbackScript(String topic, String level) {
        List<Map<String, Object>> lines = new ArrayList<>();
        String title;
        String description;
        String lower = topic.toLowerCase();

        if (lower.contains("interview") || lower.contains("job")) {
            title = "💼 Job Interview";
            description = "Practice answering common interview questions";
            lines.add(scriptLine("tutor", "Please have a seat. Thank you for coming in today. Can you tell me a little about yourself?", null));
            lines.add(scriptLine("student", "Thank you for having me. I am a recent graduate with a degree in computer science.", "Introduce yourself briefly"));
            lines.add(scriptLine("tutor", "Interesting! What attracted you to this position?", null));
            lines.add(scriptLine("student", "I am really passionate about technology and I believe this company offers great opportunities to grow.", "Express enthusiasm"));
            lines.add(scriptLine("tutor", "Can you describe a challenge you have faced and how you overcame it?", null));
            lines.add(scriptLine("student", "During my final project at university, I had to learn a new programming language in just two weeks. I dedicated extra hours each day and successfully completed the project on time.", "Tell a specific story"));
            lines.add(scriptLine("tutor", "That shows great dedication! Where do you see yourself in five years?", null));
            lines.add(scriptLine("student", "I see myself as a senior developer, leading a team and contributing to innovative projects.", "Share your career vision"));
            lines.add(scriptLine("tutor", "Excellent! Do you have any questions for us?", null));
            lines.add(scriptLine("student", "Yes, I would like to know more about the team I would be working with and what a typical day looks like.", "Ask a thoughtful question"));
        } else if (lower.contains("airport") || lower.contains("travel") || lower.contains("flight")) {
            title = "✈️ At the Airport";
            description = "Navigate airport conversations with confidence";
            lines.add(scriptLine("tutor", "Next in line, please! May I see your passport and boarding pass?", null));
            lines.add(scriptLine("student", "Of course, here you go. I am flying to London today.", "Present your documents"));
            lines.add(scriptLine("tutor", "Thank you. Did you pack your bags yourself? Do you have any liquids over one hundred milliliters?", null));
            lines.add(scriptLine("student", "Yes, I packed everything myself. All my liquids are in a small clear bag.", "Answer security questions"));
            lines.add(scriptLine("tutor", "Perfect. Your flight is boarding at gate B twelve. It departs at three forty-five.", null));
            lines.add(scriptLine("student", "Thank you! Could you tell me where gate B twelve is, please?", "Ask for directions"));
            lines.add(scriptLine("tutor", "Sure! Go straight ahead, past the duty-free shop, then turn right. You will see the signs.", null));
            lines.add(scriptLine("student", "That is very helpful. Thank you so much! Have a nice day.", "Thank and say goodbye"));
        } else if (lower.contains("restaurant") || lower.contains("food") || lower.contains("dining") || lower.contains("dinner")) {
            title = "🍽️ Dinner at the Restaurant";
            description = "Practice ordering food at a restaurant";
            lines.add(scriptLine("tutor", "Good evening! Welcome to the Jungle Restaurant. Table for one?", null));
            lines.add(scriptLine("student", "Good evening! Yes, table for one, please.", "Greet and confirm"));
            lines.add(scriptLine("tutor", "Right this way! Here is the menu. Can I get you something to drink first?", null));
            lines.add(scriptLine("student", "I would like a glass of water and an orange juice, please.", "Order drinks"));
            lines.add(scriptLine("tutor", "Great! Are you ready to order, or do you need a few more minutes?", null));
            lines.add(scriptLine("student", "I think I am ready. I will have the grilled chicken with vegetables.", "Order food"));
            lines.add(scriptLine("tutor", "Excellent choice! Would you like any dessert to finish?", null));
            lines.add(scriptLine("student", "What do you recommend? I like chocolate.", "Ask for suggestion"));
            lines.add(scriptLine("tutor", "Our chocolate lava cake is very popular! I highly recommend it.", null));
            lines.add(scriptLine("student", "That sounds perfect! I will have that as well. Thank you!", "Accept and thank"));
        } else if (lower.contains("shop") || lower.contains("clothes") || lower.contains("store")) {
            title = "🛍️ Shopping for Clothes";
            description = "Practice shopping conversations";
            lines.add(scriptLine("tutor", "Hi! Welcome to our store. Can I help you find anything today?", null));
            lines.add(scriptLine("student", "Hi! I am looking for a new jacket. Do you have any in medium?", "Ask about size"));
            lines.add(scriptLine("tutor", "Of course! We have several styles. Do you prefer something casual or formal?", null));
            lines.add(scriptLine("student", "I would prefer something casual that I can wear every day.", "Share preference"));
            lines.add(scriptLine("tutor", "How about this one? It comes in blue and black. Would you like to try it on?", null));
            lines.add(scriptLine("student", "Yes, please! Where is the fitting room?", "Ask for fitting room"));
            lines.add(scriptLine("tutor", "It is right over there on the left. Take your time!", null));
            lines.add(scriptLine("student", "This fits perfectly! How much does it cost?", "Ask about price"));
            lines.add(scriptLine("tutor", "It is forty-five dollars. Would you like to pay with cash or card?", null));
            lines.add(scriptLine("student", "I will pay with my card, please. Thank you for your help!", "Complete purchase"));
        } else if (lower.contains("doctor") || lower.contains("health") || lower.contains("hospital") || lower.contains("medical")) {
            title = "🏥 At the Doctor's Office";
            description = "Practice medical appointment conversations";
            lines.add(scriptLine("tutor", "Good morning! How are you feeling today? What brings you in?", null));
            lines.add(scriptLine("student", "Good morning, doctor. I have had a headache for the past three days.", "Describe symptoms"));
            lines.add(scriptLine("tutor", "I see. Have you had any other symptoms, like fever or dizziness?", null));
            lines.add(scriptLine("student", "Yes, I have been feeling a little dizzy in the mornings.", "Provide details"));
            lines.add(scriptLine("tutor", "Let me check your temperature and blood pressure. Are you taking any medications?", null));
            lines.add(scriptLine("student", "No, I am not taking any medications at the moment.", "Answer question"));
            lines.add(scriptLine("tutor", "Everything looks normal. I recommend rest and plenty of water. I will prescribe something for the headaches.", null));
            lines.add(scriptLine("student", "Thank you, doctor. How often should I take the medicine?", "Ask about prescription"));
        } else if (lower.contains("hotel") || lower.contains("check-in") || lower.contains("booking")) {
            title = "🏨 Hotel Check-In";
            description = "Practice checking into a hotel";
            lines.add(scriptLine("tutor", "Good afternoon! Welcome to the Jungle Hotel. Do you have a reservation?", null));
            lines.add(scriptLine("student", "Good afternoon! Yes, I have a reservation under the name Smith for three nights.", "Confirm reservation"));
            lines.add(scriptLine("tutor", "Let me check. Yes, a double room with a sea view. May I see your identification?", null));
            lines.add(scriptLine("student", "Here is my passport. Could you also tell me if breakfast is included?", "Show ID and ask about breakfast"));
            lines.add(scriptLine("tutor", "Breakfast is served from seven to ten in the restaurant on the second floor. Here is your room key.", null));
            lines.add(scriptLine("student", "Thank you! Is there a gym or swimming pool in the hotel?", "Ask about facilities"));
            lines.add(scriptLine("tutor", "Yes! The gym is on the ground floor and the pool is on the rooftop. Both are open until ten pm.", null));
            lines.add(scriptLine("student", "That sounds wonderful! One last question — what is the wifi password?", "Ask practical questions"));
        } else if (lower.contains("phone") || lower.contains("call") || lower.contains("telephone")) {
            title = "📞 Making a Phone Call";
            description = "Practice formal phone conversations";
            lines.add(scriptLine("tutor", "Good morning, you have reached the Jungle Company. How may I direct your call?", null));
            lines.add(scriptLine("student", "Good morning. I would like to speak with someone from customer service, please.", "Ask to be connected"));
            lines.add(scriptLine("tutor", "Certainly. May I ask who is calling and what this is regarding?", null));
            lines.add(scriptLine("student", "My name is Jordan Taylor. I am calling about an issue with my recent order.", "Identify yourself"));
            lines.add(scriptLine("tutor", "Let me transfer you. Please hold... Hello, this is customer service. How can I help?", null));
            lines.add(scriptLine("student", "Hello. I placed an order last week but I received the wrong item. I would like to arrange a return.", "Explain the problem"));
            lines.add(scriptLine("tutor", "I am sorry about that. Could you give me your order number?", null));
            lines.add(scriptLine("student", "Of course. The order number is seven four two one. I also have the confirmation email.", "Provide details"));
        } else if (lower.contains("direction") || lower.contains("lost") || lower.contains("navigate")) {
            title = "🗺️ Asking for Directions";
            description = "Practice navigating and understanding directions";
            lines.add(scriptLine("tutor", "Excuse me! You look a bit lost. Can I help you find something?", null));
            lines.add(scriptLine("student", "Yes, please! I am looking for the nearest train station. Do you know where it is?", "Ask for help"));
            lines.add(scriptLine("tutor", "Sure! Walk straight down this road for about two blocks. Then turn left at the traffic light.", null));
            lines.add(scriptLine("student", "Okay, straight for two blocks then turn left. Is it far from there?", "Confirm directions"));
            lines.add(scriptLine("tutor", "Not at all! After you turn left, you will see it on your right. It takes about five minutes.", null));
            lines.add(scriptLine("student", "Great, thank you! By the way, is there a pharmacy nearby?", "Ask about another location"));
            lines.add(scriptLine("tutor", "Yes, there is one right next to the train station. It has a big green sign.", null));
            lines.add(scriptLine("student", "That is very convenient! Thank you so much for all your help.", "Express gratitude"));
        } else if (lower.contains("coffee") || lower.contains("café") || lower.contains("cafe")) {
            title = "☕ Morning at the Café";
            description = "Practice casual conversation and ordering";
            lines.add(scriptLine("tutor", "Good morning! What can I get for you today?", null));
            lines.add(scriptLine("student", "Good morning! I would like a large cappuccino, please.", "Order a drink"));
            lines.add(scriptLine("tutor", "Great choice! Would you like any sugar or extra milk?", null));
            lines.add(scriptLine("student", "Just a little sugar, please. No extra milk.", "Specify preferences"));
            lines.add(scriptLine("tutor", "Of course! Would you like to add a pastry? Our croissants are fresh today.", null));
            lines.add(scriptLine("student", "That sounds delicious! I will have one croissant, please.", "Accept the offer"));
            lines.add(scriptLine("tutor", "Perfect! That will be four dollars and fifty cents.", null));
            lines.add(scriptLine("student", "Here you go. Thank you very much! Have a great day!", "Pay and say goodbye"));
        } else {
            // True random: pick one of the above by re-calling with a random topic
            String[] randomTopics = {"interview", "airport", "restaurant", "shopping", "doctor", "hotel", "phone", "directions"};
            String randomTopic = randomTopics[random.nextInt(randomTopics.length)];
            return fallbackScript(randomTopic, level);
        }

        Map<String, Object> script = new HashMap<>();
        script.put("id", topic.toLowerCase().replaceAll("[^a-z0-9]", "-") + "-" + System.currentTimeMillis());
        script.put("title", title);
        script.put("description", description);
        script.put("difficulty", level);
        script.put("lines", lines);

        Map<String, Object> result = new HashMap<>();
        result.put("script", script);
        return result;
    }

    private Map<String, Object> scriptLine(String speaker, String text, String hint) {
        Map<String, Object> line = new HashMap<>();
        line.put("speaker", speaker);
        line.put("text", text);
        if (hint != null) line.put("hint", hint);
        return line;
    }

    /* ═══════════ Fallback Score (offline) ═══════════ */

    private Map<String, Object> fallbackScore(String expected, String spoken) {
        String[] expWords = expected.toLowerCase().replaceAll("[^a-z0-9\\s]", "").split("\\s+");
        String[] spkWords = spoken.toLowerCase().replaceAll("[^a-z0-9\\s]", "").split("\\s+");

        int matches = 0;
        Set<String> spokenSet = new HashSet<>(Arrays.asList(spkWords));
        for (String w : expWords) {
            if (spokenSet.contains(w)) matches++;
        }

        int score = expWords.length > 0 ? (int) Math.round((double) matches / expWords.length * 100) : 100;
        // Be generous
        score = Math.min(100, score + 10);

        String feedback;
        List<Map<String, String>> corrections = new ArrayList<>();

        if (score >= 90) {
            feedback = pick("Excellent reading! Your pronunciation is very clear.",
                           "Perfect! You read that beautifully.",
                           "Outstanding! You nailed it!");
        } else if (score >= 70) {
            feedback = pick("Good job! Most of the words were correct.",
                           "Nice effort! Just a few words to work on.",
                           "Well done! You're getting better each time.");
        } else if (score >= 50) {
            feedback = pick("Not bad! Try reading a bit slower for clarity.",
                           "Keep practicing! Focus on pronouncing each word carefully.",
                           "Good try! Read the text again and speak more clearly.");
        } else {
            feedback = pick("Let's try that again. Take your time and read each word slowly.",
                           "Don't give up! Try reading the text out loud before recording.",
                           "Practice makes perfect! Read along with the tutor first.");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("score", score);
        result.put("feedback", feedback);
        result.put("corrections", corrections);
        return result;
    }

    /* ═══════════ Offline fallback for chat (no API key) ═══════════ */

    private Map<String, Object> fallbackResponse(String message) {
        List<Map<String, String>> corrections = detectErrors(message);
        String reply = generateReply(message, corrections);

        Map<String, Object> result = new HashMap<>();
        result.put("reply", reply);
        result.put("corrections", corrections);
        return result;
    }

    /* ── Grammar error detection ── */

    private List<Map<String, String>> detectErrors(String message) {
        List<Map<String, String>> corrections = new ArrayList<>();
        String lower = message.toLowerCase();

        // Irregular past tenses
        check(lower, "\\bi goed\\b", "I goed", "I went",
                "'Go' is an irregular verb. Past tense: 'went'.", corrections);
        check(lower, "\\bi eated\\b", "I eated", "I ate",
                "'Eat' is an irregular verb. Past tense: 'ate'.", corrections);
        check(lower, "\\bi thinked\\b", "I thinked", "I thought",
                "'Think' is an irregular verb. Past tense: 'thought'.", corrections);
        check(lower, "\\bi runned\\b", "I runned", "I ran",
                "'Run' is an irregular verb. Past tense: 'ran'.", corrections);
        check(lower, "\\bi writed\\b", "I writed", "I wrote",
                "'Write' is an irregular verb. Past tense: 'wrote'.", corrections);
        check(lower, "\\bi seed\\b", "I seed", "I saw",
                "'See' is an irregular verb. Past tense: 'saw'.", corrections);
        check(lower, "\\bi buyed\\b", "I buyed", "I bought",
                "'Buy' is an irregular verb. Past tense: 'bought'.", corrections);
        check(lower, "\\bi teached\\b", "I teached", "I taught",
                "'Teach' is an irregular verb. Past tense: 'taught'.", corrections);
        check(lower, "\\bi drived\\b", "I drived", "I drove",
                "'Drive' is an irregular verb. Past tense: 'drove'.", corrections);
        check(lower, "\\bi leaved\\b", "I leaved", "I left",
                "'Leave' is an irregular verb. Past tense: 'left'.", corrections);
        check(lower, "\\bi falled\\b", "I falled", "I fell",
                "'Fall' is an irregular verb. Past tense: 'fell'.", corrections);
        check(lower, "\\bi catched\\b", "I catched", "I caught",
                "'Catch' is an irregular verb. Past tense: 'caught'.", corrections);

        // Subject-verb agreement
        check(lower, "\\bshe don't\\b", "she don't", "she doesn't",
                "Use 'doesn't' with third person singular (he/she/it).", corrections);
        check(lower, "\\bhe don't\\b", "he don't", "he doesn't",
                "Use 'doesn't' with third person singular (he/she/it).", corrections);
        check(lower, "\\bhe have\\b", "he have", "he has",
                "Use 'has' with third person singular (he/she/it).", corrections);
        check(lower, "\\bshe have\\b", "she have", "she has",
                "Use 'has' with third person singular (he/she/it).", corrections);
        check(lower, "\\bit have\\b", "it have", "it has",
                "Use 'has' with third person singular (he/she/it).", corrections);
        check(lower, "\\bhe go\\b(?!ing|es|t|ne)", "he go", "he goes",
                "Use 'goes' with third person singular (he/she/it).", corrections);
        check(lower, "\\bshe go\\b(?!ing|es|t|ne)", "she go", "she goes",
                "Use 'goes' with third person singular (he/she/it).", corrections);

        // Double comparatives
        check(lower, "\\bmore better\\b", "more better", "better",
                "'Better' is already comparative. No need for 'more'.", corrections);
        check(lower, "\\bmore worse\\b", "more worse", "worse",
                "'Worse' is already comparative. No need for 'more'.", corrections);
        check(lower, "\\bmost best\\b", "most best", "best",
                "'Best' is already superlative. No need for 'most'.", corrections);

        // Common ESL mistakes
        check(lower, "\\bi am agree\\b", "I am agree", "I agree",
                "'Agree' is a verb, not an adjective. Say 'I agree' directly.", corrections);
        check(lower, "\\bi can to\\b", "I can to", "I can",
                "After modal verbs like 'can', use the base form without 'to'.", corrections);
        check(lower, "\\bi must to\\b", "I must to", "I must",
                "After modal verbs like 'must', use the base form without 'to'.", corrections);
        check(lower, "\\bi am student\\b", "I am student", "I am a student",
                "Countable singular nouns need an article: 'a student'.", corrections);
        check(lower, "\\bi am teacher\\b", "I am teacher", "I am a teacher",
                "Countable singular nouns need an article: 'a teacher'.", corrections);

        // Double negatives
        check(lower, "\\bdon't know nothing\\b", "don't know nothing", "don't know anything",
                "Avoid double negatives. Use 'anything' with 'don't'.", corrections);
        check(lower, "\\bcan't do nothing\\b", "can't do nothing", "can't do anything",
                "Avoid double negatives. Use 'anything' with 'can't'.", corrections);

        // There / their / they're
        check(lower, "\\btheir is\\b", "their is", "there is",
                "'Their' = possession. 'There is' = existence.", corrections);
        check(lower, "\\btheir are\\b", "their are", "there are",
                "'Their' = possession. 'There are' = existence.", corrections);

        // Your / you're
        check(lower, "\\byour welcome\\b", "your welcome", "you're welcome",
                "'Your' = possession. 'You're' = you are.", corrections);
        check(lower, "\\byour right\\b", "your right", "you're right",
                "'Your' = possession. 'You're' = you are.", corrections);

        return corrections;
    }

    private void check(String text, String regex, String original, String corrected,
                       String explanation, List<Map<String, String>> corrections) {
        if (Pattern.compile(regex).matcher(text).find()) {
            Map<String, String> c = new HashMap<>();
            c.put("original", original);
            c.put("corrected", corrected);
            c.put("explanation", explanation);
            corrections.add(c);
        }
    }

    /* ── Contextual reply generation ── */

    private String generateReply(String message, List<Map<String, String>> corrections) {
        String lower = message.toLowerCase().trim();

        if (lower.matches(".*(hello|hi|hey|good morning|good evening|good afternoon).*")) {
            return pick(
                    "Hello! Great to see you practicing your English! What would you like to talk about today?",
                    "Hi there! I'm happy to help you practice. How's your day going?",
                    "Hey! Welcome to our English practice session. What's on your mind?");
        }

        if (lower.matches(".*(how are you|how do you do|what's up|how is it going).*")) {
            return pick(
                    "I'm doing great, thank you for asking! How about you? What did you do today?",
                    "I'm wonderful! Thanks for asking. Tell me, do you have any hobbies you enjoy?",
                    "All good here! So, what brings you to practice English today?");
        }

        if (lower.matches(".*(hobby|hobbies|like to do|free time|spare time).*")) {
            return pick(
                    "Hobbies are a great way to learn new vocabulary! Can you describe your favorite hobby in more detail?",
                    "Nice! Do you practice your hobby often? Tell me more about what you enjoy.",
                    "Sounds fun! How long have you been doing that? What do you enjoy most about it?");
        }

        if (lower.matches(".*(food|eat|cook|restaurant|meal|dinner|lunch|breakfast|kitchen).*")) {
            return pick(
                    "Food is a wonderful topic! What's your favorite dish? Can you describe how it's made?",
                    "I love talking about food! Do you enjoy cooking? What's the best meal you've ever had?",
                    "Delicious topic! Tell me about a traditional dish from your culture.");
        }

        if (lower.matches(".*(travel|trip|vacation|holiday|visit|country|city|flight|airport).*")) {
            return pick(
                    "Traveling is amazing! Where would you love to go next, and why?",
                    "That sounds like a great adventure! Can you describe your favorite place you've visited?",
                    "How exciting! What's the most interesting thing you've seen while traveling?");
        }

        if (lower.matches(".*(school|study|learn|class|university|student|exam|test|homework).*")) {
            return pick(
                    "Education is important! What subject do you find most interesting? Tell me why.",
                    "That's great that you're studying! What's the most challenging part for you?",
                    "Keep up the good work! How do you usually prepare for your exams?");
        }

        if (lower.matches(".*(weather|rain|sun|snow|cold|hot|warm|cloud|storm).*")) {
            return pick(
                    "Weather is a classic conversation topic! What's the weather like where you are right now?",
                    "Do you prefer warm or cold weather? Can you explain why using full sentences?",
                    "The weather really affects our mood, doesn't it? What's your favorite season and why?");
        }

        if (lower.matches(".*(movie|film|watch|series|show|netflix|cinema).*")) {
            return pick(
                    "I love movies! What's the last film you watched? Can you describe the plot in English?",
                    "Great topic! Do you prefer action movies, comedies, or dramas? Tell me why.",
                    "Movies are wonderful for learning English! Do you watch them with subtitles?");
        }

        if (lower.matches(".*(music|song|sing|listen|band|concert|guitar|piano).*")) {
            return pick(
                    "Music is a great way to improve your English! What kind of music do you listen to?",
                    "Wonderful! Do you have a favorite English song? What do you like about it?",
                    "Listening to English songs really helps with pronunciation! Who's your favorite artist?");
        }

        if (lower.matches(".*(sport|football|soccer|basketball|tennis|swim|run|exercise|gym).*")) {
            return pick(
                    "Sports are great! Do you play any sports regularly? Tell me about your experience.",
                    "That's awesome! How often do you exercise? Describe your routine.",
                    "Staying active is important! What's your favorite sport to watch or play?");
        }

        if (lower.matches(".*(thank|thanks|thank you).*")) {
            return pick(
                    "You're welcome! You're doing great. Want to keep practicing? Tell me about your plans for the weekend!",
                    "No problem at all! Your English is improving. Let's keep going — what else would you like to discuss?",
                    "My pleasure! Remember, practice makes perfect. What topic shall we try next?");
        }

        if (lower.matches("^(yes|yeah|yep|no|nope|nah)\\.?$")) {
            return pick(
                    "Can you elaborate on that? Try using a full sentence to practice your English!",
                    "I'd love to hear more! Try explaining your answer in a complete sentence.",
                    "Good! But let's practice more — can you give me a longer answer?");
        }

        if (!corrections.isEmpty()) {
            return pick(
                    "I noticed a small mistake — check the correction above! Don't worry, everyone makes mistakes while learning. Can you try saying that again?",
                    "Almost perfect! I found a little error to fix. Keep going, you're doing well! What else would you like to talk about?",
                    "Great effort! I spotted a small grammar point. Practice makes perfect! Tell me more about what you were saying.");
        }

        return pick(
                "That's a great point! Can you tell me more about that? Try using some descriptive words.",
                "Interesting! I'd love to hear more details. What do you think about this topic?",
                "Well said! Let's keep the conversation going. Tell me about something you enjoy doing.",
                "Good job expressing yourself! Now, can you ask me a question in English?",
                "Nice work! Your English is improving. Let's continue — tell me about something you did recently.",
                "That's well put! Here's a challenge: can you rephrase what you just said using different words?");
    }

    private String pick(String... options) {
        return options[random.nextInt(options.length)];
    }
}
