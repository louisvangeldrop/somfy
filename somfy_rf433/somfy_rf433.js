import Digital from "embedded:io/digital";
import digitalPulse from "digitalPulse";
import * as somfy from "somfy";
import config from "mc/config";

const pinTX = new Digital({ pin: config.pinTX || 20, mode: Digital.Output });
const pinVCC = new Digital({ pin: config.pinVCC || 15, mode: Digital.Output });

export const getMotors = somfy.getMotors;
export const somfyCommands = somfy.somfyCommands;
export const saveMotors = somfy.saveMotors;

export function sendCmd(cmd, address, rollingCode, repeats = 3) {
	pinVCC.write(1); // Set VCC pin highto power the RF transmitter
	let pulses = somfy.sendCmd(cmd, address, rollingCode, repeats)
	digitalPulse(pinTX, pulses)
	pinVCC.write(0); // Set VCC pin low after sending
}