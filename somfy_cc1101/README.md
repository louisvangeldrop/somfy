# Somfy CC1101 Module

This module provides functionality for controlling Somfy RTS (Radio Technology Somfy) devices, such as motorized blinds and shades, using a CC1101 radio frequency transceiver. It is designed for use with the Moddable SDK on embedded devices.

## Overview

The module implements the Somfy RTS protocol, which uses 433.42 MHz radio frequency communication. It handles the construction of Somfy command frames, including rolling code management, Manchester encoding, and transmission via the CC1101 transceiver.

## Features

- **Frame Building**: Constructs Somfy RTS frames with proper encryption, checksum calculation, and obfuscation.
- **Rolling Code Support**: Includes rolling code handling for security (though synchronization with existing remotes is left to the user).
- **Manchester Encoding**: Implements Manchester encoding for reliable data transmission.
- **CC1101 Integration**: Configures and controls the CC1101 transceiver for 433.42 MHz operation.
- **GPIO Fallback**: Includes a GPIO bit-bang fallback for testing purposes.

## Usage

### Initialization

First, initialize the CC1101 transceiver:

```javascript
import { initCC1101 } from "somfy";

initCC1101();
```

### Sending Commands

Send commands to Somfy devices using the `sendCmd` function:

```javascript
import { sendCmd, somfyCommands } from "somfy";

const address = 0x123456;  // Remote address
const rollingCode = 0x0001;  // Rolling code (must be synchronized with the device)
const repeats = 5;  // Number of frame repetitions

sendCmd(somfyCommands.UP, address, rollingCode, repeats);
```

Available commands:
- `MY`: My position
- `UP`: Up
- `MyUP`: My + Up
- `DOWN`: Down
- `MyDOWN`: My + Down
- `UP_DOWN`: Up + Down (toggle)
- `PROG`: Programming mode
- `SUN_FLAG`: Sun and Flag
- `CFLAG`: Flag

### Configuration

The module uses configuration from the manifest.json file for SPI and CC1101 pin settings. Ensure your hardware matches these configurations.

## Important Notes

- **Rolling Code**: Somfy devices use a rolling code for security. This module provides basic frame construction, but you must implement and maintain synchronization of the rolling code with your existing Somfy remote.
- **Frequency**: Configured for 433.42 MHz operation based on Tasmota settings.
- **Hardware**: Requires a CC1101 transceiver connected via SPI.
- **Protocol Details**: For in-depth information about the Somfy RTS protocol, see the references in the main project README.

## Dependencies

- Moddable SDK
- CC1101 transceiver
- SPI interface

## License

This code is provided as-is for educational and development purposes. Ensure compliance with local regulations regarding radio frequency transmissions.