#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN 9
#define SS_PIN 10

MFRC522 mfrc522(SS_PIN, RST_PIN);

// Create an instance of the MFRC522 class
MFRC522::MIFARE_Key key;

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("Place your NFC tag near the reader...");

  // Set the default key (0xFF) for authentication
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  Serial.print("Card UID: ");
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
  }
  Serial.println();

  // Authenticate each sector to clear data
  for (byte block = 4; block <= 7; block++) { // Blocks 4 to 7 for your data blocks
    MFRC522::StatusCode status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid));
    if (status != MFRC522::STATUS_OK) {
      Serial.print("Authentication failed at block ");
      Serial.print(block);
      Serial.print(": ");
      Serial.println(mfrc522.GetStatusCodeName(status));
      return;
    }

    // Write empty data (16 zero bytes) to clear the block
    byte zeroBlock[16] = {0};
    status = mfrc522.MIFARE_Write(block, zeroBlock, 16);
    if (status != MFRC522::STATUS_OK) {
      Serial.print("Failed to clear block ");
      Serial.print(block);
      Serial.print(": ");
      Serial.println(mfrc522.GetStatusCodeName(status));
      return;
    }
    Serial.print("Block ");
    Serial.print(block);
    Serial.println(" cleared successfully.");
  }

  Serial.println("NFC tag formatted successfully!");

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}
