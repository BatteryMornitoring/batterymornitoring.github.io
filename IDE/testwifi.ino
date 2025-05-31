#include <Wire.h>
#include <Adafruit_INA219.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <FirebaseESP32.h>  // Nếu bạn dùng Firebase_ESP_Client thì báo mình nhé

// Wi-Fi
#define WIFI_SSID "Myhome D15"
#define WIFI_PASSWORD "Myhomed15"

// Firebase cấu hình
FirebaseData fbdb;
FirebaseAuth auth;
FirebaseConfig config;

// INA219
Adafruit_INA219 ina219;

// DS18B20 - chân D15 (GPIO 15)
#define ONE_WIRE_BUS 15
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// Cấu hình pin
const float battery_capacity_mAh = 1200.0;
float battery_remaining_mAh = 1200.0;
float last_time = 0;
float SoC = 100.0;
bool low_battery_alert = false;

// Kalman Filter cho SoC
float kalman_x = 100.0, kalman_p = 1, kalman_q = 0.1, kalman_r = 2;

float kalmanFilter(float measurement) {
  kalman_p += kalman_q;
  float k = kalman_p / (kalman_p + kalman_r);
  kalman_x += k * (measurement - kalman_x);
  kalman_p *= (1 - k);
  return kalman_x;
}

// Kalman Filter cho nội trở (SoH)
float R_kalman = 0.0;
float P_kalman = 1.0;
float Q_kalman = 0.001;
float R_measure_noise = 0.1;
const float R_new = 0.05;
const float R_end = 0.2;

float kalmanFilterResistance(float R_measured) {
  float P_predict = P_kalman + Q_kalman;
  float K = P_predict / (P_predict + R_measure_noise);
  R_kalman = R_kalman + K * (R_measured - R_kalman);
  P_kalman = (1 - K) * P_predict;
  return R_kalman;
}

void setup() {
  Serial.begin(9600);

  // Kết nối Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("✅ Wi-Fi connected!");

  // Cấu hình Firebase
  config.database_url = "https://batterymonitoringsystem-86df4-default-rtdb.firebaseio.com/";
  config.signer.tokens.legacy_token = "yNN1REquhNO6rm8GpCEepjoHctBhexw6OXW4ew79";

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // I2C & cảm biến
  Wire.begin();

  if (!ina219.begin()) {
    Serial.println("❌ Không tìm thấy cảm biến INA219!");
    while (1);
  }

  sensors.begin();
  Serial.println("🚀 ESP32 Giám sát pin: SoC + SoH + Nhiệt độ");
  last_time = millis();
}

void loop() {
  // Kiểm tra lại kết nối Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("🔌 Mất kết nối Wi-Fi, đang thử kết nối lại...");
    WiFi.reconnect();
    delay(1000);
    return;
  }

  float voltage_no_load = ina219.getBusVoltage_V();
  float current_mA = ina219.getCurrent_mA();
  float current_A = current_mA / 1000.0;

  delay(500); // Giả lập có tải
  float voltage_load = ina219.getBusVoltage_V();

  // SoH
  float SoH = 100.0;
  if (current_A > 0.01) {
    float R_measured = (voltage_no_load - voltage_load) / current_A;
    float R_filtered = kalmanFilterResistance(R_measured);
    SoH = (1 - (R_filtered - R_new) / (R_end - R_new)) * 100;
    SoH = constrain(SoH, 0, 100);
  }

  // SoC
  float elapsed_time = (millis() - last_time) / 3600000.0;
  last_time = millis();
  battery_remaining_mAh -= (current_mA * elapsed_time);
  if (battery_remaining_mAh < 0) battery_remaining_mAh = 0;
  float SoC_coulomb = (battery_remaining_mAh / battery_capacity_mAh) * 100.0;

  float voltage_SoC = 0.0;
  if (voltage_no_load >= 4.95) voltage_SoC = 100.0;
  else if (voltage_no_load <= 4.4) voltage_SoC = 0.0;
  else voltage_SoC = (voltage_no_load - 4.4) / (4.95 - 4.4) * 100.0;

  SoC = kalmanFilter(SoC_coulomb * 0.7 + voltage_SoC * 0.3);

  if (SoC < 20 && !low_battery_alert) {
    Serial.println("⚠️ CẢNH BÁO: Pin yếu, cần thay pin sớm!");
    low_battery_alert = true;
  }

  // Nhiệt độ
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);
  if (tempC == -127.0) {
    Serial.println("⚠️ Không đọc được nhiệt độ! Kiểm tra DS18B20.");
  }

  // Gửi lên Firebase và hiển thị
  Serial.print("Điện áp: "); Serial.print(voltage_no_load, 2); Serial.print("V | ");
  Firebase.setInt(fbdb, "/Vol", (int)voltage_no_load);

  Serial.print("Dòng: "); Serial.print(current_mA, 1); Serial.print("mA | ");
  Firebase.setInt(fbdb, "/Amp", (int)current_mA);

  Serial.print("SoC: "); Serial.print(SoC, 1); Serial.print("% | ");
  Firebase.setInt(fbdb, "/SoC", (int)SoC);

  Serial.print("SoH: "); Serial.print(SoH, 1); Serial.print("% | ");
  Firebase.setInt(fbdb, "/SoH", (int)SoH);

  Serial.print("Nhiệt độ: ");
  Firebase.setInt(fbdb, "/Temp", (int)tempC);

  if (tempC == -127.0) Serial.print("Lỗi");
  else Serial.print(tempC, 1);
  Serial.println("°C");

  delay(5000);
}
