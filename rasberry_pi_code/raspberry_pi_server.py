#!/usr/bin/env python3
"""
Plant Monitoring System - Sensor MQTT Client
This script collects data from various sensors (temperature, humidity, light, soil moisture)
and publishes them to an MQTT broker.

Sensors:
- DHT11 (temperature & humidity) on GPIO4
- BH1750 (light intensity) on I2C
- Soil moisture sensor connected via Arduino

Environment variables are loaded from a .env file
"""

import paho.mqtt.client as mqtt
import adafruit_dht
import board
import smbus2
import time
import json
import serial
import logging
import os
import argparse
from typing import Dict, Union, Optional, Tuple
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("plant_monitor")

# Constants
# Error values for sensors when they fail (using impossible negative values)
ERROR_TEMP = -999.9
ERROR_HUMIDITY = -999.9
ERROR_LIGHT = -999.9
ERROR_SOIL = -999.9


class SensorSystem:
    """Main class for handling sensor readings and MQTT communications"""

    def __init__(self, config: Dict):
        """Initialize the sensor system with the given configuration"""
        self.config = config
        self._setup_mqtt()
        self._setup_sensors()
        self.running = False

    def _setup_mqtt(self) -> None:
        """Set up the MQTT client connection"""
        mqtt_config = self.config["mqtt"]
        self.mqtt_client = mqtt.Client()
        try:
            self.mqtt_client.connect(
                mqtt_config["broker"],
                mqtt_config["port"],
                mqtt_config["keepalive"]
            )
            self.mqtt_client.loop_start()
            logger.info(f"Connected to MQTT broker at {mqtt_config['broker']}")
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            # Continue without MQTT - data will still be displayed locally

    def _setup_sensors(self) -> None:
        """Set up connections to all sensors"""
        # DHT11 Setup (GPIO4)
        try:
            self.dht_device = adafruit_dht.DHT11(board.D4)
            logger.info("DHT11 sensor initialized")
        except Exception as e:
            logger.error(f"Failed to initialize DHT11 sensor: {e}")
            self.dht_device = None

        # BH1750 Setup (I2C)
        self.i2c_address = self.config["sensors"]["bh1750"]["address"]
        try:
            self.i2c_bus = smbus2.SMBus(1)
            logger.info("BH1750 light sensor initialized on I2C")
        except Exception as e:
            logger.error(f"Failed to initialize I2C for BH1750: {e}")
            self.i2c_bus = None

        # Arduino Serial Setup
        arduino_config = self.config["arduino"]
        try:
            self.arduino = serial.Serial(
                arduino_config["port"],
                arduino_config["baudrate"],
                timeout=arduino_config["timeout"]
            )
            time.sleep(2)  # Give Arduino time to reset
            logger.info(f"Connected to Arduino on {arduino_config['port']}")
        except serial.SerialException as e:
            logger.error(f"Arduino connection error: {e}")
            self.arduino = None

    def read_temperature_humidity(self) -> Tuple[float, float]:
        """Read temperature and humidity from DHT11 sensor"""
        if self.dht_device is None:
            return ERROR_TEMP, ERROR_HUMIDITY

        try:
            temperature = self.dht_device.temperature
            humidity = self.dht_device.humidity
            return float(round(temperature, 1)), float(round(humidity, 1))
        except RuntimeError as e:
            logger.warning(f"DHT11 reading error: {e}")
            return ERROR_TEMP, ERROR_HUMIDITY
        except Exception as e:
            logger.error(f"Unexpected error reading DHT11: {e}")
            return ERROR_TEMP, ERROR_HUMIDITY

    def read_light(self) -> float:
        """Read light intensity from BH1750 sensor"""
        if self.i2c_bus is None:
            return ERROR_LIGHT

        try:
            data = self.i2c_bus.read_i2c_block_data(self.i2c_address, 0x10, 2)
            lux = (data[0] << 8) | data[1]
            return float(lux)
        except Exception as e:
            logger.warning(f"Error reading BH1750: {e}")
            return ERROR_LIGHT

    def read_soil_moisture(self) -> float:
        """Read soil moisture from Arduino-connected sensor"""
        if self.arduino is None or not self.arduino.is_open:
            return ERROR_SOIL

        if self.arduino.in_waiting:
            try:
                line = self.arduino.readline().decode('utf-8').strip()
                raw_value = int(line)
                
                # Convert to percentage using configured min/max values
                soil_config = self.config["sensors"]["soil_moisture"]
                min_value = soil_config["min_value"]
                max_value = soil_config["max_value"]
                
                # Convert to 0-100% where 100% is wettest and 0% is driest
                if raw_value <= min_value:
                    return 100.0
                elif raw_value >= max_value:
                    return 0.0
                else:
                    moisture_percent = (max_value - raw_value) / (max_value - min_value) * 100.0
                    return round(moisture_percent, 1)
                    
            except Exception as e:
                logger.warning(f"Error reading Arduino: {e}")
                return ERROR_SOIL

        # If no data available
        return ERROR_SOIL

    def read_all_sensors(self) -> Dict[str, float]:
        """Read all sensor values and return as dictionary"""
        temperature, humidity = self.read_temperature_humidity()
        light = self.read_light()
        soil = self.read_soil_moisture()
        
        return {
            "temperature": temperature,
            "humidity": humidity,
            "light_intensity": light,
            "soil_moisture": soil
        }

    def format_readings(self, readings: Dict[str, float]) -> Dict[str, str]:
        """Format sensor readings for display, with error indicators"""
        formatted = {}
        formatted["temperature"] = f"{readings['temperature']}°C" if readings['temperature'] != ERROR_TEMP else "ERROR"
        formatted["humidity"] = f"{readings['humidity']}%" if readings['humidity'] != ERROR_HUMIDITY else "ERROR"
        formatted["light_intensity"] = f"{readings['light_intensity']}" if readings['light_intensity'] != ERROR_LIGHT else "ERROR"
        formatted["soil_moisture"] = f"{readings['soil_moisture']}%" if readings['soil_moisture'] != ERROR_SOIL else "ERROR"
        return formatted

    def publish_data(self, data: Dict[str, float]) -> None:
        """Publish sensor data to MQTT broker"""
        payload = json.dumps(data)
        topic = self.config["mqtt"]["topic"]
        
        try:
            self.mqtt_client.publish(topic, payload)
            logger.debug(f"Published to {topic}: {payload}")
        except Exception as e:
            logger.error(f"Failed to publish MQTT message: {e}")

    def run(self) -> None:
        """Main loop to read sensors and publish data"""
        self.running = True
        logger.info("Starting sensor monitoring loop")
        
        try:
            while self.running:
                # Read all sensor data
                sensor_data = self.read_all_sensors()
                
                # Publish data to MQTT
                self.publish_data(sensor_data)
                
                # Display formatted data
                formatted_data = self.format_readings(sensor_data)
                logger.info(
                    f"Sensor data: Temperature={formatted_data['temperature']}, "
                    f"Humidity={formatted_data['humidity']}, "
                    f"Light={formatted_data['light_intensity']}, "
                    f"Soil Moisture={formatted_data['soil_moisture']}"
                )
                
                # Wait for next reading
                time.sleep(self.config["sampling"]["interval"])
                
        except KeyboardInterrupt:
            logger.info("Monitoring stopped by user")
        finally:
            self.cleanup()

    def cleanup(self) -> None:
        """Clean up resources before exiting"""
        logger.info("Cleaning up resources")
        self.running = False
        
        # Close Arduino connection if open
        if self.arduino and self.arduino.is_open:
            self.arduino.close()
            logger.debug("Closed Arduino serial connection")
        
        # Stop MQTT client
        try:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
            logger.debug("Disconnected from MQTT broker")
        except Exception as e:
            logger.error(f"Error disconnecting MQTT client: {e}")


def load_config_from_env() -> Dict:
    """Load configuration from environment variables"""
    config = {
        "mqtt": {
            "broker": os.getenv("MQTT_BROKER"),
            "port": int(os.getenv("MQTT_PORT", 1883)),
            "keepalive": int(os.getenv("MQTT_KEEPALIVE", 60)),
            "topic": os.getenv("MQTT_TOPIC", "sensor/data")
        },
        "sensors": {
            "soil_moisture": {
                "min_value": int(os.getenv("SOIL_MOISTURE_MIN_VALUE", 0)),
                "max_value": int(os.getenv("SOIL_MOISTURE_MAX_VALUE", 1023))
            },
            "bh1750": {
                "address": int(os.getenv("BH1750_ADDRESS", "0x23"), 16)
            }
        },
        "arduino": {
            "port": os.getenv("ARDUINO_PORT", "/dev/ttyACM0"),
            "baudrate": int(os.getenv("ARDUINO_BAUDRATE", 9600)),
            "timeout": int(os.getenv("ARDUINO_TIMEOUT", 1))
        },
        "sampling": {
            "interval": int(os.getenv("SAMPLING_INTERVAL", 2))
        }
    }
    return config


def main():
    """Main function to run the sensor system"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Plant Monitoring System - Sensor MQTT Client')
    parser.add_argument('-e', '--env', type=str, default='.env', help='Path to .env file')
    parser.add_argument('-c', '--config', type=str, help='Path to JSON configuration file (overrides .env)')
    args = parser.parse_args()
    
    # Load environment variables
    env_path = args.env
    if os.path.exists(env_path):
        load_dotenv(env_path)
        logger.info(f"Loaded environment variables from {env_path}")
    else:
        logger.warning(f"Environment file {env_path} not found. Using default values.")
    
    # Load configuration from environment variables
    config = load_config_from_env()
    
    # Load config from JSON file if specified (overrides environment variables)
    if args.config:
        try:
            with open(args.config, 'r') as f:
                loaded_config = json.load(f)
                # Merge the loaded config with the default config
                for section, values in loaded_config.items():
                    if section in config:
                        config[section].update(values)
                    else:
                        config[section] = values
            logger.info(f"Loaded configuration from {args.config}")
        except Exception as e:
            logger.error(f"Error loading configuration from {args.config}: {e}")
    
    try:
        sensor_system = SensorSystem(config)
        sensor_system.run()
    except Exception as e:
        logger.critical(f"Unhandled exception in main: {e}", exc_info=True)
        return 1
    return 0


if __name__ == "__main__":
    exit(main())