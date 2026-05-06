// Motor management
import { File, Iterator, System } from "file";
import structuredClone from "structuredClone";
import config from "mc/config";

const motorsFileName = config.file.root + "somfy_motors.json";

export function getMotors() {
	let motors = structuredClone(config.motors)
	try {
		let file = new File(motorsFileName, true);
		let json = file.read(String);
		file.close();
		motors = JSON.parse(json);
	} catch (e) {
		trace("somfy_motors.json not found → empty list\n");
	}

	// Rolling codes string=> number
	Object.keys(motors).forEach(id => {
		if (typeof motors[id].rolling === "string") {
			motors[id].rolling = parseInt(motors[id].rolling, 16);
		}
	});
	return motors;
}

export function saveMotors(motors) {
	try {
		let file = new File(motorsFileName, true);
		file.write(JSON.stringify(motors, null, 2));
		file.close();
	}
	catch (e) {
		trace(`Error saving motors: ${e}\n`);
	}
}
//* End of motor management

// SOMFY protocol implementation

var symbol = 640
var timingsUs = [];

export const somfyCommands = {
	MY: 0x1,
	UP: 0x2,
	MyUP: 0x3,
	DOWN: 0x4,
	MyDOWN: 0x5,
	UP_DOWN: 0x6,
	PROG: 0x8,
	SUN_FLAG: 0x9,
	CFLAG: 0xA
}

function addHigh(us) {
	timingsUs.push(us);
}

function addLow(us) {
	timingsUs.push(-us);
}

function getPayLoadData(cmd, address, rollingCode) {

	let frame = [];

	frame.push(0xA7);						// [0] Encryption key. Doesn't matter much
	frame.push(cmd << 4);					// [1] Button pressed? The 4 LSB will be the checksum
	frame.push(rollingCode >> 8);			// [2] Rolling code (big endian)
	frame.push(rollingCode & 0xFF);			// [3] Rolling code
	frame.push(address >> 16) & 0xff;		// [4] Remote address
	frame.push((address >> 8) & 0xFF);		// [5] Remote address
	frame.push(address & 0xFF);				// [6] Remote address (big endian). Maakt niet uit of de adres bytes big endian of little endian zijn, zolang ze maar in dezelfde volgorde staan als bij het berekenen van de checksum

	// The checksum is calculated by doing a XOR of all bytes of the frame
	let checksum = frame.reduce((acc, cur) => acc ^ cur ^ (cur >> 4), 0);

	checksum &= 0b1111;		// Keep the last 4 bits only
	frame[1] |= checksum;	// Add the checksum to the 4 LSB

	// The payload data is obfuscated by doing an XOR between
	// the byte to obfuscate and the previous obfuscated byte
	for (let i = 1; i < frame.length; i++) {
		frame[i] ^= frame[i - 1];
	}

	return frame;
}

function getWaveform(payloadData, sync) {

	// Wake up pulse + silence
	if (sync === 2) {
		addHigh(9415);
		addLow(89565);
	}

	// Repeating frames
	// Hardware synchronization
	for (let j = 0; j < sync; j++) {
		addHigh(4 * symbol);
		addLow(4 * symbol);
	}

	// Software synchronization
	addHigh(4550);
	addLow(symbol);

	// Manchester enconding of payload data
	for (let i = 0; i < 7; i++) {
		let mask = 0x80
		while (mask > 0) {
			if (payloadData[i] & mask) {
				addLow(symbol);
				addHigh(symbol);
			} else {
				addHigh(symbol);
				addLow(symbol);
			}
			mask >>= 1;
		}
	}

	// Interframe gap
	addLow(30415);

	return timingsUs;
}

function getPulses(payloadData, repeats) {
	timingsUs = [];
	getWaveform(payloadData, 2);
	for (let i = 0; i < repeats; i++) {
		getWaveform(payloadData, 7)
	}
}

export function sendCmd(cmd, address, rollingCode, repeats) {
	repeats = repeats || 5
	let frame = getPayLoadData(cmd, address, rollingCode)
	getPulses(frame, repeats)
	return timingsUs
}
