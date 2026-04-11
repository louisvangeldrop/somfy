# Somfy RTS Controller

This project implements a wireless controller for Somfy RTS (Radio Technology Somfy) motorized devices, such as blinds, shades, and awnings, using the Moddable SDK on ESP32-based microcontrollers. It provides an HTTP API for remote control and integrates with a CC1101 radio frequency transceiver for 433.42 MHz communication.

## Overview

The system allows control of multiple Somfy RTS motors through a simple web interface. It handles the complex Somfy RTS protocol, including rolling code management, frame construction, and secure transmission. Motor configurations and rolling codes are persisted to flash memory for reliable operation.

## Features

- **HTTP API**: Simple REST-like interface for controlling motors via HTTP requests
- **Multi-Motor Support**: Configure and control multiple Somfy RTS devices
- **Rolling Code Management**: Automatic increment and persistence of rolling codes for security
- **CC1101 Integration**: Direct control of CC1101 transceiver for reliable RF transmission
- **Configuration Persistence**: Motor settings saved to flash memory
- **WiFi Connectivity**: Built-in web server for remote access
- **Hardware Flexibility**: Support for different ESP32 boards with configurable pinouts

## Hardware Requirements

- ESP32 microcontroller with dual-core CPU (original ESP32, preferably not C3, C6, or other single-core variants)
- CC1101 433 MHz RF transceiver module
- SPI connection between ESP32 and CC1101
- Antenna for 433 MHz transmission

## Pin Configuration

**Note**: This software requires dual-core ESP32 chips. ESP32-C3 and ESP32-C6 (single-core) may work.

### ESP32 DevKit (recommended)
- SPI MOSI: GPIO 21
- SPI MISO: GPIO 19
- SPI CLK: GPIO 18
- CC1101 CS: GPIO 5
- CC1101 GDO0: GPIO 12

### ESP32-C3 (not supported?)
- SPI MOSI: GPIO 7
- SPI MISO: GPIO 2
- SPI CLK: GPIO 6
- CC1101 CS: GPIO 9
- CC1101 GDO0: GPIO 10

## Software Setup

1. Install the Moddable SDK
2. Configure your WiFi credentials in `manifest.json`
3. Build and flash the project:
   ```bash
   mcconfig -m -p esp32
   ```
   For ESP32-C3 (not recommended, single-core):
   ```bash
   mcconfig -m -p esp32/c3_32s_kit
   ```
   For a clean build, add `-t clean`:
   ```bash
   mcconfig -m -p esp32 -t clean
   ```

## Usage

### HTTP API

The device runs a web server on port 80. Control motors using HTTP GET requests:

```
http://<device-ip>/somfy?id=<motor-id>&action=<command>&repeats=<count>
```

#### Parameters
- `id`: Motor ID (configured in manifest.json)
- `action`: Command (UP, DOWN, MY, PROG, etc.)
- `repeats`: Number of frame repetitions (default: 5)

#### Examples
- Move motor 11 up: `http://192.168.1.100/somfy?id=11&action=up`
- Stop motor 21: `http://192.168.1.100/somfy?id=21&action=my`
- Program motor 31: `http://192.168.1.100/somfy?id=31&action=prog`

### Motor Configuration

Motors are configured in `manifest.json` under the `motors` section. Each motor has:
- `name`: Descriptive name, optional
- `rolling`: Current rolling code (auto-incremented)

Rolling codes are automatically saved to `somfy_motors.json` on the device.

## Commands

Available Somfy commands:
- `UP`: Move up
- `DOWN`: Move down
- `MY`: Stop at programmed position
- `PROG`: Enter programming mode
- `UP_DOWN`: Toggle direction
- `SUN_FLAG`: Sun and flag mode
- `CFLAG`: Flag mode

## Dependencies

- Moddable SDK
- `somfy_cc1101` module (included)
- ESP32 WiFi and SPI support

## Security Notes

- Somfy RTS uses rolling codes for security. This implementation manages codes automatically.
- Ensure your device is on a secure network.
- Physical access to the device should be restricted.

## Troubleshooting

- Verify CC1101 connections and pin configurations
- Check WiFi credentials in manifest.json
- Ensure antenna is properly connected for RF transmission
- Use serial output for debugging information

## References

- [Homebridge RPi RTS](https://github.com/wibberryd/homebridge-rpi-rts) - Raspberry Pi Somfy RTS implementation
- [Somfy RTS Protocol](https://pushstack.wordpress.com/somfy-rts-protocol/) - Detailed protocol documentation
- [Somfy Remote Lib](https://github.dev/Legion2/Somfy_Remote_Lib/tree/main/src) - Arduino library for Somfy RTS
- [ECMA TC53 Spec](https://ecmatc53.github.io/spec/web/spec.html) - ECMAScript specification
- [Tasmota Somfy RTS](https://github.com/andrew01144/Tasmota-SomfyRTS) - Tasmota firmware implementation

See `references.md` for additional documentation and protocol details.