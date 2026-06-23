#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "esp_bt.h" // This should help fix the bluetooth errors in the esp32

// Setting up the I2C pins
#define SDA_PIN 9
#define SCL_PIN 10

Adafruit_MPU6050 mpu;

// Creating IDs for bluetooth connection later(paste into python script)
#define SERVICE_UUID        "19b10000-e8f2-537e-4f6c-d104768a1214"
#define CHARACTERISTIC_UUID "19b10001-e8f2-537e-4f6c-d104768a1214"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

// Seting up bluetooth connection callbacks
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Device connected");
    };
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Device disconnected");
      // Restarting advertising to make it possible to connect again
      BLEDevice::startAdvertising(); 
    }
};

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10); // Waiting for serial to initialize

  Serial.println("Initializing the whole device");

  // Starting I2C
  Wire.begin(SDA_PIN, SCL_PIN);

  // Initializing the MPU6050 sensor
  if (!mpu.begin(0x68, &Wire)) {
    Serial.println("MPU6050 not found");
    while (1) { delay(10); } // Stopping everything if it fails
  }
  Serial.println("MPU6050 found");

  // Configure sensor ranges to handle gym movements
  mpu.setAccelerometerRange(MPU6050_RANGE_4_G); 
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);   

  // Initializing the ble hardware
  BLEDevice::init("GymTracker_Proto3");

  // Fixing the chip's bluetooth by lowering transmission power
  esp_ble_tx_power_set(ESP_BLE_PWR_TYPE_DEFAULT, ESP_PWR_LVL_P3); 
  esp_ble_tx_power_set(ESP_BLE_PWR_TYPE_ADV, ESP_PWR_LVL_P3);

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Creating the ble service and the characteristic
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_NOTIFY 
                    );

  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  // Start broadcasting the bluetooth signal
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();
  
  Serial.println("Bluetooth started and power optimized! Waiting for laptop to connect...");
}

void loop() {
  // Only process data if anything is connected
  if (deviceConnected) {
    
    // Get new sensor events with the readings
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // Format the data into a single string to send later "accelX,accelY,accelZ,gyroX,gyroY,gyroZ"
    String dataString = String(a.acceleration.x) + "," + 
                        String(a.acceleration.y) + "," + 
                        String(a.acceleration.z) + "," + 
                        String(g.gyro.x) + "," + 
                        String(g.gyro.y) + "," + 
                        String(g.gyro.z);

    // Convert string to character array and send it
    pCharacteristic->setValue(dataString.c_str());
    pCharacteristic->notify();

    // Print to serial monitor for easy debugging
    Serial.println("Sent: " + dataString);

    // Delay 50 milliseconds(20 transmissions per second)
    delay(50); 
  }
}