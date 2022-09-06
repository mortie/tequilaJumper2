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
	wobble = {x: 0, y: 0};
	wobbleVelocity = {x: 0, y: 0};
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

		this.velocity.y += 50 * dt;
		if (this.velocity.y > -0.1) {
			this.velocity.y += (this.velocity.y + 0.1) * dt;
		}

		let initialVX = this.velocity.x;
		let initialVY = this.velocity.y;

		let reading = this.controller.read();
		this.velocity.x += reading.valueX * moveForce * dt;

		this.velocity.x -= this.velocity.x * dragForce * dt;

		this.wobbleVelocity.x -= (80 * this.wobble.x + 1.6 * this.wobbleVelocity.x) * 5 * dt;
		this.wobbleVelocity.y -= (80 * this.wobble.y + 1.6 * this.wobbleVelocity.y) * 5 * dt;
		this.wobble.x += this.wobbleVelocity.x * dt;
		this.wobble.y += this.wobbleVelocity.y * dt;

		// Stepwise move in X axis
		let moveX = this.velocity.x * dt;
		while (moveX != 0) {
			let delta = clamp(moveX, 0.5, -0.5);
			moveX -= delta;
			this.box.x += delta;

			for (let entity of this.game.entities) {
				if (!entity.props.wall) continue;
				if (!this.box.intersects(entity.box)) continue;
				if (this.velocity.x > 0) {
					this.box.x = entity.box.x - this.box.width;
				} else {
					this.box.x = entity.box.x + entity.box.width;
				}
				this.velocity.x = 0;
				moveX = 0;
			}
		}

		// Stepwise move in Y axis
		let moveY = this.velocity.y * dt;
		this.onGround = false;
		while (moveY != 0) {
			let delta = clamp(moveY, 0.2, -0.2);
			moveY -= delta;
			this.box.y += delta;

			for (let entity of this.game.entities) {
				let props = entity.props;
				if (!props.platform && !props.wall) continue;

				if (this.velocity.y > 0 && this.box.bottomIntersects(entity.box)) {
					this.box.y = entity.box.y - this.box.height;
					this.velocity.y = 0;
					this.jumpThrusting = false;
					this.onGround = true;
					moveY = 0;
					break;
				} else if (this.velocity.y <= 0 && this.box.intersects(entity.box) && props.wall) {
					this.box.y = entity.box.y + entity.box.height;
					this.velocity.y = 0;
					moveY = 0;
					break;
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

		this.wobbleVelocity.x += (initialVX - this.velocity.x);
		this.wobbleVelocity.y += (initialVY - this.velocity.y);
	}

	draw(ctx: CanvasRenderingContext2D) {
		let box = this.box;
		let shift = -this.velocity.x * 0.03 + this.wobble.x;
		let stretch = this.velocity.y * 0.01 - this.wobble.y;
		let scaleY = Math.exp(stretch);
		let scaleX = 1 / scaleY;

		let w = box.width * scaleX;
		let h = box.height * scaleY;
		let x = box.x - (w - box.width) / 2;
		let y = box.y - (h - box.height);

		ctx.lineWidth = 0.1;
		ctx.strokeStyle = "black";
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.moveTo(x + shift, y);
		ctx.lineTo(x + shift + w, y);
		ctx.lineTo(x + w, y + h);
		ctx.lineTo(x, y + h);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}
}
