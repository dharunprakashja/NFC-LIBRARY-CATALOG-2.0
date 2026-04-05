#include <SPI.h>
#include <MFRC522.h>
#include <WiFiS3.h>  // WiFi library for Arduino UNO R4 WiFi

#define RST_PIN 9  // Configurable pin
#define SS_PIN 10  // Configurable pin

const char* ssid = "DHAROO'S23";         // Replace with your Wi-Fi SSID
const char* password = "12345678";        // Replace with your Wi-Fi password
const char* serverIP = "192.168.1.4";     // Backend server's IP address
const int serverPort = 5000;               // Backend server port

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

void setup() {
  // SPEED BOOST 1: Increased Baud Rate to prevent Serial blocking
  Serial.begin(2000000);  
  
  // CRITICAL FIX FOR UNO R4: Wait for the Serial Monitor to open before continuing
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("\n--- Starting High-Speed NFC Scanner ---");

  SPI.begin();         // Initialize SPI bus
  mfrc522.PCD_Init();  // Initialize MFRC522 card

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi!");
  Serial.println("System Ready. Waiting for card...");
}

void loop() {
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    Serial.println("\n[+] Card Swiped!"); 
    
    String nfcData = "";  // Store NFC data

    byte buffer[18];
    byte size = sizeof(buffer);

    // Read data from the NFC card
    for (byte block = 6; block <= 30; block++) {
      if (mfrc522.MIFARE_Read(block, buffer, &size) == MFRC522::STATUS_OK) {
        for (byte i = 1; i < 5; i++) {
          if (buffer[i] >= 32 && buffer[i] <= 126) {  // Printable ASCII range
            nfcData += (char)buffer[i];
          }
        }
      } else {
        // SPEED BOOST 2: Stop trying to read if we hit a blank/locked block.
        // This prevents ~1.2 seconds of hardware timeout lag!
        break; 
      }
    }

    if (nfcData.length() > 0) {
      Serial.print("NFC Data Read: ");
      Serial.println(nfcData);  // Debug print
    } else {
      Serial.println("Warning: Card read successful, but no valid text data found.");
    }

    // Send NFC data to the backend
    sendToBackend(escapeJson(nfcData));

    // Halt and stop encryption
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();

    Serial.println("Ready. Waiting for next card...");
  }
}

// Function to escape special characters in JSON
String escapeJson(const String& data) {
  String escapedData = "";
  for (unsigned int i = 0; i < data.length(); i++) {
    char c = data.charAt(i);
    if (c == '"') {
      escapedData += "\\\"";  // Escape double quotes
    } else if (c == '\\') {
      escapedData += "\\\\";  // Escape backslashes
    } else {
      escapedData += c;
    }
  }
  return escapedData;
}

// Function to send NFC data to the backend
void sendToBackend(String data) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;

    Serial.print("Attempting to connect to ");
    Serial.print(serverIP);
    Serial.print(":");
    Serial.println(serverPort);

    // Try to connect to the backend server
    if (!client.connect(serverIP, serverPort)) {
      Serial.println("ERROR: Connection to backend failed! Check IP, port, and network settings.");
      return;
    }

    // Create JSON payload with escaped NFC data
    String payload = "{\"nfc_data\":\"" + data + "\"}";

    // Send HTTP POST request
    client.println("POST /attendance HTTP/1.1");
    client.println("Host: " + String(serverIP));
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(payload.length());
    client.println();  // End of headers
    client.println(payload);  // Send payload

    Serial.println("Payload sent. Waiting for server reply...");

    // Wait for response with a TIMEOUT so it doesn't freeze the Arduino
    unsigned long timeout = millis();
    while (client.connected() && !client.available()) {
      if (millis() - timeout > 5000) { // 5 second timeout
        Serial.println("ERROR: Server connection timed out.");
        client.stop();
        return;
      }
      delay(10);
    }
    
    Serial.print("Server Reply: ");
    // SPEED BOOST 3: Read raw characters instantly instead of waiting for slow line endings
    while (client.available()) {
      Serial.write(client.read()); 
    }
    Serial.println();

    client.stop();  // Close connection
    Serial.println("Connection closed.");
  } else {
    Serial.println("ERROR: Wi-Fi not connected!");
  }
}
