import SPI from "embedded:io/spi";
import Digital from "embedded:io/digital";
import config from "mc/config";

const spiConfig = config.spi || {};
const cc1101Config = config.cc1101 || {}
const defaultSPIConfig = { io: SPI }
const spi = new SPI({ ...defaultSPIConfig, ...spiConfig });
export const pinTX = new Digital({ pin: cc1101Config.gdo0, mode: Digital.Output });
export const pinCS = new Digital({ pin: cc1101Config.select, mode: Digital.Output });

export const CONFIG_REGISTERS = {
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

export function writeCommand(reg) {
	pinCS.write(0)
	// while (pinMISO.read()) { }	
	spi.write(Uint8Array.of(reg))
	pinCS.write(1)
}

export function writeRegister(reg, value) {
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

export function writeConfigRegisters(regs) {
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
