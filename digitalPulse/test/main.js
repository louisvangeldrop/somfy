import Digital from "embedded:io/digital";
import digitalPulse from "digitalPulse";

const led = new Digital({
	pin: device.pin.led,
	mode: Digital.Output,
});
// Create pulses for 100 blinks: 1000us high, 1000us low, repeated 100 times
let pulses = [];
for (let i = 0; i < 300; i++) {
	pulses.push(1000, -1000);
}

digitalPulse(led, pulses);
