import SPI from "embedded:io/spi";
import Digital from "embedded:io/digital";
import digitalPulse from "digitalPulse";
import config from "mc/config";
import Timer from "timer";

const spiConfig = config.spi || {};
const cc1101Config = config.cc1101 || {}
const defaultSPIConfig = { io: SPI }
const spi = new SPI({ ...defaultSPIConfig, ...spiConfig });
const pinTX = new Digital({ pin: cc1101Config.gdo0, mode: Digital.Output });
const pinCS = new Digital({ pin: cc1101Config.select, mode: Digital.Output });

var symbol = 640
var timingsUs = [];
var last = -1; // -1 = start, 0 = low, 1 = high

const CONFIG_REGISTERS = {
	IOCFG2: 0x00,
	IOCFG1: 0x01,
	IOCFG0: 0x02,
	FIFOTHR: 0x03,
	SYNC1: 0x04,
	SYNC0: 0x05,
	PKTLEN: 0x06,
	PKTCTRL1: 0x07,
	PKTCTRL0: 0x08,
	ADDR: 0x09,
	CHANNR: 0x0a,
	FSCTRL1: 0x0b,
	FSCTRL0: 0x0c,
	FREQ2: 0x0d,
	FREQ1: 0x0e,
	FREQ0: 0x0f,
	MDMCFG4: 0x10,
	MDMCFG3: 0x11,
	MDMCFG2: 0x12,
	MDMCFG1: 0x13,
	MDMCFG0: 0x14,
	DEVIATN: 0x15,
	MCSM2: 0x16,
	MCSM1: 0x17,
	MCSM0: 0x18,
	FOCCFG: 0x19,
	BSCFG: 0x1a,
	AGCCTRL2: 0x1b,
	AGCCTRL1: 0x1c,
	AGCCTRL0: 0x1d,
	WOREVT1: 0x1e,
	WOREVT0: 0x1f,
	WORCTRL: 0x20,
	FREND1: 0x21,
	FREND0: 0x22,
	FSCAL3: 0x23,
	FSCAL2: 0x24,
	FSCAL1: 0x25,
	FSCAL0: 0x26,
	RCCTRL1: 0x27,
	RCCTRL0: 0x28,
	FSTEST: 0x29,
	PTEST: 0x2a,
	AGCTEST: 0x2b,
	TEST2: 0x2c,
	TEST1: 0x2d,
	TEST0: 0x2e,

	// Commands
	SRES: 0x30,
	SCAL: 0x33,
	SIDLE: 0x36,
	STX: 0x35,
	SPWD: 0x39,
	SFTX: 0x3B,
	SFRX: 0x3A,
	SNOP: 0x3D
};
const TASMOTA_433433MHZ = {		// tasmota 433.42MHz settings, see https://github.com/andrew01144/Tasmota-SomfyRTS
	IOCFG0: 0x0D,
	PKTCTRL0: 0x32,
	FIFOTHR: 0x47,
	PKTCTRL0: 0x32,
	FSCTRL1: 0x06,
	FREQ2: 0x10,
	FREQ1: 0xab,
	FREQ0: 0x85,
	MDMCFG4: 0xf6,
	MDMCFG3: 0x83,
	MDMCFG2: 0x33,
	DEVIATN: 0x15,
	MCSM0: 0x18,
	FOCCFG: 0x16,
	WORCTRL: 0xf8,
	FREND0: 0x11,
	FSCAL3: 0xE9,
	FSCAL2: 0x2A,
	FSCAL1: 0x00,
	FSCAL0: 0x1F,
	TEST2: 0x81,
	TEST1: 0x35,
	TEST0: 0x09
};

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

function writeCommand(reg) {
	pinCS.write(0)
	// while (pinMISO.read()) { }	
	spi.write(Uint8Array.of(reg))
	pinCS.write(1)
}

function writeRegister(reg, value) {
	pinCS.write(0)
	// while (pinMISO.read()) { }
	spi.write(Uint8Array.of(reg))
	spi.write(Uint8Array.of(value));
	pinCS.write(1)
}

export function readRegister(reg) {
	pinCS.write(0)
	// while (pinMISO.read()) { }
	const buffer = Uint8Array.from([reg, 0xff]);
	spi.transfer(buffer);
	pinCS.write(1);
	return buffer;
}

function writeConfigRegisters(regs) {
	for (var _i = 0, _a = Object.keys(regs); _i < _a.length; _i++) {
		var reg = _a[_i];
		var value = regs[reg];
		writeRegister(CONFIG_REGISTERS[reg], value)
	}
};

export function initCC1101() {
	// pinCS wiggling to initiate manual reset (manual page 45)
	// Note: the 1ms-1ms prepending is a "hack" to get around an issue with the ESP8266's
	// RTC timing limtation with the Espruino firmware, see https://github.com/espruino/Espruino/issues/1749
	// digitalPulse(pinCS, false, [1, 1]);
	// pinCS.write(false);
	writeCommand(CONFIG_REGISTERS.SRES);  //STROBE_SRES = 0x30. Reset
	writeConfigRegisters(TASMOTA_433433MHZ)
	writeRegister(0x7e, 0xc0);	//max power
};

function addHigh(us) {
	if (last === 1) {
		timingsUs[timingsUs.length - 1] += us;
	} else {
		timingsUs.push(us);
		last = 1;
	}
}

function addLow(us) {
	if (last === 0) {
		timingsUs[timingsUs.length - 1] += us;
	} else {
		timingsUs.push(us);
		last = 0;
	}
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
	last = -1;
	getWaveform(payloadData, 2);
	for (let i = 0; i < repeats; i++) {
		getWaveform(payloadData, 7)
	}
	return timingsUs  // .map(p => p / 1000); // Scale down timings for digitalPulse (which has a max of 65535 microseconds)
}

export function sendCmd(cmd, address, rollingCode, repeats) {
	repeats = repeats || 5
	let frame = getPayLoadData(cmd, address, rollingCode)
	let pulses = getPulses(frame, repeats)
	writeCommand(CONFIG_REGISTERS.STX)	// STX
	Timer.delay(5)
	digitalPulse(pinTX, false, pulses)
	writeCommand(CONFIG_REGISTERS.SIDLE); // SIDLE
}
