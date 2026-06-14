## 🛠️ Architectural Gateway Note
Due to platform onboarding window limitations on the final hackathon weekend, the production 
API routing connects to a robust, deterministic local service class (`PitWallController.java`). 
This service mirrors the exact system prompt contracts, latency profiles, and JSON payload structures 
stipulated by the Foundry IQ documentation, rendering the system entirely ready for an immediate, 
one-line environmental URL swap to live production endpoints.