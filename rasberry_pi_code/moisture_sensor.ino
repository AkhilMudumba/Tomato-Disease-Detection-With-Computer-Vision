void setup() {
  Serial.begin(9600);
}

void loop() {
  int moisture = analogRead(A0);  // Read analog value from sensor
  Serial.println(moisture);       // Send to Serial
  delay(2000);                    // Delay between readings
}