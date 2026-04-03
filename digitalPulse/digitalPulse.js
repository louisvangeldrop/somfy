// export default function digitalPulse(pin, pulses) {
// 	return native("xs_digitalPulse").call(this, pin, pulses);
// }

export default function digitalPulse(pin, value, width) {
	for (let time of width) {
		const endTime = Time.microseconds + time;
		pin.write(value);
		while (Time.delta(Time.microseconds, endTime) > 0) { } // Timer.delay(time);
		value ^= 1;
	}
}