import Digital from "embedded:io/digital";
import digitalPulse from "digitalPulse";
import * as somfy from "somfy";
import config from "mc/config";
const pinTX = new Digital({ pin: config.pinTX || 31, mode: Digital.Output });
const pinVCC = new Digital({ pin: config.pinVCC || 13, mode: Digital.Output });

export const somfyCommands = somfy.somfyCommands;

export function sendCmd(cmd, address, rollingCode, repeats = 3) {
	pinVCC.write(1); // Zet TX pin hoog
	let pulses = somfy.sendCmd(cmd, address, rollingCode, repeats)
	digitalPulse(pinTX, pulses)
	pinVCC.write(0); // Zet TX pin laag na het verzenden
}
