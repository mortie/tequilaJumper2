import Lobby from './Lobby';
import * as gamecontrollers from './gamecontrollers';

function require<T>(x: T|null): T {
	if (!x) {
		throw Error("Required value was null");
	}

	return x;
}

let canvas = require(document.getElementById("canvas")) as HTMLCanvasElement;
let ctx = require(canvas.getContext("2d"));

let can = {ctx, width: 0, height: 0};
let dpr = window.devicePixelRatio ? window.devicePixelRatio : 1;
function size() {
	can.width = canvas.offsetWidth;
	can.height = canvas.offsetHeight;
	canvas.width = can.width * dpr;
	canvas.height = can.height * dpr;
}
window.addEventListener("resize", size);
size();

let lobby = new Lobby();

let fpsClasses = [30, 60, 75, 90, 120, 144];
let dtClasses = fpsClasses.map(fps => {
	let dt = 1 / fps;
	let variance = dt * 0.02;
	return {dt, min: dt - variance, max: dt + variance};
});

let rollingDt = 1 / 10;
let prevTime: DOMHighResTimeStamp|null = null;
function update(now: DOMHighResTimeStamp) {
	gamecontrollers.tick();

	requestAnimationFrame(update);
	if (prevTime == null) {
		prevTime = now;
		return;
	}

	let dt = (now - prevTime) / 1000;
	prevTime = now;
	rollingDt = rollingDt * 0.9 + dt * 0.1;

	let fixedDt = rollingDt;
	for (let dtClass of dtClasses) {
		if (rollingDt >= dtClass.min && rollingDt <= dtClass.max) {
			fixedDt = dtClass.dt;
			break;
		}
	}

	canvas.width = canvas.width;
	ctx.scale(dpr, dpr);

	lobby.update(can, fixedDt);
}

requestAnimationFrame(update);
