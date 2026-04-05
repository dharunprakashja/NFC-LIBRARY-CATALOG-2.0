#include <SPI.h>
#include <MFRC522.h>
#include <WiFiS3.h>  // WiFi library for Arduino UNO R4 WiFi

#define RST_PIN 9  
#define SS_PIN 10  

// Wi-Fi credentials
const char* ssid = "DHAROO'S23";         
const char* password = "12345678";        
const char* serverIP = "192.168.1.4";     
const int serverPort = 5000;               

MFRC522 mfrc522(SS_PIN, RST_PIN);  

void setup() {
  Serial.begin(2000000);  
  while (!Serial) { delay(10); } 

  SPI.begin();         
  mfrc522.PCD_Init();  

  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi!");
  Serial.println("\n==================================");
  Serial.println("SCANNER READY.");
  Serial.println("Waiting for Student or Book tags...");
  Serial.println("==================================");
}

void loop() {
  // Check for a physical card tap
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return; 
  }

  // Read the MIFARE Ultralight data
  String scannedData = readUltralightData();

  // Handle empty reads
  if (scannedData.length() == 0) {
    Serial.println("ERROR: Card read failed or no text found.");
    delay(2000); 
    return;
  }

  Serial.println("\n[+] Tag Scanned!");
  Serial.println(scannedData);
  Serial.println("--> Sending to backend...");

  // Send the single scan to the backend
  sendToBackend(scannedData); 


  Serial.println("\nReady for the next tag...");
}

// Function to read MIFARE Ultralight / NTAG chips
String readUltralightData() {
  String data = "";
  byte buffer[18];
  byte size = sizeof(buffer);

  // Read pages 4 through 36
  for (byte page = 4; page < 40; page += 4) {
    if (mfrc522.MIFARE_Read(page, buffer, &size) == MFRC522::STATUS_OK) {
      for (byte i = 0; i < 16; i++) {
        if (buffer[i] >= 32 && buffer[i] <= 126) {  
          data += (char)buffer[i];
        }
      }
    } else {
      break; 
    }
  }

  mfrc522.PICC_HaltA();
  return data;
}

// Function to escape special characters in JSON
String escapeJson(const String& data) {
  String escapedData = "";
  for (unsigned int i = 0; i < data.length(); i++) {
    char c = data.charAt(i);
    if (c == '"') escapedData += "\\\"";
    else if (c == '\\') escapedData += "\\\\";
    else escapedData += c;
  }
  return escapedData;
}

// Function to send the NFC data to the backend
void sendToBackend(String data) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;

    if (!client.connect(serverIP, serverPort)) {
      Serial.println("Connection to backend failed!");
      return;
    }

    // NEW PAYLOAD: Sends exactly what the new backend asks for
    String payload = "{\"nfc_data\":\"" + escapeJson(data) + "\"}";

    // IMPORTANT: Make sure this path matches where your Express router is mounted!
    // If your app.js says app.use('/library', router), keep this as POST /library
    client.println("POST /library HTTP/1.1");
    client.println("Host: " + String(serverIP));
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(payload.length());
    client.println();
    client.println(payload);

    unsigned long timeout = millis();
    while (client.connected() && !client.available()) {
      if (millis() - timeout > 2000) { 
        Serial.println("Server timeout!");
        client.stop();
        return;
      }
      delay(1); 
    }

    Serial.print("Server Reply: ");
    while (client.available()) {
      Serial.write(client.read()); 
    }
    Serial.println();

    client.stop();
  } else {
    Serial.println("Wi-Fi is disconnected!");
  }
}
