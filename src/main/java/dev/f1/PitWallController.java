package dev.f1;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PitWallController {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/strategy")
    public ResponseEntity<Map<String, Object>> calculateStrategy(@RequestBody Map<String, Object> requestPayload) {
        try {
            // Dynamically construct endpoint with the injected environment variable
            String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

            // Safe parsing using String.valueOf to avoid null pointer/conversion crashes
            int currentLap = Integer.parseInt(String.valueOf(requestPayload.getOrDefault("currentLap", "0")));
            int tireAge = Integer.parseInt(String.valueOf(requestPayload.getOrDefault("tireAge", "0")));
            boolean safetyCar = Boolean.parseBoolean(String.valueOf(requestPayload.getOrDefault("safetyCarDeployed", "false")));
            String tireCompound = String.valueOf(requestPayload.getOrDefault("tireCompound", "Medium"));
            String weatherCondition = String.valueOf(requestPayload.getOrDefault("weatherCondition", "Dry"));
            double gapToCarBehind = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("gapToCarBehind", "5.0")));
            String projectedPitExitTraffic = String.valueOf(requestPayload.getOrDefault("projectedPitExitTraffic", "Clean Air"));

            // Prompt defining strategic and mathematical rules
            String prompt = String.format(
                "You are an elite Formula 1 race strategist. " +
                "RACE LOGIC RULES: \n" +
                "1. Pit stop times: Green flag = 22 seconds. Safety Car = 12 seconds.\n" +
                "2. Dry Tire critical degradation thresholds: Soft = 15 laps, Medium = 25 laps, Hard = 40 laps. Tires older than this under Green Flag MUST pit.\n" +
                "3. Weather rules: If 'Light Rain', optimal tire is Intermediate. If 'Heavy Rain', optimal tire is Wet. If 'Dry', optimal tire is Soft/Medium/Hard. If the current tire does not match the weather condition, MUST pit immediately.\n" +
                "4. UNDERCUT DEFENSE: If gapToCarBehind is less than 2.0 seconds, and tire age is > 10 laps, MUST return 'Box' to prevent the undercut, regardless of other rules.\n" +
                "5. TRAFFIC PENALTY: If projectedPitExitTraffic is 'DRS Train', DO NOT PIT (return 'Stay Out') to avoid dirty air, UNLESS tires have reached critical degradation thresholds.\n" +
                "6. Safety Car advantage: If a Safety Car is deployed and the current tires are within 5 laps of their degradation threshold, SHOULD pit.\n" +
                "7. In all other scenarios, Stay Out to maintain track position.\n" +
                "INPUTS:\n" +
                "- Current Lap: %d\n" +
                "- Tire Age: %d laps\n" +
                "- Current Tire: %s\n" +
                "- Weather: %s\n" +
                "- Safety Car Deployed: %b\n" +
                "- Gap to Car Behind: %.1f seconds\n" +
                "- Pit Exit Traffic: %s\n" +
                "Calculate the strategy based strictly on these rules.",
                currentLap, tireAge, tireCompound, weatherCondition, safetyCar, gapToCarBehind, projectedPitExitTraffic
            );

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));

            // Enforce schema format on model output
            Map<String, Object> responseSchema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                    "decision", Map.of("type", "STRING", "enum", List.of("Box", "Stay Out")),
                    "reasoning", Map.of("type", "STRING", "description", "A data-driven explanation citing the specific tire compound's lap limit, weather crossover, undercut threat, or traffic penalty."),
                    "foundryCitation", Map.of("type", "STRING", "description", "A fake but highly realistic FIA rule or Pirelli telemetry metric citation.")
                ),
                "required", List.of("decision", "reasoning", "foundryCitation")
            );

            Map<String, Object> generationConfig = Map.of(
                "responseMimeType", "application/json",
                "responseSchema", responseSchema,
                "temperature", 0.1
            );

            Map<String, Object> body = Map.of(
                "contents", List.of(content),
                "generationConfig", generationConfig
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            Map<String, Object> apiResponse = restTemplate.postForObject(geminiUrl, request, Map.class);

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) apiResponse.get("candidates");
            Map<String, Object> firstCandidate = candidates.get(0);
            Map<String, Object> contentObj = (Map<String, Object>) firstCandidate.get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) contentObj.get("parts");
            String jsonResult = (String) parts.get(0).get("text");

            jsonResult = jsonResult.replace("```json", "").replace("```", "").trim();

            return ResponseEntity.ok(objectMapper.readValue(jsonResult, Map.class));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of(
                "decision", "Stay Out",
                "reasoning", "Backend processing error: " + e.getMessage(),
                "foundryCitation", "Error Code 500"
            ));
        }
    }
}