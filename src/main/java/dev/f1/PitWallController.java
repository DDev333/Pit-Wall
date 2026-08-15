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
            String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

            // Safe parsing of all 15 variables
            int currentLap = Integer.parseInt(String.valueOf(requestPayload.getOrDefault("currentLap", "35")));
            int tireAge = Integer.parseInt(String.valueOf(requestPayload.getOrDefault("tireAge", "16")));
            String tireCompound = String.valueOf(requestPayload.getOrDefault("tireCompound", "Medium"));
            String weatherCondition = String.valueOf(requestPayload.getOrDefault("weatherCondition", "Dry"));
            double trackTemperature = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("trackTemperature", "38.0")));
            String trackOvertakingDifficulty = String.valueOf(requestPayload.getOrDefault("trackOvertakingDifficulty", "Medium"));
            double lapTimeDelta = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("lapTimeDelta", "0.0")));
            double gapToCarAhead = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("gapToCarAhead", "2.5")));
            double gapToCarBehind = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("gapToCarBehind", "5.0")));
            String rivalTireCompound = String.valueOf(requestPayload.getOrDefault("rivalTireCompound", "Hard"));
            String driverTireManagementSkill = String.valueOf(requestPayload.getOrDefault("driverTireManagementSkill", "Standard"));
            String projectedPitExitTraffic = String.valueOf(requestPayload.getOrDefault("projectedPitExitTraffic", "Clean Air"));
            boolean safetyCar = Boolean.parseBoolean(String.valueOf(requestPayload.getOrDefault("safetyCarDeployed", "false")));
            boolean mandatoryCompoundFulfilled = Boolean.parseBoolean(String.valueOf(requestPayload.getOrDefault("mandatoryCompoundFulfilled", "false")));
            double pitLaneTimeLoss = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("pitLaneTimeLoss", "22.0")));

            String prompt = String.format(
                "You are an elite Formula 1 race strategist. Analyze the data and decide to 'Box' or 'Stay Out'.\n" +
                "RACE LOGIC RULES: \n" +
                "1. Degradation: Dry limits are Soft=15, Medium=25, Hard=40 laps. If track temp > 40C, reduce lifespan by 3 laps. If driver skill is 'Elite', extend by 3 laps.\n" +
                "2. Lap Time Delta: If lapTimeDelta is >= +1.5s, the tire cliff is reached. MUST pit.\n" +
                "3. Mandatory Compound: If it is past lap 65 of 70 and mandatoryCompoundFulfilled is false, MUST pit.\n" +
                "4. Weather: If tire doesn't match weather (e.g., slicks in rain), MUST pit.\n" +
                "5. Defensive Undercut: If gapToCarBehind < 2.0s and tire age > 10, Box to defend.\n" +
                "6. Offensive Undercut: If gapToCarAhead < 1.5s, our tire is older than rivalTireCompound, and trackOvertakingDifficulty is 'High', Box to undercut.\n" +
                "7. Pit Loss & Traffic: Use the provided pitLaneTimeLoss to calculate track position. Avoid pitting into 'DRS Train' unless safety car is deployed.\n" +
                "8. Safety Car: Reduces pit loss. Favorable for pitting if tires are older than 50%% of their life.\n" +
                "INPUTS:\n" +
                "Lap: %d/70 | Tire Age: %d | Compound: %s | Weather: %s | Track Temp: %.1fC | Overtake Diff: %s\n" +
                "Lap Delta: %+.1fs | Gap Ahead: %.1fs | Gap Behind: %.1fs | Rival Tire: %s | Driver Skill: %s\n" +
                "Pit Exit Traffic: %s | Safety Car: %b | Mandatory Used: %b | Pit Loss: %.1fs\n",
                currentLap, tireAge, tireCompound, weatherCondition, trackTemperature, trackOvertakingDifficulty,
                lapTimeDelta, gapToCarAhead, gapToCarBehind, rivalTireCompound, driverTireManagementSkill,
                projectedPitExitTraffic, safetyCar, mandatoryCompoundFulfilled, pitLaneTimeLoss
            );

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));

            Map<String, Object> responseSchema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                    "decision", Map.of("type", "STRING", "enum", List.of("Box", "Stay Out")),
                    "reasoning", Map.of("type", "STRING", "description", "Professional strategic explanation addressing the new variables like track temp, lap delta, or overtake difficulty."),
                    "foundryCitation", Map.of("type", "STRING", "description", "A realistic telemetry metric or FIA sporting regulation.")
                ),
                "required", List.of("decision", "reasoning", "foundryCitation")
            );

            Map<String, Object> generationConfig = Map.of(
                "responseMimeType", "application/json",
                "responseSchema", responseSchema,
                "temperature", 0.1
            );

            Map<String, Object> body = Map.of("contents", List.of(content), "generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            Map<String, Object> apiResponse = restTemplate.postForObject(geminiUrl, request, Map.class);
            
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) apiResponse.get("candidates");
            String jsonResult = (String) ((List<Map<String, Object>>) ((Map<String, Object>) candidates.get(0).get("content")).get("parts")).get(0).get("text");
            jsonResult = jsonResult.replace("```json", "").replace("```", "").trim();

            return ResponseEntity.ok(objectMapper.readValue(jsonResult, Map.class));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of("decision", "Stay Out", "reasoning", "Backend error: " + e.getMessage(), "foundryCitation", "Error Code 500"));
        }
    }
}