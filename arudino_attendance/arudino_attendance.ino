#include <SPI.h>
#include <MFRC522.h>
#include <WiFiS3.h>

#define RST_PIN 9 // Configurable pin
#define SS_PIN 10 // Configurable pin

const char *ssid = "DHAROO'S23";
const char *password = "12345678";
const char *serverHost = "nfc-library-catalog-2-0.onrender.com";
const int serverPort = 443;

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance

void setup()
{
  // SPEED BOOST 1: Increased Baud Rate to prevent Serial blocking
  Serial.begin(2000000);

  // CRITICAL FIX FOR UNO R4: Wait for the Serial Monitor to open before continuing
  while (!Serial)
  {
    delay(10);
  }

  Serial1.begin(115200);

  Serial.println("\n--- Starting High-Speed NFC Scanner ---");

  SPI.begin();        // Initialize SPI bus
  mfrc522.PCD_Init(); // Initialize MFRC522 card

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

  Serial.println("System Ready. Waiting for card...");
}

void loop()
{
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial())
  {
    Serial.println("\n[+] Card Swiped!");

    String nfcData = ""; // Store NFC data

    byte buffer[18];
    byte size = sizeof(buffer);

    // Read data from the NFC card
    for (byte block = 6; block <= 30; block++)
    {
      if (mfrc522.MIFARE_Read(block, buffer, &size) == MFRC522::STATUS_OK)
      {
        for (byte i = 1; i < 5; i++)
        {
          if (buffer[i] >= 32 && buffer[i] <= 126)
          { // Printable ASCII range
            nfcData += (char)buffer[i];
          }
        }
      }
      else
      {
        // SPEED BOOST 2: Stop trying to read if we hit a blank/locked block.
        // This prevents ~1.2 seconds of hardware timeout lag!
        break;
      }
    }

    if (nfcData.length() > 0)
    {
      Serial.print("NFC Data Read: ");
      Serial.println(nfcData); // Debug print
    }
    else
    {
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
String escapeJson(const String &data)
{
  String escapedData = "";
  for (unsigned int i = 0; i < data.length(); i++)
  {
    char c = data.charAt(i);
    if (c == '"')
    {
      escapedData += "\\\""; // Escape double quotes
    }
    else if (c == '\\')
    {
      escapedData += "\\\\"; // Escape backslashes
    }
    else
    {
      escapedData += c;
    }
  }
  return escapedData;
}

// Function to send NFC data to the backend
void sendToBackend(String data)
{
  String payload = "{\"nfc_data\":\"" + data + "\"}";

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

  client.println("POST /attendance HTTP/1.1");
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
