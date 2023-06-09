#include "secrets.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "WiFi.h"
#include <Wire.h>
#include "MAX30100_PulseOximeter.h"

#define REPORTING_PERIOD_MS 1000

PulseOximeter pox;

uint32_t tsLastReport = 0;


#define AWS_IOT_PUBLISH_TOPIC "esp32/pub"
#define AWS_IOT_SUBSCRIBE_TOPIC "esp32/sub"

WiFiClientSecure net = WiFiClientSecure();
PubSubClient client(net);



void connectAWS() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // Configure WiFiClientSecure to use the AWS IoT device credentials
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);

  // Connect to the MQTT broker on the AWS endpoint we defined earlier
  client.setServer(AWS_IOT_ENDPOINT, 8883);

  // Create a message handler
  // client.setCallback(messageHandler);

  Serial.println("Connecting to AWS IOT");

  while (!client.connect(THINGNAME)) {
    Serial.print(".");
    delay(100);
  }

  if (!client.connected()) {
    Serial.println("AWS IoT Timeout!");
    return;
  }

  // Subscribe to a topic
  client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC);

  Serial.println("AWS IoT Connected!");
}

void publishMessage(float heartrate, float spo2) {
  StaticJsonDocument<200> doc;
  doc["heartrate"] = heartrate;
  doc["spo2"] = spo2;
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);  // print to client
  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
}

// void messageHandler(char* topic, byte* payload, unsigned int length) {
//   Serial.print("incoming: ");
//   Serial.println(topic);

//   StaticJsonDocument<200> doc;
//   deserializeJson(doc, payload);
//   const char* message = doc["message"];
//   Serial.println(message);
// }

void setup() {
  Serial.begin(115200);
  Serial.print("Initializing pulse oximeter..");

  // Initialize the PulseOximeter instance
  // Failures are generally due to an improper I2C wiring, missing power supply
  // or wrong target chip
  if (!pox.begin()) {
    Serial.println("FAILED");
    for (;;)
      ;
  } else {
    Serial.println("SUCCESS");
  }
  connectAWS();
}

void loop() {
  pox.update();
  float heartrate, spo2;
  // Asynchronously dump heart rate and oxidation levels to the serial
  // For both, a value of 0 means "invalid"
  if (millis() - tsLastReport > REPORTING_PERIOD_MS) {
    heartrate = pox.getHeartRate();
    spo2 = pox.getSpO2();
    Serial.print("Heart rate:");
    Serial.print(heartrate);
    Serial.print("bpm / SpO2:");
    Serial.print(spo2);
    Serial.println("%");
    publishMessage(heartrate, spo2);
    tsLastReport = millis();
  }
}
