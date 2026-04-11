import Digital from "embedded:io/digital";
import digitalPulse from "digitalPulse";

const led = new Digital({
	pin: device.pin.led,
	mode: Digital.Output,
});
// Create pulses for 100 blinks: 1000*1000us high, 1000*1000us low, repeated 100 times
let pulses = [];
for (let i = 0; i < 100; i++) {
	pulses.push(1e6, -1e6);
}

digitalPulse(led, pulses);
