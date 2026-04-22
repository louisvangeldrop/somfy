# Somfy RTS Module for Moddable

This module implements the Somfy RTS (Radio Technology Somfy) protocol for controlling Somfy motorized blinds, shutters, and other devices. It provides motor management with rolling code security and waveform generation for RF transmission.

## Features

- Motor configuration and management with persistent storage
- Rolling code handling for security
- Somfy RTS protocol implementation
- Waveform generation for RF transmission
- Support for various Somfy commands (UP, DOWN, PROG, etc.)

## Configuration

The module uses the following configuration from `mc/config`:

```json
{
  "motors": {
    "11": { "name": "LuifelGroep", "rolling": 0 },
    "21": { "name": "Schuifdeur Tuin", "rolling": 162 },
    ...
  }
}
```

Each motor has:
- `name`: Human-readable name
- `rolling`: Rolling code (integer, will be converted from hex string if needed)

Motor configurations are stored in `somfy_motors.json` in the file system root.

## Usage

Include this module in your project's manifest.json:

```json
{
  "include": [
    "./somfy/manifest.json"
  ]
}
```

### Basic Example: Sending Commands with sendCmd()

The `sendCmd()` function is the primary way to control Somfy devices. It generates the RF timing pulses needed to send commands to motors.

```javascript
import { sendCmd, somfyCommands, getMotors, saveMotors } from "somfy";

// Load motor configurations
const motors = getMotors();

// Send an UP command to motor with ID "11"
const motorId = "11";
const motor = motors[motorId];
const timings = sendCmd(somfyCommands.UP, parseInt(motorId), motor.rolling);

// The timings array now contains the RF pulse sequence
// You need to transmit these timings using your RF module (e.g., CC1101)
// Each positive value = high signal duration (microseconds)
// Each negative value = low signal duration (microseconds)

// Example: sending with CC1101 RF module
import { transmitRF } from "path/to/your/rf-module";
transmitRF(timings);

// IMPORTANT: Increment the rolling code after successful transmission
motor.rolling++;
saveMotors(motors);
```

### Advanced Usage: Different Commands

```javascript
import { sendCmd, somfyCommands, getMotors, saveMotors } from "somfy";

const motors = getMotors();
const motorId = "21"; // "Schuifdeur Tuin"
const motor = motors[motorId];

// Send DOWN command with 3 repeats (shorter transmission)
let timings = sendCmd(somfyCommands.DOWN, parseInt(motorId), motor.rolling, 3);
transmitRF(timings);
motor.rolling++;

// Send PROG command with 5 repeats (default, more reliable)
timings = sendCmd(somfyCommands.PROG, parseInt(motorId), motor.rolling);
transmitRF(timings);
motor.rolling++;

// Send MY command (my/favorite position)
timings = sendCmd(somfyCommands.MY, parseInt(motorId), motor.rolling);
transmitRF(timings);
motor.rolling++;

// Save all changes
saveMotors(motors);
```

### Complete Workflow Example

```javascript
import { sendCmd, somfyCommands, getMotors, saveMotors } from "somfy";

function controlMotor(motorId, command, repeats = 5) {
  // Get current motors
  const motors = getMotors();
  
  // Check if motor exists
  if (!motors[motorId]) {
    trace(`Motor ${motorId} not found\n`);
    return false;
  }
  
  const motor = motors[motorId];
  
  // Generate RF timing pulses
  const timings = sendCmd(command, parseInt(motorId), motor.rolling, repeats);
  
  // Transmit the RF signal
  try {
    transmitRF(timings); // Your RF transmission function
    
    // Update rolling code for security
    motor.rolling++;
    saveMotors(motors);
    
    trace(`Sent ${command} to motor ${motorId} (${motor.name})\n`);
    return true;
  } catch (error) {
    trace(`Error transmitting to motor ${motorId}: ${error}\n`);
    return false;
  }
}

// Usage
controlMotor("11", somfyCommands.UP);           // Open LuifelGroep
controlMotor("21", somfyCommands.DOWN);         // Close Schuifdeur Tuin
controlMotor("31", somfyCommands.MY);           // Go to favorite position
```

### Important Implementation Notes

1. **RF Transmission**: The `sendCmd()` function only generates the timing array. You must provide your own RF transmission function that uses your RF module (e.g., CC1101) to actually transmit the pulses.

2. **Rolling Code Security**: The rolling code must be incremented after EVERY successful transmission. This prevents remote code replay attacks. Somfy devices reject commands with rolling codes lower than previously accepted.

3. **Repeat Count**: 
   - Default (5 repeats): Most reliable, ~60ms transmission time
   - Lower repeats (2-3): Faster but less reliable, good for time-sensitive scenarios
   - Higher repeats (7+): Maximum reliability, longer transmission time

4. **Motor ID Format**: Motor IDs in the config are strings, but must be converted to numbers when passed to `sendCmd()`.

## API Reference

### Motor Management

- `getMotors()`: Returns the current motor configurations object
- `saveMotors(motors)`: Saves the motor configurations to file

### Protocol Functions

- `getPayLoadData(cmd, address, rollingCode)`: Generates the encrypted payload data for a command
- `getWaveform(payloadData, sync)`: Generates the timing waveform for RF transmission
- `sendCmd(cmd, address, rollingCode, repeats)`: Generates complete RF transmission pulses for a Somfy command

#### sendCmd Function Details

The `sendCmd()` function is the main entry point for sending Somfy RTS commands. It orchestrates the entire process of generating the raw timing data needed to transmit a command via RF.

**Parameters:**
- `cmd` (number): The command code from `somfyCommands` (e.g., `somfyCommands.UP`)
- `address` (number): The motor/device identifier (typically a numeric ID like 11, 21, etc.)
- `rollingCode` (number): Current rolling code for the device (security feature that changes per command)
- `repeats` (number, optional): Number of repeat sequences. Defaults to 5 if not specified

**Returns:**
- An array of timing values in microseconds. Positive values represent high signal duration, negative values represent low signal duration

**How it works:**
1. Sets the number of repeats to the provided value or defaults to 5
2. Encrypts and encodes the command into a 56-bit payload frame
3. Generates the complete waveform with:
   - Initial wake-up pulse and silence (for sync=2)
   - First frame transmission with 2 hardware synchronization symbols
   - Repeated frames (based on repeats parameter) with 7 hardware synchronization symbols each
   - Manchester encoding for reliable transmission
   - Proper interframe gaps

**Example usage:**

```javascript
import { sendCmd, somfyCommands, getMotors, saveMotors } from "somfy";

const motors = getMotors();
const motorId = 11;
const motor = motors[motorId];

// Send an UP command, repeating 5 times (default)
const timings = sendCmd(somfyCommands.UP, motorId, motor.rolling);

// Or specify custom repeat count
const timings = sendCmd(somfyCommands.DOWN, motorId, motor.rolling, 3);

// Now use the timings array to transmit via RF (with your RF module)
// Don't forget to increment the rolling code after successful transmission
motor.rolling++;
saveMotors(motors);
```

**Important notes:**
- The rolling code must be incremented after each successful transmission to prevent replay attacks
- The repeats parameter affects transmission reliability and duration (more repeats = more robust but longer transmission)
- The timing array is in microseconds and must be transmitted exactly as provided for protocol compliance
- This function resets and rebuilds the internal timing buffer each time it's called

### Constants

- `somfyCommands`: Object containing command codes:
  - `MY`: 0x1
  - `UP`: 0x2
  - `MyUP`: 0x3
  - `DOWN`: 0x4
  - `MyDOWN`: 0x5
  - `UP_DOWN`: 0x6
  - `PROG`: 0x8
  - `SUN_FLAG`: 0x9
  - `CFLAG`: 0xA

## Protocol Details

The module implements the Somfy RTS protocol with:
- 56-bit frames with encryption
- Rolling code security (increments with each command)
- Checksum calculation
- Obfuscation for transmission

Waveforms are generated as arrays of positive (high) and negative (low) timing values in microseconds.

## Dependencies

- Moddable SDK
- File system access for motor configuration storage

## Notes

- Rolling codes are automatically incremented after each command
- Motor configurations are persisted to avoid code reuse
- The module includes wake-up pulses for reliable transmission

## License

[Add your license information here]</content>
<parameter name="filePath">c:\Users\louis\OneDrive\Apps\Repos\IoT\Moddable\projects\somfy\somfy\README.md