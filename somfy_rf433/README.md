# somfy_rf433

This module provides RF transmission support for Somfy RTS commands using a simple 433 MHz transmitter connected to an ESP32 running Moddable.

It integrates the Somfy command encoder from `../somfy/somfy.js` with the `digitalPulse` module to generate the proper RF pulse train.

## Purpose

`somfy_rf433` is used to send Somfy RTS commands directly over a generic 433 MHz transmitter without a dedicated CC1101 transceiver.

## Files

- `somfy_rf433.js` - module implementation that powers the RF transmitter and sends Somfy commands.
- `manifest.json` - module manifest with build includes, module definitions, and default GPIO configuration.

## Usage

Import the module and call `sendCmd()` to transmit Somfy commands:

```js
import * as somfy from "somfy_rf433";

const command = "DOWN";
const address = 0x123456; // Somfy device address
const rollingCode = 0x0001;
const repeats = 3;

somfy.sendCmd(command, address, rollingCode, repeats);
```

## Behavior

- Powers the RF transmitter by driving `pinVCC` high before sending.
- Uses `somfy.sendCmd()` to generate the Somfy pulse pattern.
- Sends the pulse sequence through `digitalPulse()` on `pinTX`.
- Turns the RF transmitter power off after transmission.

## Configuration

Default pins are defined in `manifest.json`:

- `pinTX`: 20
- `pinVCC`: 15

You can override these in your project configuration if your board uses different GPIO pins.

## Dependencies

This module depends on:

- `somfy` (Somfy command encoding)
- `digitalPulse` (pulse generation)
- Moddable SDK runtime

## Notes

- The module assumes an external 433 MHz RF transmitter is connected and powered through the configured VCC pin.
- The actual Somfy command set and rolling code management are handled by the `somfy` module.
