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

            // Core Telemetry & Guide Parameters
            int currentLap = Integer.parseInt(String.valueOf(requestPayload.getOrDefault("currentLap", "35")));
            int totalLaps = Integer.parseInt(String.valueOf(requestPayload.getOrDefault("totalLaps", "70")));
            int remainingLaps = Math.max(0, totalLaps - currentLap);
            int tireAge = Integer.parseInt(String.valueOf(requestPayload.getOrDefault("tireAge", "16")));
            String tireCompound = String.valueOf(requestPayload.getOrDefault("tireCompound", "Medium"));
            String tyreDegradationRate = String.valueOf(requestPayload.getOrDefault("tyreDegradationRate", "Medium"));
            int tyreWarmUpLaps = Integer.parseInt(String.valueOf(requestPayload.getOrDefault("tyreWarmUpLaps", "1")));
            
            String weatherCondition = String.valueOf(requestPayload.getOrDefault("weatherCondition", "Dry"));
            double trackTemperature = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("trackTemperature", "38.0")));
            String trackOvertakingDifficulty = String.valueOf(requestPayload.getOrDefault("trackOvertakingDifficulty", "Medium"));
            double pitLaneTimeLoss = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("pitLaneTimeLoss", "22.0")));
            String pitStopExecutionRisk = String.valueOf(requestPayload.getOrDefault("pitStopExecutionRisk", "Low"));
            
            double lapTimeDelta = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("lapTimeDelta", "0.0")));
            double gapToCarAhead = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("gapToCarAhead", "2.5")));
            double gapToCarBehind = Double.parseDouble(String.valueOf(requestPayload.getOrDefault("gapToCarBehind", "5.0")));
            String currentAirState = String.valueOf(requestPayload.getOrDefault("currentAirState", "Clean Air"));
            String projectedPitExitTraffic = String.valueOf(requestPayload.getOrDefault("projectedPitExitTraffic", "Clean Air"));
            
            String rivalTireCompound = String.valueOf(requestPayload.getOrDefault("rivalTireCompound", "Hard"));
            boolean rivalHasPitted = Boolean.parseBoolean(String.valueOf(requestPayload.getOrDefault("rivalHasPitted", "false")));
            String driverTireManagementSkill = String.valueOf(requestPayload.getOrDefault("driverTireManagementSkill", "Standard"));
            boolean safetyCar = Boolean.parseBoolean(String.valueOf(requestPayload.getOrDefault("safetyCarDeployed", "false")));
            boolean mandatoryCompoundFulfilled = Boolean.parseBoolean(String.valueOf(requestPayload.getOrDefault("mandatoryCompoundFulfilled", "true")));

            String prompt = String.format(
                "You are an elite Formula 1 Chief Race Strategist on the Pit Wall.\n" +
                "Evaluate the race scenario using complete strategic trade-off modeling (Pit Loss vs Fresh Tyre Pace Delta vs Track Position):\n\n" +
                "CORE STRATEGIC PRINCIPLES:\n" +
                "1. TIME DELTA VS REMAINING LAPS: A pit stop costs %.1fs (reduced under Safety Car/VSC). With %d laps remaining, calculate whether the fresh-tyre pace advantage will overcome this loss before the checkered flag.\n" +
                "2. UNDERCUT MECHANIC: Trigger 'Box' if trailing a rival within undercut range (gapToCarAhead < 2.5s), current tyres are degrading, projected pit exit is 'Clean Air', and tyre warm-up is low (<=1 lap).\n" +
                "3. OVERCUT MECHANIC: If rivalHasPitted is TRUE, our currentAirState is 'Clean Air', tyre degradation is manageable, and our lapTimeDelta is strong (<= +0.5s), trigger 'Stay Out' to overcut.\n" +
                "4. TYRE DEGRADATION & CLIFF: Compound limits (Soft=15, Med=25, Hard=40). If tyreDegradationRate is 'High' or trackTemp > 40C, accelerate wear by 4 laps. If lapTimeDelta >= +1.5s, tyre cliff reached: MUST Box.\n" +
                "5. TYRE WARM-UP PENALTY: If tyreWarmUpLaps >= 2 (e.g. hard compound on cool track), discount undercut power and favor staying out.\n" +
                "6. TRAFFIC & TRACK POSITION: If trackOvertakingDifficulty is 'High' (e.g., Monaco/Hungaroring) and projected exit is 'DRS Train', DO NOT BOX unless tyres are at catastrophic wear or under Safety Car.\n" +
                "7. REGULATORY COMPLIANCE: If remaining laps <= 5 and mandatoryCompoundFulfilled is FALSE, MUST return 'Box'.\n" +
                "8. SAFETY CAR / VSC: Neutralization halves pit loss. Strongly favor pitting if tyres > 40%% worn.\n\n" +
                "LIVE TELEMETRY:\n" +
                "- Lap: %d / %d (%d laps remaining)\n" +
                "- Tyre: %s (Age: %d laps, Deg Rate: %s, Warm-Up: %d laps)\n" +
                "- Weather: %s | Track Temp: %.1f°C | Overtaking Difficulty: %s\n" +
                "- Delta to Optimal Lap Time: %+.1fs | Current Track Air: %s\n" +
                "- Gap Ahead: %.1fs | Gap Behind: %.1fs | Pit Exit: %s\n" +
                "- Rival Compound: %s | Rival Has Pitted: %b\n" +
                "- Driver Skill: %s | Pit Execution Risk: %s | Base Pit Loss: %.1fs\n" +
                "- Safety Car: %b | Mandatory Compound Used: %b\n\n" +
                "Return strategic decision and concise reasoning citing the specific governing trade-off.",
                pitLaneTimeLoss, remainingLaps,
                currentLap, totalLaps, remainingLaps,
                tireCompound, tireAge, tyreDegradationRate, tyreWarmUpLaps,
                weatherCondition, trackTemperature, trackOvertakingDifficulty,
                lapTimeDelta, currentAirState,
                gapToCarAhead, gapToCarBehind, projectedPitExitTraffic,
                rivalTireCompound, rivalHasPitted,
                driverTireManagementSkill, pitStopExecutionRisk, pitLaneTimeLoss,
                safetyCar, mandatoryCompoundFulfilled
            );

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));

            Map<String, Object> responseSchema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                    "decision", Map.of("type", "STRING", "enum", List.of("Box", "Stay Out")),
                    "reasoning", Map.of("type", "STRING", "description", "Strategic rationale detailing undercut/overcut calculations, degradation rate, tyre warm-up, traffic delta, or lap loss trade-offs."),
                    "foundryCitation", Map.of("type", "STRING", "description", "Realistic telemetry metric or FIA sporting regulation citation.")
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
                "reasoning", "Strategy computation error: " + e.getMessage(),
                "foundryCitation", "Error Code 500"
            ));
        }
    }
}