#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10  // Slave Select pin
#define RST_PIN 9  // Reset pin

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance

void setup() {
  Serial.begin(9600);   // Start serial communication
  SPI.begin();          // Initialize SPI bus
  mfrc522.PCD_Init();   // Initialize MFRC522 module
  Serial.println("Place your NFC card near the reader...");
}

void loop() {
  // Check if a new card is present
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Check if we can read the card's serial number
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Print UID (Unique ID) of the card
  Serial.print("Card UID: ");
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
  }
  Serial.println();

  // Read card data
  Serial.println("Reading data...");
  readCardData();

  // Halt the card and stop communication
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  delay(2000); // Wait before scanning again
}

// Function to read stored data from the card
void readCardData() {
  byte buffer[18];
  byte size = sizeof(buffer);

  for (byte block = 4; block <= 7; block++) { // Read blocks 4 to 7
    if (mfrc522.MIFARE_Read(block, buffer, &size) == MFRC522::STATUS_OK) {
      Serial.print("Block ");
      Serial.print(block);
      Serial.print(": ");
      for (byte i = 0; i < 16; i++) {
        if (buffer[i] >= 32 && buffer[i] <= 126) { // Only print readable characters
          Serial.print((char)buffer[i]);
        } else {
          Serial.print("."); // Placeholder for unreadable characters
        }
      }
      Serial.println();
    } else {
      Serial.println("Error reading block " + String(block));
    }
  }
}
