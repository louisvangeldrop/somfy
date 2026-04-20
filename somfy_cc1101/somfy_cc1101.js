import digitalPulse from "digitalPulse";
import * as somfy from "somfy";
import * as cc1101 from "cc1101";
import config from "mc/config";

cc1101.initCC1101();

export const getMotors = somfy.getMotors;
export const somfyCommands = somfy.somfyCommands;
export const saveMotors = somfy.saveMotors;

export function sendCmd(cmd, address, rollingCode, repeats = 3) {
	cc1101.writeCommand(cc1101.CONFIG_REGISTERS.STX)	// STX
	let pulses = somfy.sendCmd(cmd, address, rollingCode, repeats)
	pulses = pulses.map(p => -p)	// Invert pulses for active low for CC1101
	digitalPulse(cc1101.pinTX, pulses)
	cc1101.writeCommand(cc1101.CONFIG_REGISTERS.SIDLE); // SIDLE
}
