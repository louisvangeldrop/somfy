import { Server } from "http";
import Net from "net";
import MDNS from "mdns";
import { File, Iterator, System } from "file";
import structuredClone from "structuredClone";
import config from "mc/config";
import * as Somfy from "somfy";

const ssid = config.ssid;
const password = config.password;
const hostName = config.mdns;

var repeats = config.repeats || 5; // Default aantal herhalingen als niet gespecificeerd in config

let motors = structuredClone(config.motors)

// ==================== Jouw motoren laden ====================
let file;
const motorsFileName = config.file.root + "somfy_motors.json";
try {
	file = new File(motorsFileName, true);
	let json = file.read(String);
	file.close();
	motors = JSON.parse(json);
} catch (e) {
	trace("somfy_motors.json niet gevonden → lege lijst\n");
}

// Rolling codes omzetten van string naar nummer
Object.keys(motors).forEach(id => {
	if (typeof motors[id].rolling === "string") {
		motors[id].rolling = parseInt(motors[id].rolling, 16);
	}
});

function saveMotors() {
	try {
		file = new File(motorsFileName, true);
		file.write(JSON.stringify(motors, null, 2));
		file.close();
	}
	catch (e) {
		trace(`Fout bij opslaan: ${e}\n`);
	}
}

const somfy = Somfy
somfy.initCC1101()

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
					saveMotors();
					this.status = 404;
					this.write("Onbekende ID\n");
					this.end();
					return;
				}

				let cmd = somfy.somfyCommands[action] ?? 0

				if (cmd === 0) {
					return { status: 404, body: "Onbekend commando.Gebruik UP.DOWN, MY of PROG\n" };
				}

				somfy.sendCmd(cmd, parseInt(id), motor.rolling, repeats);
				try {
					motors[id].rolling += 1
					saveMotors();
				}
				catch (e) {
					trace(`Fout bij opslaan: ${e}\n`);
				}
				return { status: 200, body: `${motor.name} (${id}): ${action} uitgevoerd\n` };

			} else {
				return { status: 404, body: "Gebruik /somfy?id=XX&action=up\n" };

			}
		}
	}
}
setup().catch(e => trace(`Fout: ${e}\n`))