let pressedKeys: Set<string> = new Set();
let connectedGamepads: Set<number> = new Set();
export let gamepadControllers: GamepadController[] = [];

export interface ControllerReading {
	valueX: number;
	jumpHeld: boolean;
	jump: boolean;
	cancel: boolean;
}

export interface GameController {
	id: string;
	read(): ControllerReading;
	connected(): boolean;
}

interface KeyMap {
	left: string;
	right: string;
	jump: string;
	cancel: string;
}

export let standardKeyMap: KeyMap = {
	left: "KeyA",
	right: "KeyD",
	jump: "Space",
	cancel: "Escape",
};

export class KeyboardController implements GameController {
	id: string;
	private keyMap: KeyMap;
	private prevJumpHeld = false;
	private prevCancelHeld = false;

	constructor(id: string, keyMap: KeyMap) {
		this.id = id;
		this.keyMap = keyMap;
	}

	read() {
		let valueX = 0;
		if (pressedKeys.has(this.keyMap.left)) valueX -= 1;
		if (pressedKeys.has(this.keyMap.right)) valueX += 1;

		let jumpHeld = pressedKeys.has(this.keyMap.jump);
		let jump = jumpHeld && !this.prevJumpHeld;
		this.prevJumpHeld = jumpHeld;

		let cancelHeld = pressedKeys.has(this.keyMap.cancel);
		let cancel = cancelHeld && !this.prevCancelHeld;
		this.prevCancelHeld = cancelHeld;

		return {valueX, jumpHeld, jump, cancel};
	}

	connected() { return true; }
}

interface GamepadMap {
	leftButton: number|null,
	rightButton: number|null,
	horizAxis: number|null,
	jumpButton: number,
	cancelButton: number,
}

export let standardGamepadMap: GamepadMap = {
	leftButton: 14,
	rightButton: 15,
	horizAxis: 0,
	jumpButton: 0,
	cancelButton: 1,
};

export class GamepadController implements GameController {
	id: string;
	gamepad: Gamepad;
	private gamepadMap: GamepadMap;
	private prevJumpHeld = false;
	private prevCancelHeld = false;

	constructor(gamepad: Gamepad) {
		this.gamepad = gamepad;
		this.id = gamepad.index + " " + gamepad.id;
		this.gamepadMap = standardGamepadMap;
	}

	read() {
		let valueX = 0;
		if (this.buttonHeld(this.gamepad, this.gamepadMap.leftButton)) valueX -= 1;
		if (this.buttonHeld(this.gamepad, this.gamepadMap.rightButton)) valueX += 1;
		if (this.gamepadMap.horizAxis != null) {
			let v = this.gamepad.axes[this.gamepadMap.horizAxis] || 0;
			if (Math.abs(v) > 0.1) valueX += v;
			if (valueX > 1) valueX = 1;
			if (valueX < -1) valueX = -1;
		}

		let jumpHeld = this.gamepad.buttons[this.gamepadMap.jumpButton].pressed;
		let jump = jumpHeld && !this.prevJumpHeld;
		this.prevJumpHeld = jumpHeld;

		let cancelHeld = this.buttonHeld(this.gamepad, this.gamepadMap.cancelButton);
		let cancel = cancelHeld && !this.prevCancelHeld;
		this.prevCancelHeld = cancelHeld;

		return {valueX, jumpHeld, jump, cancel};
	}

	connected() { return connectedGamepads.has(this.gamepad.index); }

	private buttonHeld(pad: Gamepad, btn: number|null) {
		if (btn == null) return false;
		if (btn > pad.buttons.length) return false;

		return pad.buttons[btn].pressed;
	}
}

export function tick() {
	if (navigator.getGamepads) {
		let gps = navigator.getGamepads(); // Poll
		for (let controller of gamepadControllers) {
			let gp = gps[controller.gamepad.index];
			if (!gp) continue;
			controller.gamepad = gp;
		}
	}
}

window.addEventListener("keydown", evt => pressedKeys.add(evt.code));
window.addEventListener("keyup", evt => pressedKeys.delete(evt.code));
window.addEventListener("gamepadconnected", evt => {
	connectedGamepads.add(evt.gamepad.index);

	let exists = false;
	for (let controller of gamepadControllers) {
		if (controller.gamepad.index == evt.gamepad.index) {
			controller.gamepad = evt.gamepad;
			exists = true;
			break;
		}
	}

	if (!exists) {
		gamepadControllers.push(new GamepadController(evt.gamepad));
	}
});

window.addEventListener("gamepaddisconnected", evt => {
	connectedGamepads.delete(evt.gamepad.index);
});
