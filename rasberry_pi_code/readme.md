# 🍅 Tomato Plant Disease Monitoring System

![Tomato Leaf Diseases](https://img.shields.io/badge/AI-Plant%20Pathology-brightgreen) 
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange) 
![Flask](https://img.shields.io/badge/Flask-API-blue) 
![Python](https://img.shields.io/badge/Python-3.6%2B-blue)
![MQTT](https://img.shields.io/badge/MQTT-Protocol-yellow)
![Raspberry Pi](https://img.shields.io/badge/Raspberry%20Pi-Compatible-red)
![Arduino](https://img.shields.io/badge/Arduino-Sensor%20Integration-teal)

## 📑 Table of Contents
- [Overview](#-overview)
- [Hardware Requirements](#️-hardware-requirements)
- [Project Structure](#-project-structure)
- [Setup and Installation](#-setup-and-installation)
- [Sensor Connections](#-sensor-connections)
- [Configuration](#️-configuration---important)
- [Usage](#-usage)
- [Data Format](#-data-format)
- [Connecting to the Mobile Application](#-connecting-to-the-mobile-application)
- [Troubleshooting](#️-troubleshooting)

## 📋 Overview
![System Architecture](https://img.shields.io/badge/Architecture-IoT%20System-informational)

This project is a comprehensive monitoring system designed for tomato plants that collects environmental data via sensors, transmits it through MQTT, and sends it to a mobile application. The application analyzes the data to detect potential diseases in tomato plants and suggests appropriate treatments.

### System Components
- A Raspberry Pi that reads sensor data and publishes to an MQTT broker
- An Arduino that interfaces with analog sensors (particularly soil moisture)
- A set of environmental sensors (temperature, humidity, light, soil moisture)
- A mobile application that receives data and provides plant health analysis

---

## 🛠️ Hardware Requirements
![Hardware](https://img.shields.io/badge/Hardware-IoT%20Sensors-blueviolet)
![Connectivity](https://img.shields.io/badge/Connectivity-I2C%20|%20GPIO-lightgrey)

### Raspberry Pi
- Raspberry Pi (3B+ or 4 recommended)
- Power supply for Raspberry Pi
- MicroSD card (16GB+ recommended) with Raspberry Pi OS

### Arduino
- Arduino Uno or compatible board
- USB cable for Arduino-Raspberry Pi connection

### Sensors
- DHT11 Temperature & Humidity sensor
- BH1750 Light Intensity sensor (I2C)
- Soil Moisture sensor connected to Arduino

### Other Components
- Jumper wires
- Breadboard
- Resistors as needed for sensors

---

## 📁 Project Structure
![Code Organization](https://img.shields.io/badge/Code-Organized-success)

```
tomato_disease_detection_app/
├── models/                  # ML models for disease detection
├── raspberry_pi_code/       # Raspberry Pi code directory
│   ├── arduino_code/        # Arduino sketches directory
│   │   └── moisture_sensor/ 
│   │       └── moisture_sensor.ino  # Arduino code for soil moisture sensor
│   ├── .env                 # Environment variables configuration
│   ├── raspberry_pi_server.py  # Main Raspberry Pi sensor code
│   └── requirements.txt     # Python dependencies
├── tomatoAPP/               # Mobile application code
├── .gitattributes
└── README.md                # This file
```

---

## 📥 Setup and Installation
![Installation](https://img.shields.io/badge/Installation-Step--by--step-green)

### Raspberry Pi Setup

1. Install required system packages:
   ```bash
   sudo apt update
   sudo apt install -y python3-pip python3-dev i2c-tools python3-smbus git
   ```

2. Enable I2C interface:
   ```bash
   sudo raspi-config
   # Navigate to 'Interface Options' > 'I2C' > Enable
   ```

3. Navigate to the raspberry_pi_code directory and install Python dependencies:
   ```bash
   cd tomato_disease_detection_app/raspberry_pi_code
   pip3 install -r requirements.txt
   ```

### Python Dependencies
![Dependencies](https://img.shields.io/badge/Dependencies-Python%20Packages-blue)

The `requirements.txt` file includes all necessary Python packages to run the raspberry_pi_server.py script. Key dependencies include:

- paho-mqtt: For MQTT communication
- adafruit-circuitpython-dht: For the DHT11 sensor
- smbus2: For I2C communication with the BH1750 sensor
- pyserial: For serial communication with the Arduino
- python-dotenv: For reading environment variables

### Arduino Setup

1. Connect your Arduino to the Raspberry Pi via USB

2. Upload the soil moisture sketch to your Arduino:
   - Open the Arduino IDE
   - Load the `raspberry_pi_code/arduino_code/moisture_sensor/moisture_sensor.ino` file
   - Select your Arduino board and port
   - Click Upload

---

## 🔌 Sensor Connections
![Connections](https://img.shields.io/badge/Wiring-Diagram-important)

### DHT11 Temperature & Humidity Sensor
- Connect VCC to 3.3V or 5V pin on Raspberry Pi
- Connect GND to Ground pin on Raspberry Pi
- Connect DATA to GPIO4 (Pin 7) on Raspberry Pi
- Connect a 10K ohm pull-up resistor between VCC and DATA

### BH1750 Light Sensor (I2C)
- Connect VCC to 3.3V pin on Raspberry Pi
- Connect GND to Ground pin on Raspberry Pi
- Connect SCL to GPIO3 (SCL, Pin 5) on Raspberry Pi
- Connect SDA to GPIO2 (SDA, Pin 3) on Raspberry Pi

### Soil Moisture Sensor
- Connect to Arduino as specified in the `arduino_code/moisture_sensor/moisture_sensor.ino` file
- Typically uses an analog pin on the Arduino

---

## ⚙️ Configuration - IMPORTANT
![Configuration](https://img.shields.io/badge/Configuration-Environment%20Variables-critical)

The system uses environment variables for configuration, which must be set in the `.env` file located in the `raspberry_pi_code` directory. 

**You need to create and modify the `.env` file to match your specific setup, especially the MQTT broker IP address.**

Create the `.env` file:

```bash
nano raspberry_pi_code/.env
```

Add the following variables, making sure to update them according to your setup:

```
# MQTT Configuration
MQTT_BROKER=192.168.1.xxx    # Replace with your MQTT broker IP address
MQTT_PORT=1883
MQTT_KEEPALIVE=60
MQTT_TOPIC=plant/tomato/sensor-data

# Soil Moisture Sensor
SOIL_MOISTURE_MIN_VALUE=0    # Value when soil is completely wet
SOIL_MOISTURE_MAX_VALUE=1023 # Value when soil is completely dry

# BH1750 Light Sensor
BH1750_ADDRESS=0x23  # Default I2C address (0x23 or 0x5C)

# Arduino Connection
ARDUINO_PORT=/dev/ttyACM0  # Check correct port with `ls /dev/tty*`
ARDUINO_BAUDRATE=9600
ARDUINO_TIMEOUT=1

# Sampling Settings
SAMPLING_INTERVAL=60  # Time between readings in seconds
```

### Finding Your MQTT Broker IP Address

If you're running the MQTT broker on another device:
1. On the device running the broker, use `ifconfig` or `ip addr` to find its IP address
2. Enter this IP address for the `MQTT_BROKER` variable

If you're running the broker on the same Raspberry Pi:
1. Use `127.0.0.1` or `localhost` for the `MQTT_BROKER` variable

### Finding the Arduino Port

To find the correct port for your Arduino:

```bash
ls /dev/tty*
```

Look for something like `/dev/ttyACM0` or `/dev/ttyUSB0` that appeared after connecting your Arduino.

---

## 🚀 Usage
![Runtime](https://img.shields.io/badge/Runtime-Commands-ff69b4)
![Service](https://img.shields.io/badge/Service-Systemd-lightblue)

### Starting the Monitoring System

Navigate to the raspberry_pi_code directory and run the main Python script:

```bash
cd raspberry_pi_code
python3 raspberry_pi_server.py
```

### Command Line Options

- `-e, --env`: Specify a custom path to the .env file (default: '.env')
- `-c, --config`: Specify a path to a JSON configuration file (overrides .env settings)

Example:

```bash
python3 plant_monitor.py --env production.env --config custom_config.json
```

### Running as a Service

To run the script as a systemd service on boot:

1. Create a service file:

   ```bash
   sudo nano /etc/systemd/system/tomato-monitor.service
   ```

2. Add the following content (adjust paths to match your installation):

   ```
   [Unit]
   Description=Tomato Plant Monitoring System
   After=network.target

   [Service]
   User=pi
   WorkingDirectory=/home/pi/tomato_disease_detection_app/raspberry_pi_code
   ExecStart=/usr/bin/python3 /home/pi/tomato_disease_detection_app/raspberry_pi_code/raspberry_pi_server.py
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:

   ```bash
   sudo systemctl enable tomato-monitor.service
   sudo systemctl start tomato-monitor.service
   ```

4. Check the status:

   ```bash
   sudo systemctl status tomato-monitor.service
   ```

---

## 📊 Data Format
![Data](https://img.shields.io/badge/Format-JSON-yellow)
![Protocol](https://img.shields.io/badge/Protocol-MQTT-yellowgreen)

The system publishes sensor data to the MQTT broker in JSON format:

```json
{
  "temperature": 24.5,
  "humidity": 45.2,
  "light_intensity": 850,
  "soil_moisture": 62.3
}
```

- `temperature`: Temperature in degrees Celsius (°C)
- `humidity`: Relative humidity percentage (%)
- `light_intensity`: Light level in lux
- `soil_moisture`: Soil moisture percentage (0-100%, where 100% is wettest)

### Error Values

If a sensor fails to read, the following error values are used:

- `temperature`: -999.9
- `humidity`: -999.9
- `light_intensity`: -999.9
- `soil_moisture`: -999.9

---

## 📱 Connecting to the Mobile Application
![Mobile](https://img.shields.io/badge/Mobile-Application-9cf)
![Integration](https://img.shields.io/badge/Integration-Data%20Flow-success)

The mobile application connects to the same MQTT broker and subscribes to the sensor data topic. Make sure:

1. Your MQTT broker is accessible from both the Raspberry Pi and your mobile device
2. The topic configured in the `.env` file matches the topic your mobile app is subscribed to
3. Both systems use the same data format for compatibility

---

## ⚠️ Troubleshooting
![Diagnostics](https://img.shields.io/badge/Diagnostics-Solutions-red)
![Logging](https://img.shields.io/badge/Logging-Debug-lightgrey)

### Common Issues

1. **Cannot connect to MQTT broker**
   - Check your internet connection
   - Verify the broker address and port in your configuration
   - Ensure the MQTT broker is running and accessible

2. **DHT11 sensor reading errors**
   - Ensure proper wiring and connections
   - Verify the pull-up resistor is connected correctly
   - Try increasing the sampling interval (DHT11 needs time between readings)

3. **BH1750 sensor not found**
   - Confirm I2C is enabled on your Raspberry Pi
   - Check connections to the I2C pins
   - Verify the correct address with `i2cdetect -y 1`

4. **Arduino connection issues**
   - Check if the Arduino is properly connected via USB
   - Verify the correct port is specified in the configuration
   - Make sure the Arduino sketch is uploaded and running

5. **Service fails to start**
   - Check service logs: `sudo journalctl -u tomato-monitor.service`
   - Verify file paths in the service file
   - Ensure the Python script has execute permissions

### Logs

The system logs information and errors to the console. For more detailed debugging, you can modify the logging level in the script:

```python
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG for more detailed logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

*This project aims to support sustainable agriculture through early disease detection and intervention, potentially reducing crop losses and pesticide usage.*