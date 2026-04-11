export default function digitalPulse(pin, pulses) {
	return native("xs_digitalPulse").call(this, pin, pulses);
}

// import Time from "time";

// export default function digitalPulse(pin, value, width) {
// // see Espruino definition. Width is in microseconds
// 	for (let time of width) {
// 		const endTime = Time.microseconds + time;
// 		pin.write(value);
// 		while (Time.delta(Time.microseconds, endTime) > 0) { } // Timer.delay(time);
// 		value ^= 1;
// 	}
// }