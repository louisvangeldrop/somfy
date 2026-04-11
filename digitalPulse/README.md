# DigitalPulse Module

## Overview

The `digitalPulse` module provides a native function to generate precise digital pulse sequences on GPIO pins. It enables rapid toggling of digital output pins with microsecond-level timing control, useful for LED blinking, signal generation, and communication protocols.

## Description

`digitalPulse` is a high-performance hardware-accelerated function that generates precise pulse sequences on a digital output pin. Positive values in the array represent HIGH pulses, while negative values represent LOW pulses. The absolute value specifies the duration in microseconds. Rather than toggling the pin in software (which would be memory and CPU intensive for many pulses), digitalPulse uses native C code to generate the pulse sequence efficiently.

## Usage

### Basic Syntax

```javascript
import digitalPulse from "digitalPulse";

digitalPulse(pin, pulses);
```

### Parameters

- **pin** (Digital): A Digital output pin object
- **pulses** (Array): An array of integers representing pulse durations in microseconds
  - Positive values represent HIGH pulses with the specified duration
  - Negative values represent LOW pulses with the specified duration
  - Values alternate between high and low states in the array

## Example: LED Blinking

```javascript
import Digital from "embedded:io/digital";
import digitalPulse from "digitalPulse";

// Initialize LED pin as digital output
const led = new Digital({
	pin: device.pin.led,
	mode: Digital.Output,
});

// Create 100 blinks: 1ms HIGH, 1ms LOW
let pulses = [];
for (let i = 0; i < 100; i++) {
	pulses.push(1e6, -1e6);  // +1e6 = 1sec HIGH, -1e6 = 1sec LOW (1e6 microseconds = 1 millisecond)
}

// Generate the pulse sequence
digitalPulse(led, pulses);
```

## Test

The included test demonstrates toggling an LED 100 times with 1-second HIGH and 1-second LOW periods, producing a visible blinking effect. Run the test with:

```bash
mcconfig -m -p esp32 test/manifest.json
```

Note: The `-d` parameter is omitted for accurate timing values on single-core CPUs.

## Implementation

The module provides two different implementations:

### Native C Implementation (Current)

The active implementation uses native C code (`xs_digitalPulse`) for maximum efficiency and precision. It accepts a pulse array with:
- **Positive values**: HIGH pulses with the specified duration in microseconds
- **Negative values**: LOW pulses with the specified duration in microseconds

### Alternative JavaScript Implementation (Espruino Protocol)

A JavaScript fallback implementation is available (commented out in the source). This version follows the Espruino protocol with a different API:
- **Initial parameter**: A boolean value indicating whether to pulse high (`true`) or low (`false`)
- **Width parameter**: An array of durations in microseconds for each pulse
- **Behavior**: Starts with the specified initial state and alternates through the width array

This implementation relies on microsecond-precision timing via the Time module, toggling the pin state for each specified duration.

## Dependencies

- `embedded:io/digital` - Digital I/O module
- Native C implementation in companion C module

## Use Cases

- LED control and effects
- Timing-sensitive signal generation
- Pulse-width modulation (PWM) simulation
- Protocol signal generation
- Visual feedback on embedded devices
