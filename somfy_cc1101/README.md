# somfy_cc1101

This module provides CC1101-based transmission support for Somfy RTS commands in the Moddable project.

It integrates the Somfy command encoder from `../somfy/somfy.js` with the `cc1101` transceiver and the `digitalPulse` module for RF pulse output.

## Purpose

`somfy_cc1101` converts Somfy protocol commands into CC1101-compatible pulse sequences and sends them through the CC1101 radio.

## Files

- `somfy_cc1101.js` - module implementation that initializes CC1101 and sends Somfy commands.
- `manifest.json` - module manifest with build includes and dependencies.

## Usage

Import the module and use `sendCmd()` to transmit Somfy commands:

```js
import * as somfyCC1101 from "somfy_cc1101";

const command = "UP";
const address = 0x123456; // Somfy device address
const rollingCode = 0x0001;
const repeats = 3;

somfyCC1101.sendCmd(command, address, rollingCode, repeats);
```

## Behavior

- Calls `cc1101.initCC1101()` to initialize the CC1101 radio.
- Uses `somfy.sendCmd()` to build the Somfy pulse pattern.
- Inverts pulses for CC1101's active-low output.
- Uses `digitalPulse()` to send RF pulses on the configured transmit pin.
- Returns the radio to `SIDLE` after transmission.

## Dependencies

This module depends on:

- `somfy` (command encoding)
- `cc1101` (CC1101 transceiver control)
- `digitalPulse` (pulse generation)
- Moddable SDK runtime

## Notes

- The module expects CC1101 hardware initialization to be performed before sending commands.
- The actual Somfy command set and rolling code management are handled by the `somfy` module.
