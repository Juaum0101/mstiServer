#include <Arduino.h>
#include <ArduinoJson.h>
#include <DNSServer.h>
#include <ESPAsyncWebServer.h>
#include <ESPmDNS.h>
#include <LittleFS.h>
#include <PicoMQTT.h>
#include <WiFi.h>

// --- Dev Mode Credentials -------------------------------------------
// Fill in your home router credentials here for WIFI_AP_STA debugging.
// In production, remove these and revert WiFi.mode() to WIFI_AP.
#define DEV_SSID "jlm"
#define DEV_PASS "Y#4#W#3#.jlm.low"
// ---------------------------------------------------------------------

#include "GameEngine.h"
#include "models.h"

const byte DNS_PORT = 53;
DNSServer dnsServer;
AsyncWebServer server(80);

// Browser clients cannot connect directly to raw TCP;
// We use PicoWebsocket to wrap a WiFiServer on port 8080.
#include <PicoWebsocket.h>
WiFiServer wsServer(8080);
PicoWebsocket::Server<WiFiServer> wsMqtt(wsServer);
PicoMQTT::Server mqtt(wsMqtt);

JsonDocument globalDoc;
FullStatePayload state;
int nextSpawnIndex = 0;

void getSpawnPosition(int index, int max_x, int max_y, int &out_x, int &out_y) {
    int mid_x = max_x / 2;
    int mid_y = max_y / 2;
    // First 4: Corners
    if (index == 0) { out_x = 0; out_y = 0; }
    else if (index == 1) { out_x = 0; out_y = max_y; }
    else if (index == 2) { out_x = max_x; out_y = 0; }
    else if (index == 3) { out_x = max_x; out_y = max_y; }
    // Next 4: Mid edges
    else if (index == 4) { out_x = 0; out_y = mid_y; }
    else if (index == 5) { out_x = mid_x; out_y = max_y; }
    else if (index == 6) { out_x = mid_x; out_y = 0; }
    else if (index == 7) { out_x = max_x; out_y = mid_y; }
    // Next 4: Inner square
    else {
        int offset_x = max_x / 4;
        int offset_y = max_y / 4;
        if (offset_x < 1) offset_x = 1;
        if (offset_y < 1) offset_y = 1;
        if (index == 8) { out_x = mid_x - offset_x; out_y = max_y - offset_y; }
        else if (index == 9) { out_x = mid_x - offset_x; out_y = mid_y - offset_y; }
        else if (index == 10) { out_x = mid_x + offset_x; out_y = max_y - offset_y; }
        else if (index == 11) { out_x = mid_x + offset_x; out_y = mid_y - offset_y; }
        else { out_x = mid_x; out_y = mid_y; } // Center Fallback
    }
}

void initState() {
  state.gameState.phaseId = PhaseId::READY_PHASE; // LOBBY
  state.gameState.turnNumber = 0;
  state.gameState.brokerReady = true;
  state.playerCount = 0;
  nextSpawnIndex = 0;

  for (size_t i = 0; i < MAX_PLAYERS; i++) {
    state.players[i].active = false;
    state.players[i].playerId = "";
    state.players[i].playerName = "";
    state.players[i].position[0] = -1;
    state.players[i].position[1] = -1;
    state.players[i].targetPosition[0] = -1;
    state.players[i].targetPosition[1] = -1;
    state.players[i].isReady = false;
    state.players[i].currentIntent.type = ActionIntentType::NONE;
  }
}

void serializeAndPublishState() {
  mqtt.publish("game/log", String("serializeAndPublishState START, playerCount: ") + state.playerCount);
  for (size_t targetIdx = 0; targetIdx < state.playerCount; targetIdx++) {
    Player &targetPlayer = state.players[targetIdx];
    if (!targetPlayer.active) continue;

    globalDoc.clear();

    JsonObject gs = globalDoc["gameState"].to<JsonObject>();
    gs["phaseId"] = phaseIdToString(state.gameState.phaseId);
    gs["turnNumber"] = state.gameState.turnNumber;
    gs["brokerReady"] = state.gameState.brokerReady;

    JsonObject gc = gs["config"].to<JsonObject>();
    gc["mutationsAllowed"] = state.gameState.config.mutationsAllowed;
    gc["marksActive"] = state.gameState.config.marksActive;
    gc["techniquesEnabled"] = state.gameState.config.techniquesEnabled;
    gc["classVisibility"] = state.gameState.config.classVisibility;
    gc["namesVisible"] = state.gameState.config.namesVisible;
    gc["newbieMode"] = state.gameState.config.newbieMode;
    gc["fogRange"] = state.gameState.config.fogRange;
    gc["perTurnLimit"] = state.gameState.config.perTurnLimit;
    gc["matchTimer"] = state.gameState.config.matchTimer;

    JsonArray turnStatuses = globalDoc["turnStatuses"].to<JsonArray>();
    for (size_t i = 0; i < state.playerCount; i++) {
      if (!state.players[i].active) continue;
      JsonObject ts = turnStatuses.add<JsonObject>();
      ts["name"] = state.players[i].playerName;
      if (state.players[i].isFallen) ts["status"] = "Fallen";
      else if (state.players[i].isReady) ts["status"] = "Ready";
      else ts["status"] = "Choosing";
    }

    JsonArray playersArr = globalDoc["players"].to<JsonArray>();
    for (size_t i = 0; i < state.playerCount; i++) {
      Player &p = state.players[i];
      if (!p.active) continue;

      bool isSelf = (p.playerId == targetPlayer.playerId);

      // Fog of War: check visual range
      if (!isSelf && state.gameState.phaseId != PhaseId::READY_PHASE) {
        int dist = chebyshevDistance(p.position[0], p.position[1], targetPlayer.position[0], targetPlayer.position[1]);
        if (dist > state.gameState.config.fogRange) {
          continue; // Omit entirely
        }
      }

      JsonObject po = playersArr.add<JsonObject>();
      po["playerId"] = p.playerId;
      po["playerName"] = p.playerName;
      po["hp"] = p.hp;
      po["maxHp"] = p.maxHp;

      if (isSelf) {
        po["stamina"] = p.stamina;
        po["staminaInflux"] = p.staminaInflux;

        JsonArray mem = po["activeMemory"].to<JsonArray>();
        for (size_t j = 0; j < p.activeMemoryCount; j++) {
          mem.add(p.activeMemory[j]);
        }

        JsonObject intentObj = po["currentIntent"].to<JsonObject>();
        intentObj["type"] = intentTypeToString(p.currentIntent.type);
        intentObj["targetX"] = p.currentIntent.targetX;
        intentObj["targetY"] = p.currentIntent.targetY;
        intentObj["targetDirection"] = p.currentIntent.targetDirection;
        intentObj["staminaInflux"] = p.currentIntent.staminaInflux;
      } else {
        // Opponent Data (Masking): NEVER broadcast Stamina, Max Stamina, or staminaInflux.
        // Action Resolution: only broadcast Action Name (type).
        if (state.gameState.phaseId == PhaseId::ACTION_RESOLVE || state.gameState.phaseId == PhaseId::MOVEMENT_RESOLVE) {
          JsonObject intentObj = po["currentIntent"].to<JsonObject>();
          intentObj["type"] = intentTypeToString(p.currentIntent.type);
        }
      }

      JsonArray pos = po["position"].to<JsonArray>();
      pos.add(p.position[0]);
      pos.add(p.position[1]);

      JsonArray tpos = po["targetPosition"].to<JsonArray>();
      tpos.add(p.targetPosition[0]);
      tpos.add(p.targetPosition[1]);

      po["facingDirection"] = p.facingDirection;
      po["isTwoHanding"] = p.isTwoHanding;
      po["isExhausted"] = p.isExhausted;
      po["isFallen"] = p.isFallen;
      po["isReady"] = p.isReady;

      JsonObject equip = po["equippedItems"].to<JsonObject>();
      equip["head"] = p.equippedItems.head;
      equip["torso"] = p.equippedItems.torso;
      equip["leftHand"] = p.equippedItems.leftHand;
      equip["rightHand"] = p.equippedItems.rightHand;

      JsonObject mut = po["mutations"].to<JsonObject>();
      mut["hasAny"] = p.mutations.hasAny;
      mut["hasAlpha"] = p.mutations.hasAlpha;
      mut["hasBeta"] = p.mutations.hasBeta;
      po["nextHitCritical"] = p.nextHitCritical;
      po["isReady"] = p.isReady;

    }

    String payload;
    serializeJson(globalDoc, payload);

    String topic = "game/state/" + targetPlayer.playerId;
    mqtt.publish(topic.c_str(), payload.c_str(), 0, true); // QoS 0, retain true
  }
  mqtt.publish("game/log", "serializeAndPublishState COMPLETE.");
}

// resolveTurn is now handled by GameEngine::executeTurn

void setup() {
  Serial.begin(115200);

  if (!LittleFS.begin(true)) {
    Serial.println("An Error has occurred while mounting LittleFS");
  }

  // --- WIFI_AP_STA (Dev Mode) ---
  // Runs the SoftAP (for phone UI testing) and connects to the home
  // router simultaneously so a wired desktop can reach the ESP32.
  WiFi.mode(WIFI_AP_STA);

  // SoftAP: always available at 192.168.4.1
  WiFi.softAP("MSK_Lobby");
  Serial.print("SoftAP IP : ");
  Serial.println(WiFi.softAPIP());

  // STA: connect to home router for desktop debugging access.
  // ESPAsyncWebServer and PicoMQTT bind to all interfaces (0.0.0.0)
  // automatically, so no extra configuration is needed once connected.
  Serial.printf("Connecting to STA network '%s'", DEV_SSID);
  WiFi.begin(DEV_SSID, DEV_PASS);

  // Non-blocking wait: poll with millis() for up to 10 seconds.
  const unsigned long STA_TIMEOUT_MS = 10000;
  const unsigned long staStart = millis();
  while (WiFi.status() != WL_CONNECTED &&
         (millis() - staStart) < STA_TIMEOUT_MS) {
    delay(500); // Acceptable only in setup() before the main loop starts.
    Serial.print('.');
  }
  Serial.println("");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    if (!MDNS.begin("treasureisland")) {
      Serial.println("Error setting up MDNS responder!");
    } else {
      Serial.println("mDNS responder started at treasureisland.local");
      MDNS.addService("http", "tcp", 80);
      MDNS.addService("ws", "tcp", 8080);
    }
  } else {
    Serial.println("[WARN] STA connection timed out. Running AP-only.");
  }

  // Captive Portal DNS: hijacks HTTP on the SoftAP network only.
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  // Setup WebServer
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    AsyncWebServerResponse *response =
        request->beginResponse(LittleFS, "/index.html", "text/html");
    // Instruct browser to unzip the content if the file is compressed
    if (LittleFS.exists("/index.html.gz")) {
      response->addHeader("Content-Encoding", "gzip");
    }
    request->send(response);
  });

  server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

  // Captive Portal Hijack for 404s
  server.onNotFound([](AsyncWebServerRequest *request) {
    request->redirect("http://192.168.4.1/");
  });

  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");

  server.begin();

  // Setup PicoMQTT subscriptions
  mqtt.subscribe("game/join", [](const char *topic, const char *payload) {
    Serial.print("Received join message: ");
    Serial.println(payload);
    globalDoc.clear();
    DeserializationError error = deserializeJson(globalDoc, payload);
    if (error) {
      Serial.print("Failed to parse join message: ");
      Serial.println(error.c_str());
      return;
    }

    String playerId = globalDoc["playerId"] | "";
    if (playerId == "") {
      Serial.println("Invalid player ID");
      return;
    }

    // Find existing or new slot
    Player *p = nullptr;
    for (size_t i = 0; i < MAX_PLAYERS; i++) {
      if (state.players[i].active && state.players[i].playerId == playerId) {
        p = &state.players[i];
        break;
      }
    }

    if (!p) {
      if (state.playerCount >= MAX_PLAYERS) {
        Serial.println("Lobby is full.");
        return;
      }
      // Find first inactive slot
      for (size_t i = 0; i < MAX_PLAYERS; i++) {
        if (!state.players[i].active) {
          p = &state.players[i];
          state.playerCount = std::max(state.playerCount, i + 1);
          break;
        }
      }
    }

    p->playerId = playerId;
    p->playerName = globalDoc["playerName"] | "Unknown";
    p->equippedItems.head = globalDoc["equippedItems"]["head"] | "None";
    p->equippedItems.torso = globalDoc["equippedItems"]["torso"] | "None";
    p->equippedItems.leftHand = globalDoc["equippedItems"]["leftHand"] | "None";
    p->equippedItems.rightHand =
        globalDoc["equippedItems"]["rightHand"] | "None";

    p->mutations.hasAny = globalDoc["mutations"]["hasAny"] | false;
    p->mutations.hasAlpha = globalDoc["mutations"]["hasAlpha"] | false;
    p->mutations.hasBeta = globalDoc["mutations"]["hasBeta"] | false;

    p->isTwoHanding = globalDoc["isTwoHanding"] | false;

    GameEngine::initializePlayer(*p);

    Serial.printf("Player Joined: %s\n", p->playerName.c_str());
    serializeAndPublishState();
  });

  mqtt.subscribe("game/equip", [](const char *topic, const char *payload) {
    globalDoc.clear();
    DeserializationError error = deserializeJson(globalDoc, payload);
    if (error)
      return;

    String playerId = globalDoc["playerId"] | "";
    if (playerId == "")
      return;

    for (size_t i = 0; i < state.playerCount; i++) {
      if (state.players[i].active && state.players[i].playerId == playerId) {
        Player &p = state.players[i];
        p.equippedItems.head = globalDoc["head"] | p.equippedItems.head;
        p.equippedItems.torso = globalDoc["torso"] | p.equippedItems.torso;
        p.equippedItems.leftHand =
            globalDoc["leftHand"] | p.equippedItems.leftHand;
        p.equippedItems.rightHand =
            globalDoc["rightHand"] | p.equippedItems.rightHand;

        p.isTwoHanding =
            (p.equippedItems.leftHand != "None" &&
             p.equippedItems.leftHand == p.equippedItems.rightHand);

        Serial.printf("Player %s updated equipment.\n", p.playerName.c_str());
        serializeAndPublishState();
        break;
      }
    }
  });

  mqtt.subscribe("lobby/config", [](const char *topic, const char *payload) {
    globalDoc.clear();
    DeserializationError error = deserializeJson(globalDoc, payload);
    if (error) return;

    state.gameState.config.mutationsAllowed = globalDoc["mutationsAllowed"] | state.gameState.config.mutationsAllowed;
    state.gameState.config.marksActive = globalDoc["marksActive"] | state.gameState.config.marksActive;
    state.gameState.config.techniquesEnabled = globalDoc["techniquesEnabled"] | state.gameState.config.techniquesEnabled;
    state.gameState.config.classVisibility = globalDoc["classVisibility"] | state.gameState.config.classVisibility;
    state.gameState.config.namesVisible = globalDoc["namesVisible"] | state.gameState.config.namesVisible;
    state.gameState.config.newbieMode = globalDoc["newbieMode"] | state.gameState.config.newbieMode;
    state.gameState.config.fogRange = globalDoc["fogRange"] | state.gameState.config.fogRange;
    state.gameState.config.perTurnLimit = globalDoc["perTurnLimit"] | state.gameState.config.perTurnLimit;
    state.gameState.config.matchTimer = globalDoc["matchTimer"] | state.gameState.config.matchTimer;

    Serial.println("Lobby config updated.");
    serializeAndPublishState();
  });

  mqtt.subscribe("lobby/vote", [](const char *topic, const char *payload) {
    Serial.print("Received vote message: ");
    globalDoc.clear();
    DeserializationError error = deserializeJson(globalDoc, payload);
    if (error) return;

    String playerId = globalDoc["playerId"] | "";
    bool ready = globalDoc["ready"] | false;

    if (playerId == "") return;

    for (size_t i = 0; i < state.playerCount; i++) {
      if (state.players[i].active && state.players[i].playerId == playerId) {
        state.players[i].isReady = ready;
        if (ready && state.players[i].position[0] == -1 && nextSpawnIndex < 8) {
           int out_x, out_y;
           getSpawnPosition(nextSpawnIndex, 8, 8, out_x, out_y);
           state.players[i].position[0] = out_x;
           state.players[i].position[1] = out_y;
           nextSpawnIndex++;
        }
        Serial.printf("Player %s is %s.\n", state.players[i].playerName.c_str(), ready ? "ready" : "not ready");
        break;
      }
    }

    bool allReady = true;
    int activeCount = 0;
    for (size_t i = 0; i < state.playerCount; i++) {
      if (state.players[i].active) {
        activeCount++;
        if (!state.players[i].isReady) {
          allReady = false;
        }
      }
    }

    if (allReady && activeCount > 0 && state.gameState.phaseId == PhaseId::READY_PHASE) {
      state.gameState.phaseId = PhaseId::MOVEMENT_CHOICE;
      state.gameState.turnNumber = 1;
      for (size_t i = 0; i < MAX_PLAYERS; i++) {
        if (state.players[i].active) {
          state.players[i].isReady = false;
          if (state.players[i].position[0] == -1) {
             int out_x, out_y;
             getSpawnPosition(nextSpawnIndex, 8, 8, out_x, out_y);
             state.players[i].position[0] = out_x;
             state.players[i].position[1] = out_y;
             if (nextSpawnIndex < 8) nextSpawnIndex++;
          }
          state.players[i].targetPosition[0] = state.players[i].position[0];
          state.players[i].targetPosition[1] = state.players[i].position[1];
          state.players[i].facingDirection = "N";
        }
      }
      Serial.println("All players ready. Match Started!");
    }

    serializeAndPublishState();
  });

  mqtt.subscribe("game/admin", [](const char *topic, const char *payload) {
    mqtt.publish("game/log", String("Received admin payload: ") + payload);
    globalDoc.clear();
    DeserializationError error = deserializeJson(globalDoc, payload);
    if (error) {
      mqtt.publish("game/log", String("deserializeJson() failed: ") + error.c_str());
      return;
    }

    String command = globalDoc["command"] | "";
    mqtt.publish("game/log", String("Command parsed: ") + command);

    if (command == "START_MATCH") {
      mqtt.publish("game/log", String("Phase check: ") + phaseIdToString(state.gameState.phaseId));
    }

    if (command == "START_MATCH" &&
        state.gameState.phaseId == PhaseId::READY_PHASE) {
      mqtt.publish("game/log", "Entering START_MATCH block...");
      state.gameState.phaseId = PhaseId::MOVEMENT_CHOICE;
      state.gameState.turnNumber = 1;

      for (size_t i = 0; i < MAX_PLAYERS; i++) {
        if (state.players[i].active) {
          state.players[i].isReady = false;
          // Set target position equal to their assigned spawn position
          if (state.players[i].position[0] == -1) {
             int out_x, out_y;
             getSpawnPosition(nextSpawnIndex, 8, 8, out_x, out_y);
             state.players[i].position[0] = out_x;
             state.players[i].position[1] = out_y;
             if (nextSpawnIndex < 8) nextSpawnIndex++;
          }
          state.players[i].targetPosition[0] = state.players[i].position[0];
          state.players[i].targetPosition[1] = state.players[i].position[1];
          // Default facing
          state.players[i].facingDirection = "N";
        }
      }
      mqtt.publish("game/log", "Positions assigned. Serializing...");
      Serial.println("Match Started!");
      serializeAndPublishState();
      mqtt.publish("game/log", "START_MATCH complete.");
    } else if (command == "RESET_GAME") {
      initState();
      Serial.println("Game Reset to Lobby.");
      serializeAndPublishState();
    }
  });

  mqtt.subscribe("game/action", [](const char *topic, const char *payload) {
    globalDoc.clear();
    DeserializationError error = deserializeJson(globalDoc, payload);
    if (error) {
      Serial.println("JSON Parse Error");
      return;
    }

    // Only accept actions during CHOICE phases
    if (state.gameState.phaseId != PhaseId::MOVEMENT_CHOICE && state.gameState.phaseId != PhaseId::ACTION_CHOICE)
      return;

    // Parse intent payload
    String playerId = globalDoc["playerId"] | "P1";
    String actionType = globalDoc["type"] | "NONE";

    Player *p = nullptr;
    for (size_t i = 0; i < state.playerCount; i++) {
      if (state.players[i].playerId == playerId) {
        p = &state.players[i];
        break;
      }
    }

    if (!p) {
      Serial.printf("Intent received for unknown player %s\n",
                    playerId.c_str());
      return;
    }

    actionType.toUpperCase();
    if (actionType == "ATTACK_LIGHT")
      p->currentIntent.type = ActionIntentType::ATTACK_LIGHT;
    else if (actionType == "ATTACK_HEAVY")
      p->currentIntent.type = ActionIntentType::ATTACK_HEAVY;
    else if (actionType == "DEFEND")
      p->currentIntent.type = ActionIntentType::DEFEND;
    else if (actionType == "DODGE")
      p->currentIntent.type = ActionIntentType::DODGE;
    else if (actionType == "BREATHE")
      p->currentIntent.type = ActionIntentType::BREATHE;
    else if (actionType == "MOVEMENT" || actionType == "MOVE")
      p->currentIntent.type = ActionIntentType::MOVE;
    else
      p->currentIntent.type = ActionIntentType::NONE;

    p->currentIntent.targetX = globalDoc["targetX"] | 0;
    p->currentIntent.targetY = globalDoc["targetY"] | 0;
    p->currentIntent.targetDirection = globalDoc["targetDirection"] | "";
    p->currentIntent.staminaInflux = globalDoc["staminaInflux"] | 0;

    p->isReady = true;
    Serial.printf("Player %s Intent received: %s (x:%d, y:%d)\n",
                  p->playerId.c_str(), actionType.c_str(),
                  p->currentIntent.targetX, p->currentIntent.targetY);
  });

  mqtt.subscribe("game/sync", [](const char *topic, const char *payload) {
    Serial.println("Client requested state sync.");
    serializeAndPublishState();
  });

  // Start the underlying WebSocket server and PicoMQTT broker
  wsMqtt.begin();
  mqtt.begin();

  initState();
  Serial.println("System Initialized. Serving MSK_Lobby SoftAP.");
}

void loop() {
  // Non-blocking handlers
  dnsServer.processNextRequest();
  mqtt.loop();

  // Synchronous Polled Phase Check
  if (state.gameState.phaseId == PhaseId::MOVEMENT_CHOICE || state.gameState.phaseId == PhaseId::ACTION_CHOICE) {
    bool allReady = true;
    int activeCount = 0;
    for (size_t i = 0; i < state.playerCount; i++) {
      if (state.players[i].active) {
        activeCount++;
        if (!state.players[i].isReady) {
          allReady = false;
          break;
        }
      }
    }

    if (allReady && activeCount > 0) {
      if (state.gameState.phaseId == PhaseId::MOVEMENT_CHOICE) {
        GameEngine::executeMovementPhase(state);
      } else {
        GameEngine::executeActionPhase(state);
      }
      serializeAndPublishState();
    }
  }
}
