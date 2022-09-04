import {GameController} from './gamecontrollers';
import Canvas from './Canvas';

function clamp(x: number, max: number, min: number) {
	if (x > max) return max;
	if (x < min) return min;
	return x;
}

class Box {
	x: number;
	y: number;
	width: number;
	height: number;

	constructor(x: number, y: number, width: number, height: number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	intersects(other: Box) {
		return (
			this.x + this.width >= other.x && this.x <= other.x + other.width &&
			this.y + this.height >= other.y && this.y <= other.y + other.height);
	}

	bottomIntersects(other: Box) {
		return (
			this.x + this.width >= other.x && this.x <= other.x + other.width &&
			this.y + this.height >= other.y && this.y +this.height <= other.y + other.height);
	}
}

interface Platform {
	box: Box;
}

class Player {
	game: Game;
	controller: GameController;
	color: string;
	box: Box;
	velocity = {x: 0, y: 0};
	onGround = false;
	lost = false;

	jumpThrusting = false;
	jumpThrustTimer = 0;

	constructor(game: Game, controller: GameController, color: string, x: number, y: number) {
		this.game = game;
		this.controller = controller;
		this.color = color;
		this.box = new Box(x, y, 1, 1);
		this.box.x -= this.box.width / 2;
		this.box.y -= this.box.height / 2;
	}

	update(dt: number) {
		let dragForce = this.onGround ? 4 : 3;
		let moveForce = this.onGround ? 120 : 90;

		let reading = this.controller.read();
		this.velocity.x += reading.valueX * moveForce * dt;
		this.velocity.y += 50 * dt;
		if (this.velocity.y > -0.1) {
			this.velocity.y += (this.velocity.y + 0.1) * dt;
		}

		this.velocity.x -= this.velocity.x * dragForce * dt;

		// Stepwise move in X axis
		let moveX = this.velocity.x * dt;
		while (moveX != 0) {
			let delta = clamp(moveX, 0.5, -0.5);
			moveX -= delta;
			this.box.x += delta;
		}

		// Stepwise move in Y axis
		let moveY = this.velocity.y * dt;
		this.onGround = false;
		while (moveY != 0) {
			let delta = clamp(moveY, 0.2, -0.2);
			moveY -= delta;
			this.box.y += delta;

			if (this.velocity.y > 0) {
				for (let platform of this.game.platforms) {
					if (this.box.bottomIntersects(platform.box)) {
						this.box.y = platform.box.y - this.box.height;
						this.velocity.y = 0;
						this.jumpThrusting = false;
						this.onGround = true;
						moveY = 0;
						break;
					}
				}
			}
		}

		if (this.jumpThrusting && (!reading.jumpHeld || this.onGround)) {
			this.jumpThrusting = false;
		}

		if (this.jumpThrusting) {
			this.velocity.y -= 150 * (0.5 - this.jumpThrustTimer) * dt;
			this.jumpThrustTimer += dt;
			if (this.jumpThrustTimer > 0.2) {
				this.jumpThrusting = false;
			}
		}

		if (this.onGround && reading.jumpHeld) {
			this.velocity.y -= 14;
			this.box.y -= 0.1;
			this.onGround = false;
			this.jumpThrusting = true;
			this.jumpThrustTimer = 0;
		}
	}
}

export default class Game {
	players: Player[] = [];
	platforms: Platform[] = [];
	paused = false;
	camera = {x: 0, y: 0};
	winner: Player|null = null;

	constructor() {
		this.platforms.push({box: new Box(-100, 2, 200, 1)});
		this.platforms.push({box: new Box(2, -1, 4, 0.5)});
		this.platforms.push({box: new Box(-5, -6, 4, 0.7)});
		this.platforms.push({box: new Box(-10, -9, 4, 0.7)});
		this.platforms.push({box: new Box(0, -13, 9, 1)});
	}

	update(can: Canvas, dt: number) {
		if (dt > 0.1) {
			console.warn("Delta time too big (" + dt + "s), campping to 100ms");
			dt = 0.1;
		}

		let ctx = can.ctx;
		ctx.translate(can.width / 2, can.height / 1.5);
		ctx.scale(30, 30);

		let liveCount = 0;
		let camCenter = {x: 0, y: 0};
		for (let player of this.players) {
			if (player.lost) continue;
			camCenter.x += player.box.x + player.box.width / 2;
			camCenter.y += player.box.y + player.box.height / 2;
			liveCount += 1;
		}

		if (liveCount > 0) {
			camCenter.x /= liveCount;
			camCenter.y /= liveCount;

			let camDeltaX = camCenter.x - this.camera.x;
			this.camera.x += camDeltaX * 10 * dt;
			let camDeltaY = camCenter.y - this.camera.y;
			this.camera.y += camDeltaY * 10 * dt;

		}

		ctx.translate(-this.camera.x, -this.camera.y);

		let actualLivePlayer = null;
		let maybeLivePlayer = null;
		liveCount = 0;
		for (let player of this.players) {
			if (player.lost) continue;
			maybeLivePlayer = player;
			player.update(dt);
			if (player.box.y > camCenter.y + 15) {
				player.lost = true;
			} else {
				actualLivePlayer = player;
				liveCount += 1;
			}
		}

		if (liveCount <= 1 && this.players.length > 1) {
			if (liveCount == 0) {
				this.winner = maybeLivePlayer;
			} else {
				this.winner = actualLivePlayer;
			}
			return;
		}

		ctx.strokeStyle = "black";
		ctx.lineWidth = 0.1;
		for (let player of this.players) {
			let box = player.box;
			let shift = -player.velocity.x * 0.03;
			let stretch = player.velocity.y * 0.02;
			if (stretch > 0.9) stretch = 0.9;
			ctx.fillStyle = player.color;
			ctx.beginPath();
			ctx.moveTo(box.x, box.y + box.height);
			ctx.lineTo(box.x + box.width, box.y + box.height);
			ctx.lineTo(box.x + box.width + shift, box.y - stretch);
			ctx.lineTo(box.x + shift, box.y - stretch);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		}

		ctx.fillStyle = "#b64b00";
		for (let platform of this.platforms) {
			let box = platform.box;
			ctx.fillRect(box.x, box.y, box.width, box.height);
			ctx.strokeRect(box.x, box.y, box.width, box.height);
			ctx.fillStyle = "#ddd";
		}
	}

	addPlayer(controller: GameController, color: string) {
		let x = (Math.random() * 2 - 1) * 5;
		let player = new Player(this, controller, color, x, 0);
		this.players.push(player);
	}
}
