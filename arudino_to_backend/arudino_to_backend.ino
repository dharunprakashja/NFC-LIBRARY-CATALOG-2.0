#include <SPI.h>
#include <MFRC522.h>
#include <WiFiS3.h>  // WiFi library for Arduino UNO R4 WiFi

#define RST_PIN 9  // Configurable pin
#define SS_PIN 10  // Configurable pin

const char* ssid = "Prakash's S23";         // Replace with your Wi-Fi SSID
const char* password = "123456789";        // Replace with your Wi-Fi password
const char* serverIP = "192.168.1.10";     // Backend server's IP address
const int serverPort = 5000;               // Backend server port

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

void setup() {
  Serial.begin(9600);  // Initialize serial communication
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
}

void loop() {
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
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
      }
    }

    Serial.print("NFC Data: ");
    Serial.println(nfcData);  // Debug print

    // Send NFC data to the backend
    sendToBackend(escapeJson(nfcData));

    // Halt and stop encryption
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(3000);  // Avoid multiple triggers
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
      Serial.println("Connection to backend failed! Check IP, port, and network settings.");
      return;
    }

    // Create JSON payload with escaped NFC data
    String payload = "{\"nfc_data\":\"" + data + "\"}";

    // Send HTTP POST request
// Send HTTP POST request
client.println("POST /nfc HTTP/1.1");

    client.println("Host: " + String(serverIP));
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(payload.length());
    client.println();  // End of headers
    client.println(payload);  // Send payload

    // Wait for response
    while (client.connected() && !client.available()) {
      delay(10);
    }
    while (client.available()) {
      String response = client.readStringUntil('\r');
      Serial.print("Response from server: ");
      Serial.println(response);  // Print server response
    }

    client.stop();  // Close connection
  } else {
    Serial.println("Wi-Fi not connected!");
  }
}
