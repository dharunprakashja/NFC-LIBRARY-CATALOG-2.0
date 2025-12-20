#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN 9
#define SS_PIN 10

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();  // Initialize the reader
  Serial.println("Place your NFC tag near the reader...");
}

void loop() {
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    // Data to write (exactly 16 bytes per block)
    byte block4[16] = "Name: Vijay ";  // Padded with spaces
    byte block5[16] = "Dept: TVK  ";  // Padded with spaces
    byte block6[16] = "Roll: 11111  ";  // Padded with spaces
    byte block7[16] = "Mob:1234567890 ";  // Padded with space

    writeBlock(4, block4);
    writeBlock(5, block5);
    writeBlock(6, block6);
    writeBlock(7, block7);

    Serial.println("Data written successfully!");

    // Halt and stop encryption
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(3000);  // Delay to avoid multiple triggers
  }
}

// Function to write data to a block
void writeBlock(byte block, byte *data) {
  MFRC522::StatusCode status = mfrc522.MIFARE_Write(block, data, 16);
  if (status != MFRC522::STATUS_OK) {
    Serial.print("Write failed on block ");
    Serial.print(block);
    Serial.print(": ");
    Serial.println(mfrc522.GetStatusCodeName(status));
  }
}
