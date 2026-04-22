import { Server } from "http";
import Net from "net";
import MDNS from "mdns";
import config from "mc/config";
import * as Somfy from "somfy_rts"; // Import the somfy module (either somfy_rf433 or somfy_cc1101 based on manifest)

const ssid = config.ssid;
const password = config.password;
const hostName = config.mdns;

var repeats = config.repeats || 5; // Default aantal herhalingen als niet gespecificeerd in config

const somfy = Somfy
var motors = somfy.getMotors();

async function setup() {
	let ip = Net.get("IP");
	trace(`Gebruik: http://${ip}/somfy?id=11&action=up\n`);

	try {
		let mdns = new MDNS({ hostName }, function (message, value) {
			if (MDNS.hostName === message) {
				// hostName = value;
				return value;
			}
		});
	}
	catch (e) {
		trace(`mdns catch: ${e}\n`);
		rej(e);
	}

	const server = new Server({ port: 80 });
	server.callback = function (message, value) {
		if (message === Server.status) {
			this.path = value;
			let queryIndex = this.path.indexOf('?');
			let queryParams = {};

			if (queryIndex !== -1) {
				let queryString = this.path.substring(queryIndex + 1);
				// Splits de query string in key=value paren
				let pairs = queryString.split('&');
				for (let pair of pairs) {
					let [key, value] = pair.split('=');
					queryParams[key] = value;
				}
			}
			this.query = queryParams;
		} else if (message === Server.prepareResponse) {
			let path = this.path;
			let query = this.query || {};

			if (path.startsWith("/somfy")) {
				let id = query.id;
				let action = (query.action || "down").toUpperCase();
				repeats = parseInt(query.repeats ?? 5); // Gebruik repeats uit query als aanwezig, anders de globale waarde

				let motor = motors[id];
				if (!motor) {
					motor = { name: `Motor ${id}`, rolling: 0 };
					motors[id] = motor;
					somfy.saveMotors(motors);
					this.status = 404;
					this.write(`ID: ${id} added\n`);
					this.end();
					return;
				}

				let cmd = somfy.somfyCommands[action] ?? 0

				if (cmd === 0) {
					return { status: 404, body: "Unknown command. Use UP, DOWN, MY or PROG\n" };
				}

				somfy.sendCmd(cmd, parseInt(id), motor.rolling, repeats);
				try {
					motors[id].rolling += 1
					somfy.saveMotors(motors);
				}
				catch (e) {
					trace(`Error during save: ${e}\n`);
				}
				return { status: 200, body: JSON.stringify({ ...{ id }, ...motor }) };

			} else {
				return { status: 404, body: "Use /somfy?id=XX&action=up\n" };

			}
		}
	}
}
setup().catch(e => trace(`Error: ${e}\n`))