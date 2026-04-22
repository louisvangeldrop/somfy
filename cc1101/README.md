# CC1101 Module for Moddable

This module provides an interface to the CC1101 low-power sub-1 GHz RF transceiver chip for use with the Moddable SDK. It is specifically configured for 433 MHz operation, suitable for applications like Somfy RTS remote control systems.

## Features

- SPI interface to CC1101 transceiver
- Pre-configured settings for 433.42 MHz (based on Tasmota SomfyRTS settings)
- Functions for reading/writing registers and sending commands
- Digital pin control for chip select (CS) and GDO0

## Hardware Requirements

- CC1101 transceiver module
- SPI connection (configurable pins)
- Digital pins for CS and GDO0

## Configuration

The module uses the following configuration from `mc/config`:

```json
{
  "spi": {
    "out": 21,
    "in": 19,
    "clock": 18,
    "hz": 1000000,
    "mode": 0,
    "active": 0,
    "port": 1
  },
  "cc1101": {
    "select": 5,
    "gdo0": 12
  }
}
```

Adjust the pin numbers according to your hardware setup.

## Usage

Include this module in your project's manifest.json:

```json
{
  "include": [
    "./cc1101/manifest.json"
  ]
}
```

In your JavaScript code:

```javascript
import { initCC1101, writeRegister, readRegister, writeCommand } from "cc1101";

// Initialize the CC1101 with default 433MHz settings
initCC1101();

// Example: Read a register
const status = readRegister(CONFIG_REGISTERS.SNOP);

// Example: Write to a register
writeRegister(CONFIG_REGISTERS.PKTCTRL0, 0x32);
```

## API Reference

### Functions

- `initCC1101()`: Initializes the CC1101 with pre-configured 433MHz settings
- `writeCommand(reg)`: Sends a command strobe to the CC1101
- `writeRegister(reg, value)`: Writes a value to a configuration register
- `readRegister(reg)`: Reads a value from a register
- `writeConfigRegisters(regs)`: Writes multiple configuration registers at once

### Constants

- `CONFIG_REGISTERS`: Object containing register addresses
- `pinTX`: Digital pin for TX (GDO0)
- `pinCS`: Digital pin for chip select

## Notes

- This module is optimized for 433 MHz operation with Somfy RTS compatibility
- SPI communication uses mode 0 with 1MHz clock
- The module includes a manual reset sequence during initialization

## License

[Add your license information here]</content>
<parameter name="filePath">c:\Users\louis\OneDrive\Apps\Repos\IoT\Moddable\projects\somfy\cc1101\README.md