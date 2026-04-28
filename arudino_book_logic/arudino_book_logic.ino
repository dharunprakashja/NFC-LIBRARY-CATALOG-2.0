#include <SPI.h>
#include <MFRC522.h>
#include <WiFiS3.h>

#define RST_PIN 9
#define SS_PIN 10

const char *ssid = "DHAROO'S23";
const char *password = "12345678";
const char *serverHost = "nfc-library-catalog-2-0.onrender.com";
const int serverPort = 443;

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup()
{
  Serial.begin(2000000);
  while (!Serial)
  {
    delay(10);
  }

  Serial1.begin(115200);

  SPI.begin();
  mfrc522.PCD_Init();

  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(ssid, password);
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 15000)
  {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("\nWi-Fi connected");
  }
  else
  {
    Serial.println("\nWi-Fi not connected. Wired mode still active.");
  }

  Serial.println("\n==================================");
  Serial.println("SCANNER READY.");
  Serial.println("Waiting for Student or Book tags...");
  Serial.println("==================================");
}

void loop()
{
  // Check for a physical card tap
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial())
  {
    return;
  }

  // Read the MIFARE Ultralight data
  String scannedData = readUltralightData();

  // Handle empty reads
  if (scannedData.length() == 0)
  {
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
String readUltralightData()
{
  String data = "";
  byte buffer[18];
  byte size = sizeof(buffer);

  // Read pages 4 through 36
  for (byte page = 4; page < 40; page += 4)
  {
    if (mfrc522.MIFARE_Read(page, buffer, &size) == MFRC522::STATUS_OK)
    {
      for (byte i = 0; i < 16; i++)
      {
        if (buffer[i] >= 32 && buffer[i] <= 126)
        {
          data += (char)buffer[i];
        }
      }
    }
    else
    {
      break;
    }
  }

  mfrc522.PICC_HaltA();
  return data;
}

// Function to escape special characters in JSON
String escapeJson(const String &data)
{
  String escapedData = "";
  for (unsigned int i = 0; i < data.length(); i++)
  {
    char c = data.charAt(i);
    if (c == '"')
      escapedData += "\\\"";
    else if (c == '\\')
      escapedData += "\\\\";
    else
      escapedData += c;
  }
  return escapedData;
}

// Function to send the NFC data to the backend
void sendToBackend(String data)
{
  String payload = "{\"nfc_data\":\"" + escapeJson(data) + "\"}";

  // 1) Wired send
  // Serial1 is optional board-to-board transport.
  Serial1.println(payload);
  // USB Serial line is consumed by backend COM reader.
  Serial.println(payload);
  Serial.print("Wired send: ");
  Serial.println(payload);

  // 2) Wireless send (Arduino to backend over HTTPS)
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("Wi-Fi send skipped: not connected.");
    return;
  }

  WiFiSSLClient client;
  if (!client.connect(serverHost, serverPort))
  {
    Serial.println("Wi-Fi send failed: backend connection error.");
    return;
  }

  client.println("POST /library HTTP/1.1");
  client.println("Host: " + String(serverHost));
  client.println("Content-Type: application/json");
  client.println("Connection: close");
  client.print("Content-Length: ");
  client.println(payload.length());
  client.println();
  client.println(payload);

  unsigned long timeout = millis();
  while (client.connected() && !client.available())
  {
    if (millis() - timeout > 5000)
    {
      Serial.println("Wi-Fi send timeout.");
      client.stop();
      return;
    }
    delay(10);
  }

  Serial.println("Wi-Fi send complete.");
  while (client.available())
  {
    Serial.write(client.read());
  }
  Serial.println();
  client.stop();
}
