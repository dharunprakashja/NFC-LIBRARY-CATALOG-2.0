#include <SPI.h>
#include <MFRC522.h>
#include <WiFiS3.h>  // WiFi library for Arduino UNO R4 WiFi

#define RST_PIN 9  // Configurable pin
#define SS_PIN 10  // Configurable pin

const char* ssid = "DHAROO'S23";         // Replace with your Wi-Fi SSID
const char* password = "12345678";        // Replace with your Wi-Fi password

const char* server = "damon-pseudoconservative-laryngeally.ngrok-free.dev"; 

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

void setup() {
  Serial.begin(9600);  
  SPI.begin();         
  mfrc522.PCD_Init();  

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
    String nfcData = "";  

    byte buffer[18];
    byte size = sizeof(buffer);

    for (byte block = 6; block <= 30; block++) {
      if (mfrc522.MIFARE_Read(block, buffer, &size) == MFRC522::STATUS_OK) {
        for (byte i = 1; i < 5; i++) {
          if (buffer[i] >= 32 && buffer[i] <= 126) {  
            nfcData += (char)buffer[i];
          }
        }
      }
    }

    Serial.print("NFC Data: ");
    Serial.println(nfcData);  

    sendToBackend(escapeJson(nfcData));

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(3000);  
  }
}

String escapeJson(const String& data) {
  String escapedData = "";
  for (unsigned int i = 0; i < data.length(); i++) {
    char c = data.charAt(i);
    if (c == '"') {
      escapedData += "\\\"";  
    } else if (c == '\\') {
      escapedData += "\\\\";  
    } else {
      escapedData += c;
    }
  }
  return escapedData;
}

void sendToBackend(String data) {
  if (WiFi.status() == WL_CONNECTED) {
    
    // CHANGED: Back to standard WiFiClient (No SSL)
    WiFiClient client; 

    Serial.print("Attempting to connect to server on Port 80... ");

    // CHANGED: Using Port 80 (Standard unencrypted HTTP)
    if (!client.connect(server, 80)) {
      Serial.println("Connection failed!");
      return;
    }

    String payload = "{\"nfc_data\":\"" + data + "\"}";

    client.println("POST /attendance HTTP/1.1");
    client.println("Host: " + String(server));
    client.println("Content-Type: application/json");
    client.println("ngrok-skip-browser-warning: true"); 
    client.print("Content-Length: ");
    client.println(payload.length());
    client.println();  
    client.print(payload);  

    int timeout = 0;
    while (client.connected() && !client.available() && timeout < 500) {
      delay(10);
      timeout++;
    }
    
    Serial.println("Response:");
    while (client.available()) {
      String response = client.readStringUntil('\r');
      Serial.print(response);  
    }
    Serial.println("\n--- End of Response ---");

    client.stop();  
  } else {
    Serial.println("Wi-Fi not connected!");
  }
}
