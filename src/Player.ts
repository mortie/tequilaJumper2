import Game, {Box} from './Game';
import {GameController} from './gamecontrollers';

function clamp(x: number, max: number, min: number) {
	if (x > max) return max;
	if (x < min) return min;
	return x;
}

export default class Player {
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
				for (let entity of this.game.entities) {
					if (!entity.props.platform) continue;
					if (this.box.bottomIntersects(entity.box)) {
						this.box.y = entity.box.y - this.box.height;
						this.velocity.y = 0;
						this.jumpThrusting = false;
						this.onGround = true;
						moveY = 0;
						break;
					}
				}
			}
		}

		// Speed boost if you hold jump and touch a platform
		if (reading.jumpHeld) {
			for (let entity of this.game.entities) {
				if (!entity.props.platform) continue;
				if (this.box.intersects(entity.box)) {
					this.velocity.y -= 100 * dt;
					break;
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

	draw(ctx: CanvasRenderingContext2D) {
		ctx.strokeStyle = "black";
		ctx.lineWidth = 0.1;
		let box = this.box;
		let shift = -this.velocity.x * 0.03;
		let stretch = this.velocity.y * 0.02;
		if (stretch > 0.9) stretch = 0.9;
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.moveTo(box.x, box.y + box.height);
		ctx.lineTo(box.x + box.width, box.y + box.height);
		ctx.lineTo(box.x + box.width + shift, box.y - stretch);
		ctx.lineTo(box.x + shift, box.y - stretch);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}
}
