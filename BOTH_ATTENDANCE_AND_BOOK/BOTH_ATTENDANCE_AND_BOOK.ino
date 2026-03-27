#include <SPI.h>
#include <MFRC522.h>
#include <WiFiS3.h>

// ─── Pin Config ───────────────────────────────────────────────────────────────
#define RST_PIN 9
#define SS_PIN  10

// ─── Network Config ───────────────────────────────────────────────────────────
const char* ssid       = "DHAROO'S23";
const char* password   = "12345678";
const char* serverIP   = "10.207.80.102";
const int   serverPort = 5000;

// ─── Card Type Detection Strings ─────────────────────────────────────────────
// Matches the actual prefix written on your NFC cards
const String STUDENT_MARKER = "Student Details";
const String BOOK_MARKER    = "Book Details";

// ─── State Machine ────────────────────────────────────────────────────────────
enum ScanState { IDLE, WAITING_SECOND };

ScanState     currentState  = IDLE;
String        firstScanData = "";
unsigned long firstScanTime = 0;
const unsigned long SCAN_TIMEOUT = 10000; // 10 seconds to complete second scan

MFRC522 mfrc522(SS_PIN, RST_PIN);

// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();

  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi!");
  Serial.println("Ready. Scan a Student ID card to begin.");
}

// ─────────────────────────────────────────────────────────────────────────────
void loop() {

  // ── Timeout: reset if second scan takes too long ──────────────────────────
  if (currentState == WAITING_SECOND &&
      millis() - firstScanTime > SCAN_TIMEOUT) {
    Serial.println("[TIMEOUT] No second scan detected. Resetting.");
    currentState  = IDLE;
    firstScanData = "";
  }

  // ── Wait for a new card ───────────────────────────────────────────────────
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // ── Read NFC data from card ───────────────────────────────────────────────
  String scannedData = readNFCData();

  if (scannedData.length() == 0) {
    Serial.println("[INFO] No readable data on card. Try again.");
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(1500);
    return;
  }

  Serial.print("[SCAN] Raw Data: ");
  Serial.println(scannedData);

  // ── Identify card type ────────────────────────────────────────────────────
  if (!isStudentCard(scannedData) && !isBookCard(scannedData)) {
    Serial.println("[WARN] Unrecognized card type. Card must start with");
    Serial.println("       'Student Details' or 'Book Details'.");
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(1500);
    return;
  }

  // ── State machine logic ───────────────────────────────────────────────────
  switch (currentState) {

    // ── IDLE: Expecting a Student card first ────────────────────────────────
    case IDLE:
      if (isStudentCard(scannedData)) {
        firstScanData = scannedData;
        firstScanTime = millis();
        currentState  = WAITING_SECOND;
        Serial.println("[STATE] Student card captured.");
        Serial.println("        Now scan another Student card (Attendance)");
        Serial.println("        or a Book card (Borrow / Return).");
      } else {
        // Book scanned first — not allowed
        Serial.println("[WARN] Please scan a Student card first.");
      }
      break;

    // ── WAITING_SECOND: Decide action based on second card ──────────────────
    case WAITING_SECOND:

      // Guard: ignore if same card scanned again
      if (scannedData == firstScanData) {
        Serial.println("[WARN] Same card scanned again. Waiting for a different card...");
        break;
      }

      if (isStudentCard(scannedData)) {
        // ── Student + Student → ATTENDANCE ──────────────────────────────────
        /*
          POST /attendance
          {
            "nfc_data_1": "Student Details Name: ... Roll-no: ...",
            "nfc_data_2": "Student Details Name: ... Roll-no: ..."
          }
        */
        Serial.println("[ACTION] Two Student cards → Marking ATTENDANCE");
        sendAttendance(firstScanData, scannedData);

      } else if (isBookCard(scannedData)) {
        // ── Student + Book → BORROW / RETURN ────────────────────────────────
        /*
          POST /library
          {
            "nfc_data":      "Student Details Name: ... Roll-no: ...",
            "nfc_book_data": "Book Details book_id: ... title: ..."
          }
        */
        Serial.println("[ACTION] Student card + Book card → BORROW / RETURN");
        sendLibrary(firstScanData, scannedData);
      }

      // Reset for next interaction
      currentState  = IDLE;
      firstScanData = "";
      break;
  }

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  delay(2000);
}

// ─── Read printable ASCII from NFC card blocks ────────────────────────────────
String readNFCData() {
  String data = "";
  byte buffer[18];
  byte size = sizeof(buffer);

  for (byte block = 6; block <= 30; block++) {
    if (mfrc522.MIFARE_Read(block, buffer, &size) == MFRC522::STATUS_OK) {
      for (byte i = 1; i < 5; i++) {
        if (buffer[i] >= 32 && buffer[i] <= 126) {
          data += (char)buffer[i];
        }
      }
    }
  }
  data.trim();
  return data;
}

// ─── Card type checks ─────────────────────────────────────────────────────────
bool isStudentCard(const String& data) {
  return data.startsWith(STUDENT_MARKER);
  // e.g. "Student Details Name: Dharun Prakash J A Department: Al & DS Roll-no: 22AD063"
}

bool isBookCard(const String& data) {
  return data.startsWith(BOOK_MARKER);
  // e.g. "Book Details book_id: \"BK001\" title: \"The Great Gatsby\" ..."
}

// ─── JSON escape helper ───────────────────────────────────────────────────────
String escapeJson(const String& data) {
  String out = "";
  for (unsigned int i = 0; i < data.length(); i++) {
    char c = data.charAt(i);
    if      (c == '"')  out += "\\\"";
    else if (c == '\\') out += "\\\\";
    else if (c == '\n') out += "\\n";
    else if (c == '\r') out += "\\r";
    else                out += c;
  }
  return out;
}

// ─── POST /attendance ─────────────────────────────────────────────────────────
void sendAttendance(String studentData1, String studentData2) {
  String payload = "{\"nfc_data_1\":\"" + escapeJson(studentData1) +
                   "\",\"nfc_data_2\":\"" + escapeJson(studentData2) + "\"}";
  sendHTTPPost("/attendance", payload);
}

// ─── POST /library ────────────────────────────────────────────────────────────
void sendLibrary(String studentData, String bookData) {
  String payload = "{\"nfc_data\":\"" + escapeJson(studentData) +
                   "\",\"nfc_book_data\":\"" + escapeJson(bookData) + "\"}";
  sendHTTPPost("/library", payload);
}

// ─── Generic HTTP POST ────────────────────────────────────────────────────────
void sendHTTPPost(const String& endpoint, const String& payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] Wi-Fi not connected!");
    return;
  }

  WiFiClient client;
  Serial.print("[NET] Connecting to ");
  Serial.print(serverIP); Serial.print(":"); Serial.println(serverPort);

  if (!client.connect(serverIP, serverPort)) {
    Serial.println("[ERROR] Connection failed! Check IP/port.");
    return;
  }

  client.println("POST " + endpoint + " HTTP/1.1");
  client.println("Host: " + String(serverIP));
  client.println("Content-Type: application/json");
  client.println("Connection: close");
  client.print("Content-Length: ");
  client.println(payload.length());
  client.println();
  client.println(payload);

  Serial.print("[NET] Payload → "); Serial.println(payload);

  // Read response with timeout
  unsigned long timeout = millis();
  while (client.connected() && !client.available()) {
    if (millis() - timeout > 5000) {
      Serial.println("[ERROR] Response timeout.");
      break;
    }
    delay(10);
  }
  while (client.available()) {
    Serial.println("[RESPONSE] " + client.readStringUntil('\n'));
  }
  client.stop();
}
