#include <Arduino.h>
#include <ArduinoJson.h>
#include <DNSServer.h>
#include <ESPAsyncWebServer.h>
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

void initState() {
  state.gameState.phaseId = PhaseId::READY_PHASE; // LOBBY
  state.gameState.turnNumber = 0;
  state.gameState.brokerReady = true;
  state.playerCount = 0;

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

  JsonArray playersArr = globalDoc["players"].to<JsonArray>();
  for (size_t i = 0; i < state.playerCount; i++) {
    Player &p = state.players[i];
    if (!p.active)
      continue;

    JsonObject po = playersArr.add<JsonObject>();
    po["playerId"] = p.playerId;
    po["playerName"] = p.playerName;
    po["hp"] = p.hp;
    po["maxHp"] = p.maxHp;
    po["stamina"] = p.stamina;
    po["staminaInflux"] = p.staminaInflux;

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
    po["nextHitCritical"] = p.nextHitCritical;
    po["isReady"] = p.isReady;

    JsonObject eq = po["equippedItems"].to<JsonObject>();
    eq["head"] = p.equippedItems.head;
    eq["torso"] = p.equippedItems.torso;
    eq["leftHand"] = p.equippedItems.leftHand;
    eq["rightHand"] = p.equippedItems.rightHand;

    JsonArray mem = po["activeMemory"].to<JsonArray>();
    for (size_t j = 0; j < p.activeMemoryCount; j++) {
      mem.add(p.activeMemory[j]);
    }
  }

  String payload;
  serializeJson(globalDoc, payload);

  Serial.print("Publishing state: ");
  Serial.println(payload);
  mqtt.publish("game/state", payload.c_str(), 0, true); // QoS 0, retain true
  Serial.println("State published");
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
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[DEV] STA IP  : ");
    Serial.println(WiFi.localIP()); // <-- Copy this IP for desktop testing
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
        Serial.printf("Player %s is %s.\n", state.players[i].playerName.c_str(), ready ? "ready" : "not ready");
        serializeAndPublishState();
        break;
      }
    }
  });

  mqtt.subscribe("game/admin", [](const char *topic, const char *payload) {
    globalDoc.clear();
    DeserializationError error = deserializeJson(globalDoc, payload);
    if (error)
      return;

    String command = globalDoc["command"] | "";
    if (command == "START_MATCH" &&
        state.gameState.phaseId == PhaseId::READY_PHASE) {
      state.gameState.phaseId = PhaseId::ACTION_PHASE;
      state.gameState.turnNumber = 1;

      // Assign starting grid positions based on active players
      int startCoords[4][2] = {{4, 8}, {4, 0}, {0, 4}, {8, 4}};
      String startFacing[4] = {"N", "S", "E", "W"};

      int spawnIdx = 0;
      for (size_t i = 0; i < MAX_PLAYERS; i++) {
        if (state.players[i].active) {
          state.players[i].position[0] = startCoords[spawnIdx][0];
          state.players[i].position[1] = startCoords[spawnIdx][1];
          state.players[i].targetPosition[0] = startCoords[spawnIdx][0];
          state.players[i].targetPosition[1] = startCoords[spawnIdx][1];
          state.players[i].facingDirection = startFacing[spawnIdx];
          spawnIdx++;
        }
      }
      Serial.println("Match Started!");
      serializeAndPublishState();
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

    // Only accept actions during ACTION_PHASE
    if (state.gameState.phaseId != PhaseId::ACTION_PHASE)
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
  if (state.gameState.phaseId == PhaseId::ACTION_PHASE) {
    bool allReady = true;
    for (size_t i = 0; i < state.playerCount; i++) {
      if (state.players[i].active && !state.players[i].isReady) {
        allReady = false;
        break;
      }
    }

    if (allReady) {
      state.gameState.phaseId = PhaseId::RESOLUTION_PHASE;
      GameEngine::executeTurn(
          state); // Synchronous resolution avoiding race conditions
      serializeAndPublishState();
    }
  }
}
