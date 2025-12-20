#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN         9          // Configurable, see typical pin layout above
#define SS_PIN          10         // Configurable, see typical pin layout above

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

unsigned long lastScanTime = 0;    // When the last NFC scan started
unsigned long scanInterval = 2000; // Scan for new NFC cards every 10 seconds (10000 milliseconds)

void setup() {
  Serial.begin(9600);        // Initialize serial communications with the PC
  while (!Serial);           // Do nothing if no serial port is opened (added for Arduinos based on ATMEGA32U4)
  SPI.begin();               // Init SPI bus
  mfrc522.PCD_Init();        // Init MFRC522 card
}

void loop() {
  unsigned long currentMillis = millis(); // Get the current time

  // If 10 seconds have passed since the last scan started, start a new scan
  if (currentMillis - lastScanTime >= scanInterval) {
    lastScanTime = currentMillis; // Remember when this scan started

    // Look for new cards
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      byte buffer[18];
      byte size = sizeof(buffer);
      Serial.print("Present:");
      
      // Read pages from 6 to 11
      for (byte page = 6; page <= 30; page++) {
        mfrc522.MIFARE_Read(page, buffer, &size);
        
        for (byte i = 1; i < 5; i++) {
          if (buffer[i] >= 32 && buffer[i] <= 126) {
            Serial.print((char)buffer[i]);
          }
        }
      }
      
      Serial.println();  // Print a newline character after all pages have been read
    }
  }
}
